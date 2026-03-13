import { db } from "./db";
import { auditLog } from "@swarm-cdp/db";

export async function appendAudit(params: {
  actorId: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}) {
  await db.insert(auditLog).values({
    actorId: params.actorId,
    entityType: params.entityType,
    entityId: params.entityId,
    field: params.field,
    oldValue: params.oldValue,
    newValue: params.newValue,
  });
}
