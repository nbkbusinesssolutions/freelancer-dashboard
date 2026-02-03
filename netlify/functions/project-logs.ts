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
      
      if (projectId) {
        const rows = await sql`SELECT * FROM project_logs WHERE project_id = ${projectId} ORDER BY created_at DESC`;
        return jsonResponse(rows.map((r: any) => ({
          id: r.id,
          projectId: r.project_id,
          text: r.text,
          createdAt: r.created_at,
        })));
      }
      
      const rows = await sql`SELECT * FROM project_logs ORDER BY created_at DESC`;
      return jsonResponse(rows.map(snakeToCamel));
    }

    if (request.method === "POST") {
      const body = await request.json();
      const rows = await sql`
        INSERT INTO project_logs (project_id, text)
        VALUES (${body.projectId}, ${body.text})
        RETURNING *
      `;
      const r = rows[0];
      return jsonResponse({
        id: r.id,
        projectId: r.project_id,
        text: r.text,
        createdAt: r.created_at,
      });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
