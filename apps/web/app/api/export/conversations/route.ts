import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { conversations } from "@swarm-cdp/db";
import { desc } from "drizzle-orm";

function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map((f) => {
      if (f == null) return "";
      const s = String(f);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  try {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(1000);

    const records = rows.map((row) => ({
      conversation_id: row.conversationId,
      source: row.source,
      root_permalink: row.rootPermalink,
      status: row.status,
      priority: row.priority,
      assigned_to: row.assignedTo ?? "",
      sla_due_at: row.slaDueAt?.toISOString() ?? "",
      summary: row.summary ?? "",
      resolution: row.resolution ?? "",
      owner_hint: row.assignedTo ?? "",
    }));

    if (format === "json") {
      return NextResponse.json(records);
    }

    const header = [
      "conversation_id",
      "source",
      "root_permalink",
      "status",
      "priority",
      "assigned_to",
      "sla_due_at",
      "summary",
      "resolution",
      "owner_hint",
    ];
    const lines: string[] = [];
    lines.push(header.join(","));
    for (const r of records) {
      lines.push(
        toCsvRow([
          r.conversation_id,
          r.source,
          r.root_permalink,
          r.status,
          r.priority,
          r.assigned_to,
          r.sla_due_at,
          r.summary,
          r.resolution,
          r.owner_hint,
        ])
      );
    }
    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="conversations-export.csv"',
      },
    });
  } catch (e) {
    console.error("GET /api/export/conversations", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

