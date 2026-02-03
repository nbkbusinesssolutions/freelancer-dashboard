import type { Context } from "@netlify/functions";
import { getDb, snakeToCamel, camelToSnake, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const invoices = await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
      const items = await sql`SELECT * FROM invoice_items`;
      
      const result = invoices.map((inv: any) => {
        const invItems = items.filter((i: any) => i.invoice_id === inv.id);
        return { ...snakeToCamel(inv), items: invItems.map(snakeToCamel) };
      });
      
      return jsonResponse(result);
    }

    if (request.method === "POST") {
      const body = await request.json();
      const { lineItems, ...invoiceData } = body;
      const d = camelToSnake(invoiceData);
      
      let invoiceId = body.id;
      
      if (body.id) {
        await sql`
          UPDATE invoices SET 
            invoice_number = ${d.invoice_number},
            client_id = ${d.client_id},
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
            ${d.invoice_number}, ${d.client_id}, ${d.project_id}, ${d.invoice_date}, ${d.due_date},
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

      return jsonResponse({ ...body, id: invoiceId });
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
