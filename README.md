# Swarm Community Data Platform

Privacy-respecting community observability and triage for Swarm Foundation. Tracks contributor engagement across **X, GitHub, Reddit, LinkedIn, Discord, and YouTube** with a simulation-first design.

## Run on localhost

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:3000**.

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
