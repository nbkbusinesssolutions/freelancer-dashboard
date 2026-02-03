import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, camelToSnake, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const rows = await sql`SELECT * FROM ai_subscriptions ORDER BY created_at DESC`;
      return jsonResponse({ items: rows.map(snakeToCamel) });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const d = camelToSnake(body);
      
      if (body.id) {
        const rows = await sql`
          UPDATE ai_subscriptions SET 
            project_id = ${d.project_id},
            tool_name = ${d.tool_name},
            platform = ${d.platform},
            platform_other = ${d.platform_other},
            subscription_type = ${d.subscription_type},
            email_id = ${d.email_id},
            password = ${d.password},
            start_date = ${d.start_date},
            end_date = ${d.end_date},
            cancel_by_date = ${d.cancel_by_date},
            cost = ${d.cost},
            manual_status = ${d.manual_status},
            attention_state = ${d.attention_state},
            notes = ${d.notes}
          WHERE id = ${body.id}
          RETURNING *
        `;
        return jsonResponse(snakeToCamel(rows[0]));
      } else {
        const rows = await sql`
          INSERT INTO ai_subscriptions (
            project_id, tool_name, platform, platform_other, subscription_type,
            email_id, password, start_date, end_date, cancel_by_date,
            cost, manual_status, attention_state, notes
          ) VALUES (
            ${d.project_id}, ${d.tool_name}, ${d.platform}, ${d.platform_other}, ${d.subscription_type},
            ${d.email_id}, ${d.password}, ${d.start_date}, ${d.end_date}, ${d.cancel_by_date},
            ${d.cost}, ${d.manual_status}, ${d.attention_state}, ${d.notes}
          )
          RETURNING *
        `;
        return jsonResponse(snakeToCamel(rows[0]));
      }
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      await sql`DELETE FROM ai_subscriptions WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
