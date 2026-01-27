import type { Context } from "@netlify/functions";
import { supabase, jsonResponse, errorResponse, corsHeaders } from "./_shared/supabase";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    switch (request.method) {
      case "GET": {
        if (id) {
          const { data, error } = await supabase
            .from("invoices")
            .select(`
              *,
              client:clients(id, name, email, phone),
              project:projects(id, project_name),
              items:invoice_items(*)
            `)
            .eq("id", id)
            .single();
          if (error) return errorResponse(error.message, 404);
          return jsonResponse(transformInvoice(data));
        }
        const { data, error } = await supabase
          .from("invoices")
          .select(`
            *,
            client:clients(id, name, email, phone),
            project:projects(id, project_name),
            items:invoice_items(*)
          `)
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformInvoice) });
      }

      case "POST": {
        const body = await request.json();
        const { lineItems, ...invoiceData } = body;
        const dbBody = transformToDb(invoiceData);
        
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert(dbBody)
          .select()
          .single();
        if (invoiceError) return errorResponse(invoiceError.message, 400);

        if (lineItems && lineItems.length > 0) {
          const items = lineItems.map((item: any) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          }));
          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(items);
          if (itemsError) return errorResponse(itemsError.message, 400);
        }

        return jsonResponse({ ...transformInvoice(invoice), lineItems }, 201);
      }

      case "PUT": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const body = await request.json();
        const { lineItems, ...invoiceData } = body;
        const dbBody = transformToDb(invoiceData);
        
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .update(dbBody)
          .eq("id", id)
          .select()
          .single();
        if (invoiceError) return errorResponse(invoiceError.message, 400);

        await supabase.from("invoice_items").delete().eq("invoice_id", id);
        
        if (lineItems && lineItems.length > 0) {
          const items = lineItems.map((item: any) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          }));
          await supabase.from("invoice_items").insert(items);
        }

        return jsonResponse({ ...transformInvoice(invoice), lineItems });
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("invoices")
          .delete()
          .eq("id", id);
        if (error) return errorResponse(error.message, 400);
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error");
  }
};

function transformInvoice(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    clientId: row.client_id,
    clientName: row.client?.name || "",
    clientEmail: row.client?.email,
    projectId: row.project_id,
    projectName: row.project?.project_name,
    lineItems: (row.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      total: item.total,
    })),
    subtotal: row.subtotal,
    taxRate: row.tax_rate,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    grandTotal: row.grand_total,
    paidAmount: row.paid_amount,
    balanceDue: row.balance_due,
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function transformToDb(body: any) {
  return {
    invoice_number: body.invoiceNumber,
    invoice_date: body.invoiceDate,
    due_date: body.dueDate || null,
    client_id: body.clientId,
    project_id: body.projectId || null,
    subtotal: body.subtotal,
    tax_rate: body.taxRate,
    tax_amount: body.taxAmount,
    discount_amount: body.discountAmount,
    grand_total: body.grandTotal,
    paid_amount: body.paidAmount,
    balance_due: body.balanceDue,
    payment_status: body.paymentStatus,
    notes: body.notes,
  };
}
