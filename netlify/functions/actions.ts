import type { Context } from "@netlify/functions";
import { supabase, jsonResponse, errorResponse, corsHeaders } from "./_shared/supabase";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const contextType = url.searchParams.get("contextType");
  const contextId = url.searchParams.get("contextId");

  try {
    switch (request.method) {
      case "GET": {
        let query = supabase.from("action_items").select("*");
        
        if (contextType && contextId) {
          query = query.eq("context_type", contextType).eq("context_id", contextId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformAction) });
      }

      case "POST": {
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("action_items")
          .insert(dbBody)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformAction(data), 201);
      }

      case "PUT": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("action_items")
          .update(dbBody)
          .eq("id", id)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformAction(data));
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("action_items")
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

function transformAction(row: any) {
  return {
    id: row.id,
    text: row.text,
    dueDate: row.due_date,
    completed: row.completed,
    context: {
      type: row.context_type,
      id: row.context_id,
    },
    createdAt: row.created_at,
  };
}

function transformToDb(body: any) {
  return {
    text: body.text,
    due_date: body.dueDate || null,
    completed: body.completed ?? false,
    context_type: body.context?.type,
    context_id: body.context?.id,
  };
}
