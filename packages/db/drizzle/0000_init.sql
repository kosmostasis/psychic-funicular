-- M2: events (append-only), conversations (mutable triage), audit_log
CREATE TABLE IF NOT EXISTS "events" (
  "event_id" text PRIMARY KEY NOT NULL,
  "source" varchar(32) NOT NULL,
  "native_id" text NOT NULL,
  "event_type" varchar(64) NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "ingested_at" timestamp with time zone NOT NULL,
  "actor" jsonb NOT NULL,
  "targets" jsonb,
  "content" text,
  "content_hash" varchar(64),
  "permalink" text NOT NULL,
  "visibility" varchar(32) NOT NULL,
  "privacy_flags" jsonb,
  "labels" jsonb,
  "thread_id" text,
  "conversation_id" text,
  "raw_payload_ref" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "events_source_native_idx" ON "events" ("source", "native_id");

CREATE TABLE IF NOT EXISTS "conversations" (
  "conversation_id" text PRIMARY KEY NOT NULL,
  "source" varchar(32) NOT NULL,
  "root_permalink" text NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'open',
  "priority" varchar(8) NOT NULL DEFAULT 'p2',
  "assigned_to" text,
  "sla_due_at" timestamp with time zone,
  "summary" text,
  "resolution" text,
  "event_ids" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  "actor_id" text NOT NULL,
  "entity_type" varchar(32) NOT NULL,
  "entity_id" text NOT NULL,
  "field" varchar(64) NOT NULL,
  "old_value" text,
  "new_value" text
);
