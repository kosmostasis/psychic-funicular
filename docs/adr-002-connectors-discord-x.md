# ADR-002: Connectors — Discord and X (Twitter)

**Status:** Proposed (M1)  
**Date:** 2026-03-12  
**Context:** Scope prioritizes **Discord + X** for MVP ingestion; GitHub next. NFRs require failure modes and graceful degradation.

## Decision

- **MVP channel set:** Discord + X only for v0 connectors; simulator remains for CI, local dev, and channels without API access.
- **Ingestion pattern:** Append-only normalized events into store with **idempotency** on `(source, native_id)` (or platform message/tweet ID).
- **Discord:** Prefer **Gateway (WebSocket) + bot** for real-time messages; document **polling fallback** where Gateway is not viable.
- **X:** Use **official API** within tier limits; **no scraping** as primary path (ToS/risk). Manual import or simulator fallback when rate-limited or unavailable.

## Discord

### Options

| Approach | Pros | Cons |
|----------|------|------|
| **Bot + Gateway** | Real-time, rich events (reactions, edits) | Requires persistent connection, ops complexity |
| **Bot + HTTP polling** | Simpler deploy | Delayed, rate limits, misses edits |
| **Webhook-only** | Easy for specific channels | Not full history; config per channel |

**Recommendation:** Gateway for production triage queue; polling worker for dev or restricted environments.

### Failure modes

| Failure | Degradation |
|---------|-------------|
| Gateway disconnect | Exponential backoff reconnect; buffer or drop with metric |
| Bot missing permission | Log channel ID + error; surface in workbench “connector error” |
| Channel deleted / bot kicked | Stop ingesting; mark source stale |
| Rate limit (HTTP) | Backoff; queue with Redis if adopted |

### Idempotency

- Key: `discord` + `message.id` (snowflake) as `native_id` in raw ref; normalized `event_id` hash or UUID from deterministic payload.

## X (Twitter)

### Options

| Approach | Pros | Cons |
|----------|------|------|
| **API v2** (filtered stream or recent search) | Compliant, structured | Tier limits, cost |
| **Polling search** | Works on lower tiers | Strict rate limits; delayed |
| **Simulator only** | Zero API dependency | No live X in pilot |

**Recommendation:** Start with **recent search / mentions** on a schedule if stream not available; feature-flag noisy sources per M4.

### Rate limits and ToS

- Scope risk: **X/LinkedIn ToS and rate limits** — document caps in runbook; never rely on scraping for production.
- **Graceful degradation:** If quota exceeded, pause ingestion, alert, keep queue serving last-known events; optional **manual CSV import** for critical threads.

### Failure modes

| Failure | Degradation |
|---------|-------------|
| 429 rate limit | Pause job; resume after `reset` header |
| Auth revoked | Mark connector unhealthy; operator notification |
| Account suspended | Stop worker; read-only historical data only |
| API schema change | Version adapter; simulator tests lock shape |

### Idempotency

- Key: `x` + tweet/post id as `native_id`; same event must not duplicate in append-only store.

## Shared ingestion contract

1. **Normalize** to `CommunityEvent` (+ thread/conversation grouping).
2. **Metadata-first** by default; raw content storage behind flag/retention policy.
3. **Privacy:** apply `PrivacyFlags`; sensitive topics flagged for restricted roles (Scope privacy).
4. **Simulator:** remains source for E2E tests and demo without API keys.

## Runbook touchpoints (M3)

- Env vars: bot token, app keys, webhook secrets; rotation procedure.
- Incident: connector down → status page or banner in workbench; digest excludes stale sources with disclaimer.

## Consequences

- **Positive:** Clear MVP boundary; idempotent store; aligns with monorepo plan (`apps/workers`).
- **Negative:** X live ingestion may be limited by tier; pilot may be Discord-heavy initially.
- **Neutral:** GitHub connector deferred; same pattern applies when added.

## Alternatives considered

1. **Poll only for Discord** — Accepted as fallback only; Gateway preferred for latency.
2. **Third-party aggregation** — Deferred; increases vendor and privacy surface.
3. **Scrape X** — Rejected for primary path due to ToS and instability.
