# Taxonomy v0

**Status:** Draft for M1 sign-off  
**Scope alignment:** Replace ad-hoc `labels[]` on `CommunityEvent` with structured triage fields on the **conversation/task** entity (mutable), while keeping optional free-form labels for edge cases.

## Goals

- **Single schema** for reporting, digest, and CSV export (CRM-ready).
- **Controlled vocabulary** so operators tag consistently; reduce noise in weekly digests.
- **Required vs optional** fields tuned so triage is fast (M2 workbench).

## Current baseline

- `CommunityEvent.labels?: string[]` — unstructured; used in simulator for routing (e.g. `praise`, `ecosystem`).
- `Conversation` has `status`, `priority`, `assigned_to`, `sla_due_at` — no taxonomy dimensions yet.

## Taxonomy dimensions (v0)

### 1. Product area (`product_area`)

**Cardinality:** single-select (one primary area per conversation).  
**Purpose:** Route to right owner; digest grouping.

| Value | When to use |
|-------|-------------|
| `stamps` | Stamps / postage / physical mail product |
| `feeds` | Feeds / data ingestion pipelines |
| `node-ops` | Node operation, hosting, infrastructure |
| `docs` | Documentation, guides, developer experience |
| `sdk-api` | SDKs, APIs, integrations |
| `billing-pricing` | Pricing, plans, payment issues |
| `ecosystem` | Partners, integrations, third-party |
| `general` | Unclear or cross-cutting — re-triage later |

*Extend via controlled table in DB; avoid unbounded strings in v0.*

### 2. Intent (`intent`)

**Cardinality:** single-select.  
**Purpose:** Distinguish question vs bug vs feature ask; drives SLA and response template.

| Value | When to use |
|-------|-------------|
| `question` | How-to, clarification |
| `bug_report` | Something broken |
| `feature_request` | Enhancement ask |
| `support_request` | Account/access/deployment help |
| `feedback` | Opinion without clear action |
| `praise` | Positive signal (can link to Recognition) |
| `spam_scam` | Discard path; mark sensitive if needed |
| `other` | After first touch, refine |

*Aligns with existing `EventType` where possible; intent is triage-facing, event_type remains ingestion-facing.*

### 3. Urgency (`urgency`)

**Cardinality:** single-select.  
**Purpose:** Queue ordering; complements `Priority` (p0–p3) with human-readable urgency.

| Value | When to use |
|-------|-------------|
| `critical` | Outage, security, blocking many users |
| `high` | Deadline or widespread impact |
| `normal` | Default |
| `low` | Nice-to-have, no deadline |

*Map to `Priority`: e.g. critical/high → p0/p1; normal → p2; low → p3. Operators set both until we collapse to one field.*

### 4. Risk / sensitive (`risk_flags`)

**Cardinality:** multi-select (flags).  
**Purpose:** Privacy, escalation, digest redaction.

| Flag | When to use |
|------|-------------|
| `pii_possible` | May contain personal data — minimize retention/display |
| `dm` | Originated from or contains DM context |
| `sensitive_topic` | Legal, personnel, security — restrict visibility |
| `escalation_candidate` | DevRel or leadership should review |

*Mirrors `PrivacyFlags` on events; on conversation these are **triage decisions** and can override display/export.*

## Storage options (for ADR / M2)

1. **Structured fields on Conversation** — `product_area`, `intent`, `urgency`, `risk_flags[]` — simplest for API CRUD.
2. **Controlled vocabulary tables** — `taxonomy_term` + `conversation_taxonomy` — better if many dimensions or per-org overrides.
3. **Hybrid** — structured enums in core types + DB check constraints; optional `labels[]` retained for migration and one-off tags.

**Recommendation:** Hybrid — add optional structured fields to `Conversation` (or a `Task` entity when introduced); keep `labels[]` on events for ingestion hints only.

## Assignment UI (design notes for M2)

- **Product area + intent:** required before moving out of `new` (see status ADR).
- **Urgency:** default `normal`; bump for SLA.
- **Risk flags:** multi-select chips; show warning when `sensitive_topic` or `pii_possible` checked.
- **Empty state:** “Uncategorized” allowed only in `new`; workbench prompts to complete before assign.

## Open blanks (from Scope)

Fill before locking M2: retention __ days, pilot __ weeks, time-to-triage __ minutes. Taxonomy v0 can ship before these numbers are final.

## Sign-off

- [ ] Operator persona — tag list sufficient for daily triage  
- [ ] DevRel — escalation_candidate + intent cover handoff  
- [ ] Leadership — product_area + intent sufficient for digest sections  
