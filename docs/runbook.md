# Swarm CDP Runbook (M3)

## Overview

Internal runbook for operating the Swarm Community Data Platform during the MVP + pilot phases.

- **Audience:** community operators, DevRel, and on-call engineers.
- **Scope:** starting/stopping the stack, running ingestion, triage, weekly digest, and exports.

---

## 1. Starting the stack locally

From the repo root:

```bash
docker compose -f infra/docker-compose.yml up -d   # start Postgres
pnpm install                                      # first run
pnpm --filter @swarm-cdp/db db:push              # apply schema
pnpm dev                                         # start web (Next.js)
```

App will be available at `http://localhost:3000`.

Key routes:

- `/` — overview
- `/inbox` — triage workbench (DB-backed)
- `/api/events` — list recent events (JSON)
- `/api/conversations` — list conversations (JSON)

---

## 2. Ingestion: Discord & X

### 2.1 Discord worker

Environment:

- `DISCORD_BOT_TOKEN` — bot token with read access
- `DISCORD_CHANNEL_IDS` — comma-separated channel IDs to ingest

Build workers then run:

```bash
pnpm --filter @swarm-cdp/workers build
DISCORD_BOT_TOKEN=... DISCORD_CHANNEL_IDS=123,456 pnpm --filter @swarm-cdp/workers ingest:discord
```

Notes:

- Idempotent by `(source, native_id)` — safe to rerun.
- On failure, worker logs channel + error and continues for others.

### 2.2 X (Twitter) worker

Environment:

- `X_BEARER_TOKEN` — API v2 bearer token
- `X_USER_ID` — numeric user ID for the timeline

```bash
pnpm --filter @swarm-cdp/workers build
X_BEARER_TOKEN=... X_USER_ID=... pnpm --filter @swarm-cdp/workers ingest:x
```

Notes:

- Handles 429 rate-limit with a clear error.
- Idempotent by `(source, native_id)`.

---

## 3. Seeding with simulator data

For demos or local-only testing, seed DB from fixtures:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or use the button in the Inbox workbench when no conversations exist.

---

## 4. Triage workbench

- Navigate to `/inbox`.
- Left pane: list of conversations (channel, status, priority, owner).
- Right pane: triage form (status, priority, owner, SLA due date, summary, resolution) and audit log.

Updates:

- Edits send `PATCH /api/conversations/:id` and write to `audit_log`.
- RBAC stub: header `x-cdp-role` controls permissions (`viewer`, `operator`, `admin`).
- Actor id for audit: header `x-cdp-actor-id` (string identifier such as handle or email prefix).

---

## 5. Weekly digest (M3)

The weekly digest is available as Markdown via API.

### 5.1 One-off run

```bash
curl "http://localhost:3000/api/digest/weekly?days=7" \
  -H "x-cdp-role: operator" \
  -o weekly-digest.md
```

- Default period is last 7 days; change with `days=` query param.
- Output is Markdown with:
  - Volume by channel
  - Sample of notable threads with links and status/priority

To consume as JSON:

```bash
curl "http://localhost:3000/api/digest/weekly?days=7&format=json" \
  -H "x-cdp-role: operator"
```

### 5.2 Scheduling (pilot suggestion)

Use a cron on the host that runs the above `curl` and posts into Mattermost/Slack or email.

---

## 6. CSV export (M3)

Conversations can be exported in a CRM-friendly CSV:

```bash
curl "http://localhost:3000/api/export/conversations?format=csv" \
  -H "x-cdp-role: operator" \
  -o conversations-export.csv
```

Columns:

- `conversation_id`
- `source`
- `root_permalink`
- `status`
- `priority`
- `assigned_to`
- `sla_due_at`
- `summary`
- `resolution`
- `owner_hint`

To fetch the same data as JSON:

```bash
curl "http://localhost:3000/api/export/conversations?format=json" \
  -H "x-cdp-role: operator"
```

---

## 7. Operational notes & troubleshooting

- If `/inbox` shows a DB error banner:
  - Verify Postgres is running: `docker ps` (service `postgres`).
  - Apply migrations: `pnpm --filter @swarm-cdp/db db:push`.
- If `/api/events` or `/api/conversations` return empty:
  - Run Discord/X workers or `/api/seed` depending on environment.
- For rate limits or connector failures:
  - Check worker logs.
  - Reduce frequency or limit channels; document in ADR-002.

---

## 8. Next steps (M4 pilot)

During the pilot:

- Enable/disable sources per environment (by choosing which workers run).
- Tune channel and keyword selection.
- Review weekly digest and exports with stakeholders; adjust taxonomy and fields as needed.
- Experiment with `/api/assist/auto-tags` as a suggestion-only helper:
  - `POST /api/assist/auto-tags` with `{ content }` or `{ event_id }` returns `suggestions: string[]`.
  - Treat results as **draft tags** for taxonomy fields; do not auto-apply without human review.


