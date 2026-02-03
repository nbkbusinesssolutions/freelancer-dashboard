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
      const contextType = url.searchParams.get("contextType");
      const contextId = url.searchParams.get("contextId");
      const incomplete = url.searchParams.get("incomplete");
      
      let rows;
      if (incomplete === "true") {
        rows = await sql`SELECT * FROM action_items WHERE completed = false ORDER BY due_date ASC NULLS LAST`;
      } else if (contextType && contextId) {
        rows = await sql`SELECT * FROM action_items WHERE context_type = ${contextType} AND context_id = ${contextId} ORDER BY created_at DESC`;
      } else {
        rows = await sql`SELECT * FROM action_items ORDER BY created_at DESC`;
      }
      
      return jsonResponse(rows.map((r: any) => ({
        id: r.id,
        text: r.text,
        dueDate: r.due_date,
        completed: r.completed,
        context: { type: r.context_type, id: r.context_id },
        createdAt: r.created_at,
      })));
    }

    if (request.method === "POST") {
      const body = await request.json();
      
      if (body.toggle && body.id) {
        const current = await sql`SELECT completed FROM action_items WHERE id = ${body.id}`;
        const rows = await sql`
          UPDATE action_items SET completed = ${!current[0].completed}
          WHERE id = ${body.id}
          RETURNING *
        `;
        const r = rows[0];
        return jsonResponse({
          id: r.id,
          text: r.text,
          dueDate: r.due_date,
          completed: r.completed,
          context: { type: r.context_type, id: r.context_id },
          createdAt: r.created_at,
        });
      }
      
      const rows = await sql`
        INSERT INTO action_items (text, due_date, completed, context_type, context_id)
        VALUES (${body.text}, ${body.dueDate || null}, false, ${body.context.type}, ${body.context.id})
        RETURNING *
      `;
      const r = rows[0];
      return jsonResponse({
        id: r.id,
        text: r.text,
        dueDate: r.due_date,
        completed: r.completed,
        context: { type: r.context_type, id: r.context_id },
        createdAt: r.created_at,
      });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      await sql`DELETE FROM action_items WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
