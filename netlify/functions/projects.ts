import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, camelToSnake, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const rows = await sql`
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        ORDER BY p.created_at DESC
      `;
      return jsonResponse({ items: rows.map(snakeToCamel) });
    }

    if (request.method === "POST") {
      const body = await request.json();
      
      // Handle clientName -> client_id lookup/creation
      let clientId = body.clientId || null;
      if (body.clientName && !clientId) {
        const existingClient = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
        if (existingClient.length > 0) {
          clientId = existingClient[0].id;
        } else {
          const newClient = await sql`INSERT INTO clients (name) VALUES (${body.clientName}) RETURNING id`;
          clientId = newClient[0].id;
        }
      }
      
      const d = camelToSnake({ ...body, clientId });
      
      if (body.id) {
        await sql`
          UPDATE projects SET 
            client_id = ${clientId},
            project_name = ${d.project_name},
            domain_name = ${d.domain_name},
            domain_provider = ${d.domain_provider},
            domain_email_id = ${d.domain_email_id},
            domain_username = ${d.domain_username},
            deployment_email_id = ${d.deployment_email_id},
            deployment_username = ${d.deployment_username},
            hosting_platform = ${d.hosting_platform},
            domain_purchase_date = ${d.domain_purchase_date},
            domain_renewal_date = ${d.domain_renewal_date},
            hosting_start_date = ${d.hosting_start_date},
            hosting_renewal_date = ${d.hosting_renewal_date},
            status = ${d.status},
            project_amount = ${d.project_amount},
            payment_status = ${d.payment_status},
            pending_amount = ${d.pending_amount},
            completed_date = ${d.completed_date},
            attention_state = ${d.attention_state},
            notes = ${d.notes}
          WHERE id = ${body.id}
        `;
        const updated = await sql`
          SELECT p.*, c.name as client_name 
          FROM projects p 
          LEFT JOIN clients c ON p.client_id = c.id 
          WHERE p.id = ${body.id}
        `;
        return jsonResponse(snakeToCamel(updated[0]));
      } else {
        const rows = await sql`
          INSERT INTO projects (
            client_id, project_name, domain_name, domain_provider,
            domain_email_id, domain_username, deployment_email_id, deployment_username,
            hosting_platform, domain_purchase_date, domain_renewal_date,
            hosting_start_date, hosting_renewal_date, status, project_amount,
            payment_status, pending_amount, completed_date, attention_state, notes
          ) VALUES (
            ${clientId}, ${d.project_name}, ${d.domain_name}, ${d.domain_provider},
            ${d.domain_email_id}, ${d.domain_username}, ${d.deployment_email_id}, ${d.deployment_username},
            ${d.hosting_platform}, ${d.domain_purchase_date}, ${d.domain_renewal_date},
            ${d.hosting_start_date}, ${d.hosting_renewal_date}, ${d.status}, ${d.project_amount},
            ${d.payment_status}, ${d.pending_amount}, ${d.completed_date}, ${d.attention_state}, ${d.notes}
          )
          RETURNING id
        `;
        const newId = rows[0].id;
        const inserted = await sql`
          SELECT p.*, c.name as client_name 
          FROM projects p 
          LEFT JOIN clients c ON p.client_id = c.id 
          WHERE p.id = ${newId}
        `;
        return jsonResponse(snakeToCamel(inserted[0]));
      }
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      await sql`DELETE FROM projects WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
