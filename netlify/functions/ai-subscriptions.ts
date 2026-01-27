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
            .from("ai_subscriptions")
            .select(`
              *,
              project:projects(id, project_name),
              email:email_accounts(id, email, provider)
            `)
            .eq("id", id)
            .single();
          if (error) return errorResponse(error.message, 404);
          return jsonResponse(transformSubscription(data));
        }
        const { data, error } = await supabase
          .from("ai_subscriptions")
          .select(`
            *,
            project:projects(id, project_name),
            email:email_accounts(id, email, provider)
          `)
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformSubscription) });
      }

      case "POST": {
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("ai_subscriptions")
          .insert(dbBody)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformSubscription(data), 201);
      }

      case "PUT": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("ai_subscriptions")
          .update(dbBody)
          .eq("id", id)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformSubscription(data));
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("ai_subscriptions")
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

function transformSubscription(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    toolName: row.tool_name,
    platform: row.platform,
    subscriptionType: row.subscription_type,
    emailId: row.email_id,
    password: row.password,
    startDate: row.start_date,
    endDate: row.end_date,
    cancelByDate: row.cancel_by_date,
    cost: row.cost,
    manualStatus: row.manual_status,
    attentionState: row.attention_state,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function transformToDb(body: any) {
  return {
    project_id: body.projectId || null,
    tool_name: body.toolName,
    platform: body.platform,
    subscription_type: body.subscriptionType,
    email_id: body.emailId,
    password: body.password,
    start_date: body.startDate || null,
    end_date: body.endDate || null,
    cancel_by_date: body.cancelByDate || null,
    cost: body.cost,
    manual_status: body.manualStatus,
    attention_state: body.attentionState,
    notes: body.notes,
  };
}
