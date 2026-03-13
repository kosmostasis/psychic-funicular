import { NextResponse } from "next/server";
import { db } from "../lib/db";
import { auditLog } from "@swarm-cdp/db";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  try {
    if (entityType && entityId) {
      const rows = await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId)))
        .orderBy(desc(auditLog.at));
      return NextResponse.json(
        rows.map((r) => ({
          id: r.id,
          at: r.at.toISOString(),
          actor_id: r.actorId,
          entity_type: r.entityType,
          entity_id: r.entityId,
          field: r.field,
          old_value: r.oldValue,
          new_value: r.newValue,
        }))
      );
    }
    const rows = await db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(200);
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        at: r.at.toISOString(),
        actor_id: r.actorId,
        entity_type: r.entityType,
        entity_id: r.entityId,
        field: r.field,
        old_value: r.oldValue,
        new_value: r.newValue,
      }))
    );
  } catch (e) {
    console.error("GET /api/audit", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
