import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();
  const url = new URL(request.url);

  try {
    if (request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      
      let rows;
      if (projectId) {
        rows = await sql`SELECT * FROM effort_logs WHERE project_id = ${projectId} ORDER BY date DESC`;
      } else {
        rows = await sql`SELECT * FROM effort_logs ORDER BY date DESC`;
      }
      
      return jsonResponse({ items: rows.map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        date: r.date,
        hours: Number(r.hours),
        notes: r.notes,
        createdAt: r.created_at,
      }))});
    }

    if (request.method === "POST") {
      const body = await request.json();
      const rows = await sql`
        INSERT INTO effort_logs (project_id, date, hours, notes)
        VALUES (${body.projectId}, ${body.date}, ${body.hours}, ${body.notes || null})
        RETURNING *
      `;
      const r = rows[0];
      return jsonResponse({
        id: r.id,
        projectId: r.project_id,
        date: r.date,
        hours: Number(r.hours),
        notes: r.notes,
        createdAt: r.created_at,
      });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      await sql`DELETE FROM effort_logs WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
