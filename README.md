# Swarm Community Data Platform

Privacy-respecting community observability and triage for Swarm Foundation. Tracks contributor engagement across **X, GitHub, Reddit, LinkedIn, Discord, and YouTube** with a simulation-first design.

## Run on localhost

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:3000**.

### If the page looks wrong (white background, old “Observe and triage” copy, nav links run together)

That means an **old Next bundle** is still running or CSS didn’t load. Current home should be **dark** with title **“Community Data Platform”** only (no “Pick your path” block).

1. Stop every dev/prod server on port 3000 (and 3001 if you use it).
2. From repo root: `pnpm --filter @swarm-cdp/web dev:clean`  
   Or manually: delete `apps/web/.next`, then `pnpm dev`.
3. Hard refresh the browser (cache disable or Cmd+Shift+R).
4. For production: `pnpm --filter @swarm-cdp/web build` then `pnpm --filter @swarm-cdp/web start` (never `start` without a fresh `build` after pulling changes).

- **Home** — Dashboard with event counts and links to Inbox, Recognition, Ecosystem Intel.
- **Inbox** — Conversations from all channels with status, priority, assignment.
- **Recognition** — Praise and contributor signals (PRs, helpful replies).
- **Ecosystem Intel** — Mentions, announcements, and ecosystem signals.

Data is from the **simulator** (fixtures for all six channels). No API keys or database required to run.

## Stack

- **Monorepo:** pnpm workspaces, Turbo
- **Apps:** Next.js 14 (App Router) for the dashboard
- **Packages:** `@swarm-cdp/core` (event schema, privacy tiers, identity linking), `@swarm-cdp/simulator-data` (fixtures)

## Project structure

- `apps/web` — Next.js dashboard (inbox, recognition, ecosystem-intel)
- `packages/core` — Canonical event types, privacy, identity-linking
- `packages/simulator-data` — Fixture events and conversations for all channels

## Values (Swarm-aligned)

- **Data minimization** by default (metadata-first; raw content off unless needed).
- **Admin-assisted identity linking only** — no automated cross-platform fusion.
- **Behavior-based recognition** — no ideological or influence scoring.
