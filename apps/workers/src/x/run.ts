/**
 * X (Twitter) ingestion worker.
 * Env: X_BEARER_TOKEN. Optional: X_USER_ID or X_QUERY for timeline/search.
 * Uses Twitter API v2; rate limits apply. Writes normalized events to DB (idempotent).
 */
import { xTweetToEvent } from "../lib/normalize.js";
import { ingestEvent } from "../lib/ingest.js";

const X_API = "https://api.twitter.com/2";

async function fetchUserTweets(
  bearerToken: string,
  userId: string,
  maxResults = 50
): Promise<{ data?: { id: string; text: string; created_at: string; author_id?: string; conversation_id?: string }[]; includes?: { users?: { id: string; username: string; name?: string }[] } }> {
  const url = new URL(`${X_API}/users/${userId}/tweets`);
  url.searchParams.set("max_results", String(Math.min(maxResults, 100)));
  url.searchParams.set("tweet.fields", "created_at,author_id,conversation_id");
  url.searchParams.set("user.fields", "username,name");
  url.searchParams.set("expansions", "author_id");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("X API rate limit exceeded");
    throw new Error(`X API ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  const userId = process.env.X_USER_ID;
  if (!bearerToken) {
    console.error("X_BEARER_TOKEN is required");
    process.exit(1);
  }
  if (!userId) {
    console.log("X_USER_ID not set; set it to a user ID to fetch their timeline.");
    process.exit(0);
  }
  let inserted = 0;
  let skipped = 0;
  try {
    const resp = await fetchUserTweets(bearerToken, userId);
    const tweetList = resp.data ?? [];
    const users = (resp.includes?.users ?? []) as { id: string; username: string; name?: string }[];
    const userMap = new Map(users.map((u) => [u.id, u]));
    for (const tweet of tweetList) {
      const user = tweet.author_id ? userMap.get(tweet.author_id) : undefined;
      const ev = xTweetToEvent(tweet, user);
      const payload = {
        ...ev,
        native_id: (ev as { native_id?: string }).native_id ?? ev.event_id,
      };
      const result = await ingestEvent(payload);
      if (result === "inserted") inserted++;
      else skipped++;
    }
  } catch (err) {
    console.error("X ingest error:", err);
    process.exit(1);
  }
  console.log(`X ingest done: ${inserted} inserted, ${skipped} skipped (duplicates).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
