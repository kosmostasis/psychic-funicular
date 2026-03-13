"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Conversation = {
  conversation_id: string;
  source: string;
  root_permalink: string;
  status: string;
  priority: string;
  assigned_to?: string;
  sla_due_at?: string;
  summary?: string;
  resolution?: string;
  event_ids: string[];
};

type AuditEntry = {
  id: string;
  at: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
};

export default function InboxWorkbench() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Conversation>>({});
  const [seeding, setSeeding] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setAudit([]);
      setForm({});
      return;
    }
    (async () => {
      try {
        const [convRes, auditRes] = await Promise.all([
          fetch(`/api/conversations/${encodeURIComponent(selectedId)}`),
          fetch(`/api/audit?entityType=conversation&entityId=${encodeURIComponent(selectedId)}`),
        ]);
        if (convRes.ok) {
          const c = await convRes.json();
          setDetail(c);
          setForm({
            status: c.status,
            priority: c.priority,
            assigned_to: c.assigned_to ?? "",
            sla_due_at: c.sla_due_at?.slice(0, 16) ?? "",
            summary: c.summary ?? "",
            resolution: c.resolution ?? "",
          });
        } else setDetail(null);
        if (auditRes.ok) {
          const a = await auditRes.json();
          setAudit(Array.isArray(a) ? a : []);
        } else setAudit([]);
      } catch {
        setDetail(null);
        setAudit([]);
      }
    })();
  }, [selectedId]);

  const seedSimulator = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  const saveTriage = async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          priority: form.priority,
          assigned_to: form.assigned_to || undefined,
          sla_due_at: form.sla_due_at ? new Date(form.sla_due_at).toISOString() : undefined,
          summary: form.summary || undefined,
          resolution: form.resolution || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setDetail(updated);
      const auditRes = await fetch(`/api/audit?entityType=conversation&entityId=${encodeURIComponent(selectedId)}`);
      if (auditRes.ok) setAudit(await auditRes.json());
      fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Inbox</h1>
        <p className="text-[var(--muted)]">
          Triage workbench: assign status, priority, and owner. Changes are persisted and audited.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--warning)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--warning)]">
          Could not load conversations. Is Postgres running? Run: <code className="rounded bg-[var(--border)] px-1">docker compose -f infra/docker-compose.yml up -d</code> then{" "}
          <code className="rounded bg-[var(--border)] px-1">pnpm --filter @swarm-cdp/db db:push</code>
        </div>
      )}

      <div className="flex gap-6">
        <div className={`min-w-0 flex-1 overflow-hidden rounded-lg border border-[var(--border)] ${selectedId ? "" : ""}`}>
          {loading ? (
            <div className="px-4 py-8 text-center text-[var(--muted)]">Loading…</div>
          ) : (
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
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                      <span>No conversations yet. Run Discord/X workers or </span>
                      <button
                        type="button"
                        onClick={seedSimulator}
                        disabled={seeding || !!error}
                        className="text-[var(--accent)] hover:underline disabled:opacity-50"
                      >
                        {seeding ? "Seeding…" : "seed with simulator data"}
                      </button>
                      .
                    </td>
                  </tr>
                ) : (
                  conversations.map((c) => (
                    <tr
                      key={c.conversation_id}
                      onClick={() => setSelectedId(c.conversation_id)}
                      className={`cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] ${selectedId === c.conversation_id ? "bg-[var(--card)]" : ""}`}
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
                      <td className="px-4 py-3 text-[var(--muted)]">{c.assigned_to ?? "—"}</td>
                      <td className="px-4 py-3">
                        <a
                          href={c.root_permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {selectedId && (
          <aside className="w-[380px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold">Triage</h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Status</label>
                <select
                  value={form.status ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <option value="open">open</option>
                  <option value="waiting">waiting</option>
                  <option value="resolved">resolved</option>
                  <option value="ignored">ignored</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Priority</label>
                <select
                  value={form.priority ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <option value="p0">p0</option>
                  <option value="p1">p1</option>
                  <option value="p2">p2</option>
                  <option value="p3">p3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Assigned to</label>
                <input
                  type="text"
                  value={form.assigned_to ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  placeholder="handle or team"
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Due date</label>
                <input
                  type="datetime-local"
                  value={form.sla_due_at ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sla_due_at: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Summary</label>
                <input
                  type="text"
                  value={form.summary ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Short summary"
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Resolution</label>
                <textarea
                  value={form.resolution ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
                  placeholder="Resolution notes"
                  rows={2}
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={saveTriage}
                disabled={saving}
                className="w-full rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3">
              <h3 className="text-xs font-medium text-[var(--muted)] mb-2">Audit log</h3>
              <ul className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                {audit.length === 0 ? (
                  <li className="text-[var(--muted)]">No edits yet.</li>
                ) : (
                  audit.map((a) => (
                    <li key={a.id} className="text-[var(--muted)]">
                      <span className="text-[var(--text)]">{a.field}</span>: {a.old_value ?? "—"} → {a.new_value ?? "—"} <span className="text-[var(--muted)]">by {a.actor_id}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
