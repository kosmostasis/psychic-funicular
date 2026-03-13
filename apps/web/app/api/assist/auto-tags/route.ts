import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { events } from "@swarm-cdp/db";
import { eq } from "drizzle-orm";

/**
 * Auto-tag suggestion helper (M4 pilot).
 *
 * This is intentionally simple and rule-based for MVP; a future LLM-backed
 * implementation can replace the scoring logic but keep the same JSON shape.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text: string | undefined = body.content;
    const eventId: string | undefined = body.event_id;

    let content = text ?? "";
    if (!content && eventId) {
      const [row] = await db
        .select()
        .from(events)
        .where(eq(events.eventId, eventId))
        .limit(1);
      content = row?.content ?? "";
    }

    const lc = content.toLowerCase();
    const tags: string[] = [];

    if (lc.includes("stamp")) tags.push("product_area:stamps");
    if (lc.includes("feed")) tags.push("product_area:feeds");
    if (lc.includes("node") || lc.includes("rpc")) tags.push("product_area:node-ops");
    if (lc.includes("doc") || lc.includes("readme")) tags.push("product_area:docs");
    if (lc.includes("price") || lc.includes("cost") || lc.includes("billing")) tags.push("product_area:billing-pricing");

    if (lc.includes("?")) tags.push("intent:question");
    if (lc.includes("bug") || lc.includes("error") || lc.includes("crash")) tags.push("intent:bug_report");
    if (lc.includes("feature") || lc.includes("would be nice")) tags.push("intent:feature_request");
    if (lc.includes("thank") || lc.includes("great") || lc.includes("love ")) tags.push("intent:praise");

    const suggestions = Array.from(new Set(tags));

    return NextResponse.json({
      content_used: content.slice(0, 500),
      suggestions,
    });
  } catch (e) {
    console.error("POST /api/assist/auto-tags", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error generating suggestions" },
      { status: 500 }
    );
  }
}

