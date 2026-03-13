import { getDb, events, conversations, eq } from "@swarm-cdp/db";

type EventInput = {
  event_id: string;
  source: string;
  native_id: string;
  event_type: string;
  occurred_at: string;
  ingested_at: string;
  actor: object;
  targets?: object;
  content?: string | null;
  permalink: string;
  visibility: string;
  thread_id?: string | null;
  conversation_id?: string | null;
  labels?: string[] | null;
};

export async function ingestEvent(ev: EventInput): Promise<"inserted" | "skipped"> {
  const db = getDb();
  const conversationId = ev.conversation_id ?? `conv-${ev.source}-${ev.native_id}`;
  try {
    await db.insert(events).values({
      eventId: ev.event_id,
      source: ev.source,
      nativeId: ev.native_id,
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
      conversationId,
      rawPayloadRef: null,
    });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("already exists")) {
      return "skipped";
    }
    throw err;
  }
  const [existing] = await db.select().from(conversations).where(eq(conversations.conversationId, conversationId));
  if (!existing) {
    await db.insert(conversations).values({
      conversationId,
      source: ev.source,
      rootPermalink: ev.permalink,
      status: "open",
      priority: "p2",
      eventIds: [ev.event_id],
    }).onConflictDoNothing({ target: [conversations.conversationId] });
  } else {
    const eventIds = [...new Set([...(existing.eventIds ?? []), ev.event_id])];
    if (eventIds.length !== (existing.eventIds ?? []).length) {
      await db.update(conversations).set({ eventIds, updatedAt: new Date() }).where(eq(conversations.conversationId, conversationId));
    }
  }
  return "inserted";
}
