/** Privacy tiers and data minimization (Swarm-aligned). */

export type PrivacyTier = 0 | 1 | 2;

/** Tier 0: metadata only — timestamps, handles, permalinks, event type, topic labels. */
export const TIER_0 = 0 as const;

/** Tier 1: limited text — short snippets for triage, capped length, strip PII where feasible. */
export const TIER_1 = 1 as const;

/** Tier 2: raw content — off by default; only where policy + consent allow; encrypted at rest. */
export const TIER_2 = 2 as const;

export const DEFAULT_PRIVACY_TIER: PrivacyTier = TIER_0;

export const CONTENT_CAP_TIER_1 = 500; // characters

export function applyTierToContent(
  content: string | undefined,
  tier: PrivacyTier
): string | undefined {
  if (content == null) return undefined;
  if (tier === TIER_0) return undefined;
  if (tier === TIER_1)
    return content.slice(0, CONTENT_CAP_TIER_1) + (content.length > CONTENT_CAP_TIER_1 ? "…" : "");
  return content;
}
