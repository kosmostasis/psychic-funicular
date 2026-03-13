import { NextResponse } from "next/server";
import { db } from "../lib/db";
import { conversations } from "@swarm-cdp/db";
import { eq, desc } from "drizzle-orm";
import { getRoleFromRequest } from "../lib/rbac";

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

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
    return NextResponse.json(rows.map(rowToConversation));
  } catch (e) {
    console.error("GET /api/conversations", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const role = getRoleFromRequest(request);
  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const conversationId =
      body.conversation_id ?? `conv-${body.source}-${Date.now()}`;
    await db.insert(conversations).values({
      conversationId,
      source: body.source,
      rootPermalink: body.root_permalink,
      status: body.status ?? "open",
      priority: body.priority ?? "p2",
      assignedTo: body.assigned_to ?? null,
      slaDueAt: body.sla_due_at ? new Date(body.sla_due_at) : null,
      summary: body.summary ?? null,
      resolution: body.resolution ?? null,
      eventIds: Array.isArray(body.event_ids) ? body.event_ids : [],
    });
    const [row] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.conversationId, conversationId));
    return NextResponse.json(row ? rowToConversation(row) : { conversation_id: conversationId });
  } catch (e) {
    console.error("POST /api/conversations", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
