import type { CommunityEvent, Conversation } from "@swarm-cdp/core";
import { simulatorEvents } from "./data/events.js";
import { simulatorConversations } from "./data/conversations.js";

export { simulatorEvents, simulatorConversations };

export function getEventsBySource(source: string): CommunityEvent[] {
  return simulatorEvents.filter((e) => e.source === source);
}

export function getConversationsByStatus(status: string): Conversation[] {
  return simulatorConversations.filter((c) => c.status === status);
}

export function getRecognitionEvents(): CommunityEvent[] {
  return simulatorEvents.filter(
    (e) => e.event_type === "praise" || e.event_type === "pull_request" || e.labels?.includes("praise")
  );
}

export function getEcosystemIntelEvents(): CommunityEvent[] {
  return simulatorEvents.filter(
    (e) =>
      e.event_type === "mention" ||
      e.labels?.includes("ecosystem") ||
      e.event_type === "announcement"
  );
}
