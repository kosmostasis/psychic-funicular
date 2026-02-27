import Link from "next/link";
import {
  simulatorEvents,
  simulatorConversations,
  getRecognitionEvents,
  getEcosystemIntelEvents,
} from "@swarm-cdp/simulator-data";

export default function HomePage() {
  const open = simulatorConversations.filter((c) => c.status === "open" || c.status === "waiting").length;
  const recognition = getRecognitionEvents().length;
  const intel = getEcosystemIntelEvents().length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">
          Community Data Platform
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Privacy-respecting observability for Swarm community. Simulation data
          — all six channels (GitHub, Discord, X, Reddit, LinkedIn, YouTube).
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Link
          href="/inbox"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold">Inbox</h2>
          <p className="mt-1 text-[var(--muted)]">
            {simulatorConversations.length} conversations, {open} need attention
          </p>
          <p className="mt-2 text-sm text-[var(--accent)]">View triage →</p>
        </Link>
        <Link
          href="/recognition"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold">Contributor Recognition</h2>
          <p className="mt-1 text-[var(--muted)]">
            {recognition} praise / PR / helpful signals
          </p>
          <p className="mt-2 text-sm text-[var(--accent)]">View recognition →</p>
        </Link>
        <Link
          href="/ecosystem-intel"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold">Ecosystem Intel</h2>
          <p className="mt-1 text-[var(--muted)]">
            {intel} mentions, announcements, ecosystem signals
          </p>
          <p className="mt-2 text-sm text-[var(--accent)]">View intel →</p>
        </Link>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Events by source</h2>
        <ul className="mt-3 flex flex-wrap gap-4 text-sm">
          {["github", "discord", "x", "reddit", "linkedin", "youtube"].map(
            (source) => {
              const count = simulatorEvents.filter((e) => e.source === source).length;
              return (
                <li key={source}>
                  <span className="rounded bg-[var(--border)] px-2 py-0.5 font-mono">
                    {source}
                  </span>{" "}
                  {count}
                </li>
              );
            }
          )}
        </ul>
      </div>
    </div>
  );
}
