import { NextResponse } from "next/server";
import { simulatorEvents } from "@swarm-cdp/simulator-data";
import { simulatorConversations } from "@swarm-cdp/simulator-data";
import { db } from "../lib/db";
import { events, conversations } from "@swarm-cdp/db";
import { eq } from "drizzle-orm";

/**
 * Seed DB with simulator data for local dev. Idempotent (uses native_id = event_id).
 */
export async function POST() {
  try {
    let eventsInserted = 0;
    for (const ev of simulatorEvents) {
      const nativeId = (ev as { native_id?: string }).native_id ?? ev.event_id;
      try {
        await db.insert(events).values({
          eventId: ev.event_id,
          source: ev.source,
          nativeId,
          eventType: ev.event_type,
          occurredAt: new Date(ev.occurred_at),
          ingestedAt: new Date(ev.ingested_at),
          actor: ev.actor,
          targets: ev.targets ?? null,
          content: ev.content ?? null,
          permalink: ev.permalink,
          visibility: ev.visibility,
          labels: ev.labels ?? null,
          threadId: ev.thread_id ?? null,
          conversationId: ev.conversation_id ?? null,
          rawPayloadRef: null,
        }).onConflictDoNothing({ target: [events.source, events.nativeId] });
        eventsInserted++;
      } catch {
        // skip duplicate
      }
    }
    for (const c of simulatorConversations) {
      await db.insert(conversations).values({
        conversationId: c.conversation_id,
        source: c.source,
        rootPermalink: c.root_permalink,
        status: c.status,
        priority: c.priority,
        assignedTo: c.assigned_to ?? null,
        slaDueAt: c.sla_due_at ? new Date(c.sla_due_at) : null,
        summary: c.summary ?? null,
        resolution: c.resolution ?? null,
        eventIds: c.event_ids ?? [],
      }).onConflictDoUpdate({
        target: [conversations.conversationId],
        set: {
          status: c.status,
          priority: c.priority,
          assignedTo: c.assigned_to ?? null,
          summary: c.summary ?? null,
          resolution: c.resolution ?? null,
          eventIds: c.event_ids ?? [],
          updatedAt: new Date(),
        },
      });
    }
    return NextResponse.json({ ok: true, eventsInserted });
  } catch (e) {
    console.error("POST /api/seed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
