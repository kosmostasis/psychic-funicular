import Link from "next/link";
import { getRecognitionEvents } from "@swarm-cdp/simulator-data";

export default function RecognitionPage() {
  const events = getRecognitionEvents();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Contributor Recognition</h1>
        <p className="text-[var(--muted)]">
          Praise, helpful interactions, and merged PR contributions.
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
              <time dateTime={e.occurred_at}>
                {new Date(e.occurred_at).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-2 font-medium">
              {e.actor.handle}
              {e.actor.profileUrl && (
                <a
                  href={e.actor.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-[var(--accent)]"
                >
                  Profile
                </a>
              )}
            </p>
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
