import { NextResponse } from "next/server";
import { db } from "../lib/db";
import { events, conversations } from "@swarm-cdp/db";
import { desc, eq } from "drizzle-orm";
import { getRoleFromRequest } from "../lib/rbac";

function rowToEvent(row: typeof events.$inferSelect) {
  return {
    event_id: row.eventId,
    source: row.source,
    native_id: row.nativeId,
    event_type: row.eventType,
    occurred_at: row.occurredAt.toISOString(),
    ingested_at: row.ingestedAt.toISOString(),
    actor: row.actor,
    targets: row.targets ?? undefined,
    content: row.content ?? undefined,
    permalink: row.permalink,
    visibility: row.visibility,
    labels: row.labels ?? undefined,
    thread_id: row.threadId ?? undefined,
    conversation_id: row.conversationId ?? undefined,
  };
}

export async function GET() {
  try {
    const rows = await db.select().from(events).orderBy(desc(events.ingestedAt)).limit(500);
    return NextResponse.json(rows.map(rowToEvent));
  } catch (e) {
    console.error("GET /api/events", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

/** Idempotent ingest: POST body = { events: CommunityEvent[] }. Uses source + native_id. */
export async function POST(request: Request) {
  const role = getRoleFromRequest(request);
  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const eventsPayload = Array.isArray(body.events) ? body.events : [body];
    let inserted = 0;
    for (const ev of eventsPayload) {
      const nativeId = ev.native_id ?? ev.event_id;
      const eventId = ev.event_id ?? `evt-${ev.source}-${String(nativeId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      const conversationId = ev.conversation_id ?? `conv-${ev.source}-${String(nativeId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      try {
        await db.insert(events).values({
          eventId,
          source: ev.source,
          nativeId: String(nativeId),
          eventType: ev.event_type,
          occurredAt: new Date(ev.occurred_at),
          ingestedAt: ev.ingested_at ? new Date(ev.ingested_at) : new Date(),
          actor: ev.actor,
          targets: ev.targets ?? null,
          content: ev.content ?? null,
          contentHash: ev.content_hash ?? null,
          permalink: ev.permalink,
          visibility: ev.visibility,
          privacyFlags: ev.privacy_flags ?? null,
          labels: ev.labels ?? null,
          threadId: ev.thread_id ?? null,
          conversationId: ev.conversation_id ?? conversationId,
          rawPayloadRef: ev.raw_payload_ref ?? null,
        }).onConflictDoNothing({ target: [events.source, events.nativeId] });
        inserted++;
      } catch (err) {
        if (String(err).includes("duplicate") || String(err).includes("unique")) {
          continue;
        }
        throw err;
      }
      const [existingConv] = await db.select().from(conversations).where(eq(conversations.conversationId, conversationId));
      if (!existingConv) {
        await db.insert(conversations).values({
          conversationId,
          source: ev.source,
          rootPermalink: ev.permalink,
          status: "open",
          priority: "p2",
          eventIds: [eventId],
        }).onConflictDoNothing({ target: [conversations.conversationId] });
      } else {
        const eventIds = [...new Set([...(existingConv.eventIds ?? []), eventId])];
        if (eventIds.length !== (existingConv.eventIds ?? []).length) {
          await db.update(conversations).set({ eventIds, updatedAt: new Date() }).where(eq(conversations.conversationId, conversationId));
        }
      }
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    console.error("POST /api/events", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
