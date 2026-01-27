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
            .from("projects")
            .select(`
              *,
              client:clients(id, name, email, phone),
              domain_email:email_accounts!projects_domain_email_id_fkey(id, email, provider),
              deployment_email:email_accounts!projects_deployment_email_id_fkey(id, email, provider)
            `)
            .eq("id", id)
            .single();
          if (error) return errorResponse(error.message, 404);
          return jsonResponse(transformProject(data));
        }
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            client:clients(id, name, email, phone),
            domain_email:email_accounts!projects_domain_email_id_fkey(id, email, provider),
            deployment_email:email_accounts!projects_deployment_email_id_fkey(id, email, provider)
          `)
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformProject) });
      }

      case "POST": {
        const body = await request.json();
        
        // If clientName is provided but no clientId, find or create the client
        let clientId = body.clientId;
        if (!clientId && body.clientName) {
          // Try to find existing client by name
          const { data: existingClient } = await supabase
            .from("clients")
            .select("id")
            .eq("name", body.clientName)
            .single();
          
          if (existingClient) {
            clientId = existingClient.id;
          } else {
            // Create new client
            const { data: newClient, error: clientError } = await supabase
              .from("clients")
              .insert({ name: body.clientName })
              .select()
              .single();
            if (clientError) return errorResponse(`Failed to create client: ${clientError.message}`, 400);
            clientId = newClient.id;
          }
        }
        
        const dbBody = transformToDb({ ...body, clientId });
        const { data, error } = await supabase
          .from("projects")
          .insert(dbBody)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformProject(data), 201);
      }

      case "PUT": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("projects")
          .update(dbBody)
          .eq("id", id)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformProject(data));
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("projects")
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

function transformProject(row: any) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client?.name || "",
    projectName: row.project_name,
    domainName: row.domain_name,
    domainProvider: row.domain_provider,
    domainEmailId: row.domain_email_id,
    domainUsername: row.domain_username,
    deploymentEmailId: row.deployment_email_id,
    deploymentUsername: row.deployment_username,
    hostingPlatform: row.hosting_platform,
    domainPurchaseDate: row.domain_purchase_date,
    domainRenewalDate: row.domain_renewal_date,
    hostingStartDate: row.hosting_start_date,
    hostingRenewalDate: row.hosting_renewal_date,
    status: row.status,
    projectAmount: row.project_amount,
    paymentStatus: row.payment_status,
    pendingAmount: row.pending_amount,
    completedDate: row.completed_date,
    attentionState: row.attention_state,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function transformToDb(body: any) {
  return {
    client_id: body.clientId || null,
    project_name: body.projectName,
    domain_name: body.domainName || null,
    domain_provider: body.domainProvider || null,
    domain_email_id: body.domainEmailId || null,
    domain_username: body.domainUsername || null,
    deployment_email_id: body.deploymentEmailId || null,
    deployment_username: body.deploymentUsername || null,
    hosting_platform: body.hostingPlatform || null,
    domain_purchase_date: body.domainPurchaseDate || null,
    domain_renewal_date: body.domainRenewalDate || null,
    hosting_start_date: body.hostingStartDate || null,
    hosting_renewal_date: body.hostingRenewalDate || null,
    status: body.status,
    project_amount: body.projectAmount || null,
    payment_status: body.paymentStatus || null,
    pending_amount: body.pendingAmount || null,
    completed_date: body.completedDate || null,
    attention_state: body.attentionState || null,
    notes: body.notes,
  };
}
