/** Canonical event schema — immutable ingestion model. */

export type Source =
  | "discord"
  | "github"
  | "x"
  | "reddit"
  | "linkedin"
  | "youtube"
  | "telegram"
  | "other";

export type EventType =
  | "mention"
  | "question"
  | "support_request"
  | "bug_report"
  | "feature_request"
  | "praise"
  | "criticism"
  | "spam_scam"
  | "pull_request"
  | "issue_opened"
  | "issue_commented"
  | "release"
  | "announcement"
  | "dm";

export type Visibility = "public" | "community" | "internal";

export interface Actor {
  handle: string;
  platformUserId?: string;
  displayName?: string;
  profileUrl?: string;
  actorType?: "individual" | "org" | "bot" | "unknown";
}

export interface EventTargets {
  repo?: string;
  channel?: string;
  post?: string;
  issue?: string;
  url?: string;
}

export interface PrivacyFlags {
  pii_possible?: boolean;
  dm?: boolean;
  sensitive_topic?: boolean;
}

export interface CommunityEvent {
  event_id: string;
  source: Source;
  event_type: EventType;
  occurred_at: string; // ISO
  ingested_at: string; // ISO
  actor: Actor;
  targets?: EventTargets;
  content?: string;
  content_hash?: string;
  permalink: string;
  visibility: Visibility;
  privacy_flags?: PrivacyFlags;
  labels?: string[];
  thread_id?: string;
  conversation_id?: string;
  raw_payload_ref?: string;
}

export type ConversationStatus = "open" | "waiting" | "resolved" | "ignored";
export type Priority = "p0" | "p1" | "p2" | "p3";

export interface Conversation {
  conversation_id: string;
  source: Source;
  root_permalink: string;
  status: ConversationStatus;
  priority: Priority;
  assigned_to?: string;
  sla_due_at?: string;
  summary?: string;
  resolution?: string;
  event_ids: string[];
}

export interface Topic {
  topic_id: string;
  name: string;
  description?: string;
  owners?: string[];
}
