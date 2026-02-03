import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, camelToSnake, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const rows = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
      return jsonResponse({ items: rows.map(snakeToCamel) });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const data = camelToSnake(body);
      
      if (body.id) {
        const rows = await sql`
          UPDATE clients SET 
            name = ${data.name},
            email = ${data.email},
            phone = ${data.phone},
            notes = ${data.notes}
          WHERE id = ${body.id}
          RETURNING *
        `;
        return jsonResponse(snakeToCamel(rows[0]));
      } else {
        const rows = await sql`
          INSERT INTO clients (name, email, phone, notes)
          VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.notes})
          RETURNING *
        `;
        return jsonResponse(snakeToCamel(rows[0]));
      }
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      await sql`DELETE FROM clients WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
