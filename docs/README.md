# Swarm CDP — M1 documentation

M1 deliverables for taxonomy, triage workflow, and connector approach. **Do not edit** the source plan file; these docs are the repo source of truth for implementation.

| Doc | Purpose |
|-----|--------|
| [taxonomy-v0.md](./taxonomy-v0.md) | Controlled vocabulary v0 (product-area, intent, urgency, risk) + assignment rules |
| [adr-001-triage-status-state-machine.md](./adr-001-triage-status-state-machine.md) | ADR: conversation/task status and outcome state machine |
| [adr-002-connectors-discord-x.md](./adr-002-connectors-discord-x.md) | ADR: Discord + X ingestion, failure modes, graceful degradation |
| [design-language.md](./design-language.md) | Typography only: Inter (ethswarm.org); UI otherwise unchanged |

Implementation touchpoints: `packages/core` (extend types), future `apps/workers`, `apps/web` workbench.
