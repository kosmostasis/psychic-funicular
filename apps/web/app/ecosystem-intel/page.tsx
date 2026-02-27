import Link from "next/link";
import { getEcosystemIntelEvents } from "@swarm-cdp/simulator-data";

export default function EcosystemIntelPage() {
  const events = getEcosystemIntelEvents();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Ecosystem Intel</h1>
        <p className="text-[var(--muted)]">
          Mentions, announcements, and high-signal ecosystem signals.
        </p>
      </div>

      <div className="space-y-4">
        {events.map((e) => (
          <article
            key={e.event_id}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="rounded bg-[var(--border)] px-2 py-0.5 font-mono">
                {e.source}
              </span>
              <span>{e.event_type}</span>
              {(e.labels ?? []).map((l) => (
                <span key={l} className="rounded bg-[var(--border)] px-1.5 py-0.5">
                  {l}
                </span>
              ))}
              <time dateTime={e.occurred_at}>
                {new Date(e.occurred_at).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-2 font-medium">{e.actor.handle}</p>
            {e.content && (
              <p className="mt-1 text-[var(--muted)]">&ldquo;{e.content}&rdquo;</p>
            )}
            <a
              href={e.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-[var(--accent)]"
            >
              View original →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
