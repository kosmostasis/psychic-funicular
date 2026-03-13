/**
 * Discord ingestion worker.
 * Env: DISCORD_BOT_TOKEN, DISCORD_CHANNEL_IDS (comma-separated channel IDs).
 * Fetches recent messages and writes normalized events to DB (idempotent).
 */
import { discordMessageToEvent } from "../lib/normalize.js";
import { ingestEvent } from "../lib/ingest.js";

const DISCORD_API = "https://discord.com/api/v10";

async function fetchChannelMessages(
  token: string,
  channelId: string,
  limit = 50
): Promise<{ id: string; channel_id: string; content?: string; author: { id: string; username: string; global_name?: string; avatar?: string }; timestamp: string; thread?: { id: string }; guild_id?: string }[]> {
  const url = `${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Discord API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelIdsStr = process.env.DISCORD_CHANNEL_IDS ?? "";
  if (!token) {
    console.error("DISCORD_BOT_TOKEN is required");
    process.exit(1);
  }
  const channelIds = channelIdsStr ? channelIdsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (channelIds.length === 0) {
    console.log("DISCORD_CHANNEL_IDS not set; nothing to fetch.");
    process.exit(0);
  }
  let inserted = 0;
  let skipped = 0;
  for (const channelId of channelIds) {
    try {
      const messages = await fetchChannelMessages(token, channelId);
      for (const msg of messages) {
        const ev = discordMessageToEvent(msg, undefined);
        const payload = {
          ...ev,
          native_id: (ev as { native_id?: string }).native_id ?? ev.event_id,
        };
        const result = await ingestEvent(payload);
        if (result === "inserted") inserted++;
        else skipped++;
      }
    } catch (err) {
      console.error(`Channel ${channelId}:`, err);
    }
  }
  console.log(`Discord ingest done: ${inserted} inserted, ${skipped} skipped (duplicates).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
