import type { Context } from "@netlify/functions";
import { supabase, jsonResponse, errorResponse, corsHeaders } from "./_shared/supabase";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const projectId = url.searchParams.get("projectId");

  try {
    switch (request.method) {
      case "GET": {
        let query = supabase.from("project_logs").select("*");
        
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformLog) });
      }

      case "POST": {
        const body = await request.json();
        const dbBody = {
          project_id: body.projectId,
          text: body.text,
        };
        const { data, error } = await supabase
          .from("project_logs")
          .insert(dbBody)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformLog(data), 201);
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("project_logs")
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

function transformLog(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    createdAt: row.created_at,
  };
}
