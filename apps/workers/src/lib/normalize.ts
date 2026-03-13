import type { CommunityEvent, Actor, EventType } from "@swarm-cdp/core";

const DISCORD_EPOCH = 1420070400000;

function discordIdToTimestamp(id: string): number {
  return DISCORD_EPOCH + Number(BigInt(id) >> 22n);
}

/** Normalize a Discord API message to CommunityEvent. */
export function discordMessageToEvent(
  msg: {
    id: string;
    channel_id: string;
    content?: string;
    author: { id: string; username: string; global_name?: string; avatar?: string };
    timestamp: string;
    thread?: { id: string };
    guild_id?: string;
  },
  channelName?: string
): CommunityEvent {
  const occurredAt = new Date(msg.timestamp);
  const nativeId = msg.id;
  const eventId = `evt-discord-${nativeId}`;
  const conversationId = msg.thread?.id ? `conv-discord-${msg.thread.id}` : `conv-discord-${msg.channel_id}-${msg.id}`;
  const permalink = `https://discord.com/channels/${msg.guild_id ?? "@me"}/${msg.channel_id}/${msg.id}`;
  const actor: Actor = {
    handle: msg.author.username,
    platformUserId: msg.author.id,
    displayName: msg.author.global_name ?? msg.author.username,
    actorType: "individual",
  };
  let eventType: EventType = "mention";
  if (msg.content?.match(/\?$/)) eventType = "question";
  if (msg.content?.toLowerCase().includes("thank") || msg.content?.toLowerCase().includes("great")) eventType = "praise";
  return {
    event_id: eventId,
    source: "discord",
    event_type: eventType,
    occurred_at: occurredAt.toISOString(),
    ingested_at: new Date().toISOString(),
    actor,
    targets: { channel: channelName ?? msg.channel_id, url: permalink },
    content: msg.content ?? undefined,
    permalink,
    visibility: "community",
    thread_id: msg.thread?.id,
    conversation_id: conversationId,
    native_id: nativeId,
  } as CommunityEvent & { native_id: string };
}

/** Normalize an X/Twitter API v2 tweet to CommunityEvent. */
export function xTweetToEvent(
  tweet: {
    id: string;
    text: string;
    created_at: string;
    author_id?: string;
    conversation_id?: string;
  },
  user?: { username: string; name?: string; id: string }
): CommunityEvent {
  const nativeId = tweet.id;
  const eventId = `evt-x-${nativeId}`;
  const conversationId = tweet.conversation_id ? `conv-x-${tweet.conversation_id}` : `conv-x-${tweet.id}`;
  const permalink = `https://x.com/${user?.username ?? "i"}/status/${tweet.id}`;
  const actor: Actor = {
    handle: user?.username ?? "unknown",
    platformUserId: tweet.author_id ?? user?.id,
    displayName: user?.name,
    profileUrl: user ? `https://x.com/${user.username}` : undefined,
    actorType: "individual",
  };
  let eventType: EventType = "mention";
  if (tweet.text.includes("?")) eventType = "question";
  return {
    event_id: eventId,
    source: "x",
    event_type: eventType,
    occurred_at: new Date(tweet.created_at).toISOString(),
    ingested_at: new Date().toISOString(),
    actor,
    targets: { url: permalink },
    content: tweet.text,
    permalink,
    visibility: "public",
    conversation_id: conversationId,
    native_id: nativeId,
  } as CommunityEvent & { native_id: string };
}
