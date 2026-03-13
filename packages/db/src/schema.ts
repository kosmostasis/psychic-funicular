import {
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Append-only community events from Discord, X, etc.
 * Idempotency: (source, native_id) unique — re-ingesting same native_id is a no-op.
 */
export const events = pgTable("events", {
  eventId: text("event_id").primaryKey(),
  source: varchar("source", { length: 32 }).notNull(),
  nativeId: text("native_id").notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull(),
  actor: jsonb("actor").notNull(),
  targets: jsonb("targets"),
  content: text("content"),
  contentHash: varchar("content_hash", { length: 64 }),
  permalink: text("permalink").notNull(),
  visibility: varchar("visibility", { length: 32 }).notNull(),
  privacyFlags: jsonb("privacy_flags"),
  labels: jsonb("labels").$type<string[]>(),
  threadId: text("thread_id"),
  conversationId: text("conversation_id"),
  rawPayloadRef: text("raw_payload_ref"),
}, (t) => [uniqueIndex("events_source_native_idx").on(t.source, t.nativeId)]);

/**
 * Mutable triage state per conversation.
 */
export const conversations = pgTable("conversations", {
  conversationId: text("conversation_id").primaryKey(),
  source: varchar("source", { length: 32 }).notNull(),
  rootPermalink: text("root_permalink").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  priority: varchar("priority", { length: 8 }).notNull().default("p2"),
  assignedTo: text("assigned_to"),
  slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
  summary: text("summary"),
  resolution: text("resolution"),
  eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Audit log for triage edits: who / when / what field changed.
 */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
  actorId: text("actor_id").notNull(),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: text("entity_id").notNull(),
  field: varchar("field", { length: 64 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
});
