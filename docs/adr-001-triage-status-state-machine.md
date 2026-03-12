# ADR-001: Triage status and outcome state machine

**Status:** Proposed (M1)  
**Date:** 2026-03-12  
**Context:** Scope TODO §2 — state machine: **new → triaged → assigned → responded | escalated | converted | closed**.  
**Current code:** `ConversationStatus = "open" | "waiting" | "resolved" | "ignored"` in `packages/core/src/events.ts`.

## Decision

Adopt a **triage-oriented state machine** on the mutable conversation (or task) entity. Replace the current four statuses with the Scope flow for MVP; map legacy simulator values for backward compatibility until data migration.

## States

| State | Meaning | Typical next actions |
|-------|---------|----------------------|
| `new` | Ingested, not yet triaged | Set taxonomy, severity, assign |
| `triaged` | Categorized; may be unassigned | Assign owner or move to responded if no reply needed |
| `assigned` | Owner responsible | Respond on platform or escalate |
| `responded` | Public/community reply sent | Close or convert if CRM follow-up |
| `escalated` | Handed to DevRel/leadership | Track in runbook; optional sub-state later |
| `converted` | Logged for CRM/sales pipeline | Out of active triage queue |
| `closed` | No further action | Archived; retained per policy |

## Transitions (allowed edges)

```text
                    ┌─────────────┐
                    │   closed    │
                    └─────────────┘
                           ▲
                           │
new ──► triaged ──► assigned ──► responded ──► converted
  │         │           │            │
  │         │           └────────────┴──► escalated ──► closed
  │         │
  └────────────────────────────────────────► closed   (spam/ignore)
```

- **new → triaged:** Taxonomy v0 minimum filled (product_area + intent).
- **triaged → assigned:** assignee set.
- **assigned → responded:** Operator records that a reply was posted (permalink optional).
- **assigned → escalated:** DevRel handoff (product rule in workbench).
- **responded → converted:** CRM/outcome logged.
- **responded → closed:** Resolved without CRM step.
- **Any → closed:** Ignore/spam/duplicate with reason code (optional field).

## Legacy mapping (simulator → v0)

| Current (`ConversationStatus`) | Maps to |
|--------------------------------|--------|
| `open` | `new` or `triaged` (if already categorized in fixture) |
| `waiting` | `assigned` (waiting on external party) |
| `resolved` | `closed` or `responded` |
| `ignored` | `closed` with reason `ignored` |

*M2 migration: one-time script or dual-read until fixtures updated.*

## API / audit

- Every transition is **append-only in audit log**: who, when, from, to, optional note.
- Invalid transitions return **409** with allowed transitions in body (optional).

## Consequences

- **Positive:** Aligns with Scope acceptance criteria; clear escalation path; digest can filter by state.
- **Negative:** Breaking change for `ConversationStatus`; simulator and inbox UI must be updated in M2.
- **Neutral:** Sub-states (e.g. escalated → awaiting_devrel) can be added later without changing top-level machine.

## Alternatives considered

1. **Keep open/waiting/resolved** — Rejected: does not model escalation or CRM conversion.
2. **State + substate enum** — Deferred: add if escalated queue needs more granularity.
3. **Free-form status string** — Rejected: breaks reporting and RBAC.

## Implementation notes

- Core: extend or replace `ConversationStatus` with the v0 union; add optional `closed_reason`, `escalated_to`.
- Web: workbench dropdown/buttons only expose valid transitions from current state.
