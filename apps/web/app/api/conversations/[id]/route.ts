import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { conversations } from "@swarm-cdp/db";
import { eq } from "drizzle-orm";
import { getRoleFromRequest } from "../../lib/rbac";
import { appendAudit } from "../../lib/audit";

function rowToConversation(row: typeof conversations.$inferSelect) {
  return {
    conversation_id: row.conversationId,
    source: row.source,
    root_permalink: row.rootPermalink,
    status: row.status,
    priority: row.priority,
    assigned_to: row.assignedTo ?? undefined,
    sla_due_at: row.slaDueAt?.toISOString() ?? undefined,
    summary: row.summary ?? undefined,
    resolution: row.resolution ?? undefined,
    event_ids: row.eventIds ?? [],
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [row] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.conversationId, id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rowToConversation(row));
  } catch (e) {
    console.error("GET /api/conversations/[id]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = getRoleFromRequest(request);
  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const actorId = request.headers.get("x-cdp-actor-id") ?? "anonymous";
  try {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.conversationId, id));
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const updates: Partial<typeof conversations.$inferInsert> = {};
    const auditEntries: { field: string; oldVal: string | null; newVal: string | null }[] = [];

    if (body.status !== undefined && body.status !== existing.status) {
      updates.status = body.status;
      auditEntries.push({
        field: "status",
        oldVal: existing.status,
        newVal: body.status,
      });
    }
    if (body.priority !== undefined && body.priority !== existing.priority) {
      updates.priority = body.priority;
      auditEntries.push({
        field: "priority",
        oldVal: existing.priority,
        newVal: body.priority,
      });
    }
    if (body.assigned_to !== undefined && body.assigned_to !== (existing.assignedTo ?? undefined)) {
      updates.assignedTo = body.assigned_to ?? null;
      auditEntries.push({
        field: "assigned_to",
        oldVal: existing.assignedTo,
        newVal: body.assigned_to ?? null,
      });
    }
    if (body.sla_due_at !== undefined) {
      const newDue = body.sla_due_at ? new Date(body.sla_due_at) : null;
      const oldStr = existing.slaDueAt?.toISOString() ?? null;
      const newStr = newDue?.toISOString() ?? null;
      if (oldStr !== newStr) {
        updates.slaDueAt = newDue;
        auditEntries.push({ field: "sla_due_at", oldVal: oldStr, newVal: newStr });
      }
    }
    if (body.summary !== undefined && body.summary !== (existing.summary ?? undefined)) {
      updates.summary = body.summary ?? null;
      auditEntries.push({
        field: "summary",
        oldVal: existing.summary,
        newVal: body.summary ?? null,
      });
    }
    if (body.resolution !== undefined && body.resolution !== (existing.resolution ?? undefined)) {
      updates.resolution = body.resolution ?? null;
      auditEntries.push({
        field: "resolution",
        oldVal: existing.resolution,
        newVal: body.resolution ?? null,
      });
    }

    updates.updatedAt = new Date();
    await db.update(conversations).set(updates).where(eq(conversations.conversationId, id));

    for (const a of auditEntries) {
      await appendAudit({
        actorId,
        entityType: "conversation",
        entityId: id,
        field: a.field,
        oldValue: a.oldVal,
        newValue: a.newVal,
      });
    }

    const [row] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.conversationId, id));
    return NextResponse.json(row ? rowToConversation(row) : { conversation_id: id });
  } catch (e) {
    console.error("PATCH /api/conversations/[id]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
