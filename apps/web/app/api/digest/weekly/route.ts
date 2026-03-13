import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { events, conversations } from "@swarm-cdp/db";
import { desc, gte } from "drizzle-orm";

function isoDaysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "7");
  const since = isoDaysAgo(Number.isFinite(days) && days > 0 ? days : 7);

  try {
    const evRows = await db
      .select()
      .from(events)
      .where(gte(events.occurredAt, since))
      .orderBy(desc(events.occurredAt))
      .limit(500);

    const convRows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(500);

    const byConversation = new Map<string, typeof events.$inferSelect[]>();
    for (const ev of evRows) {
      const cid = ev.conversationId ?? "";
      if (!cid) continue;
      const list = byConversation.get(cid) ?? [];
      list.push(ev);
      byConversation.set(cid, list);
    }

    const sectionLines: string[] = [];
    sectionLines.push(`# Weekly community + ecosystem digest`);
    sectionLines.push(``);
    sectionLines.push(`Period: since ${since.toISOString()}`);
    sectionLines.push(`Total events: ${evRows.length}`);
    sectionLines.push(`Total conversations (recent): ${convRows.length}`);
    sectionLines.push(``);

    const topBySource = new Map<string, number>();
    for (const ev of evRows) {
      topBySource.set(ev.source, (topBySource.get(ev.source) ?? 0) + 1);
    }
    sectionLines.push(`## Volume by channel`);
    for (const [source, count] of topBySource.entries()) {
      sectionLines.push(`- ${source}: ${count}`);
    }
    sectionLines.push(``);

    sectionLines.push(`## Notable threads (sample)`);
    for (const conv of convRows.slice(0, 10)) {
      const evs = byConversation.get(conv.conversationId ?? "") ?? [];
      const first = evs[evs.length - 1] ?? evRows.find((e) => e.conversationId === conv.conversationId);
      const title = (first?.content ?? conv.summary ?? "").slice(0, 140).replace(/\s+/g, " ");
      sectionLines.push(`- [${conv.source}] ${title || "(no summary)"} — status: ${conv.status}, priority: ${conv.priority}`);
      sectionLines.push(`  - Link: ${conv.rootPermalink}`);
    }

    const markdown = sectionLines.join("\n");

    if (searchParams.get("format") === "json") {
      return NextResponse.json({
        markdown,
        stats: {
          since: since.toISOString(),
          events: evRows.length,
          conversations: convRows.length,
        },
      });
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("GET /api/digest/weekly", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

