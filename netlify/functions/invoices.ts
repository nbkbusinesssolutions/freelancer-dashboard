import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, camelToSnake, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const invoices = await sql`
        SELECT i.*, c.name as client_name, c.email as client_email, p.project_name 
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN projects p ON i.project_id = p.id
        ORDER BY i.created_at DESC
      `;
      const items = await sql`SELECT * FROM invoice_items`;
      
      const result = invoices.map((inv: any) => {
        const invItems = items.filter((i: any) => i.invoice_id === inv.id);
        return { 
          ...snakeToCamel(inv), 
          lineItems: invItems.map((item: any) => snakeToCamel(item))
        };
      });
      
      return jsonResponse(result);
    }

    if (request.method === "POST") {
      const body = await request.json();
      const { lineItems, ...invoiceData } = body;
      
      // Handle clientName -> client_id lookup/creation
      let clientId = body.clientId || null;
      if (body.clientName && !clientId) {
        const existingClient = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
        if (existingClient.length > 0) {
          clientId = existingClient[0].id;
        } else {
          const newClient = await sql`INSERT INTO clients (name, email) VALUES (${body.clientName}, ${body.clientEmail || null}) RETURNING id`;
          clientId = newClient[0].id;
        }
      }
      
      const d = camelToSnake({ ...invoiceData, clientId });
      
      let invoiceId = body.id;
      
      if (body.id) {
        await sql`
          UPDATE invoices SET 
            invoice_number = ${d.invoice_number},
            client_id = ${clientId},
            project_id = ${d.project_id},
            invoice_date = ${d.invoice_date},
            due_date = ${d.due_date},
            subtotal = ${d.subtotal},
            tax_rate = ${d.tax_rate},
            tax_amount = ${d.tax_amount},
            discount_amount = ${d.discount_amount},
            grand_total = ${d.grand_total},
            paid_amount = ${d.paid_amount},
            balance_due = ${d.balance_due},
            payment_status = ${d.payment_status},
            notes = ${d.notes}
          WHERE id = ${body.id}
        `;
        await sql`DELETE FROM invoice_items WHERE invoice_id = ${invoiceId}`;
      } else {
        const rows = await sql`
          INSERT INTO invoices (
            invoice_number, client_id, project_id, invoice_date, due_date,
            subtotal, tax_rate, tax_amount, discount_amount, grand_total,
            paid_amount, balance_due, payment_status, notes
          ) VALUES (
            ${d.invoice_number}, ${clientId}, ${d.project_id}, ${d.invoice_date}, ${d.due_date},
            ${d.subtotal}, ${d.tax_rate}, ${d.tax_amount}, ${d.discount_amount}, ${d.grand_total},
            ${d.paid_amount}, ${d.balance_due}, ${d.payment_status}, ${d.notes}
          )
          RETURNING id
        `;
        invoiceId = rows[0].id;
      }

      if (lineItems && lineItems.length > 0) {
        for (const li of lineItems) {
          await sql`
            INSERT INTO invoice_items (invoice_id, description, quantity, rate, total)
            VALUES (${invoiceId}, ${li.description}, ${li.quantity}, ${li.rate}, ${li.total})
          `;
        }
      }

      // Fetch the complete invoice with client/project names
      const result = await sql`
        SELECT i.*, c.name as client_name, c.email as client_email, p.project_name 
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.id = ${invoiceId}
      `;
      const invoiceItems = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${invoiceId}`;
      
      return jsonResponse({
        ...snakeToCamel(result[0]),
        lineItems: invoiceItems.map((item: any) => snakeToCamel(item))
      });
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      await sql`DELETE FROM invoices WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
