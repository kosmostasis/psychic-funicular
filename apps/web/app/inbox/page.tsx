import Link from "next/link";
import {
  simulatorConversations,
  simulatorEvents,
} from "@swarm-cdp/simulator-data";

export default function InboxPage() {
  const byId = new Map(simulatorEvents.map((e) => [e.event_id, e]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Inbox</h1>
        <p className="text-[var(--muted)]">
          Conversations across channels. Assign status and priority.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--card)]">
            <tr>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {simulatorConversations.map((c) => {
              const firstEvent = c.event_ids[0] ? byId.get(c.event_ids[0]) : null;
              return (
                <tr
                  key={c.conversation_id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="rounded bg-[var(--border)] px-2 py-0.5 font-mono text-xs">
                      {c.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.summary ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "open" || c.status === "waiting"
                          ? "text-[var(--warning)]"
                          : c.status === "resolved"
                            ? "text-[var(--success)]"
                            : "text-[var(--muted)]"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{c.priority}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {c.assigned_to ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={c.root_permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)]"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
