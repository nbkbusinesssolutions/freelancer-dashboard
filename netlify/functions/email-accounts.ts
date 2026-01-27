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
            .from("email_accounts")
            .select("*")
            .eq("id", id)
            .single();
          if (error) return errorResponse(error.message, 404);
          return jsonResponse(transformEmailAccount(data));
        }
        const { data, error } = await supabase
          .from("email_accounts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse({ items: data.map(transformEmailAccount) });
      }

      case "POST": {
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("email_accounts")
          .insert(dbBody)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformEmailAccount(data), 201);
      }

      case "PUT": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const body = await request.json();
        const dbBody = transformToDb(body);
        const { data, error } = await supabase
          .from("email_accounts")
          .update(dbBody)
          .eq("id", id)
          .select()
          .single();
        if (error) return errorResponse(error.message, 400);
        return jsonResponse(transformEmailAccount(data));
      }

      case "DELETE": {
        if (!id) return errorResponse("Missing id parameter", 400);
        const { error } = await supabase
          .from("email_accounts")
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

function transformEmailAccount(row: any) {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    provider: row.provider,
    status: row.status,
    tags: row.tags,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function transformToDb(body: any) {
  return {
    email: body.email,
    password: body.password,
    provider: body.provider,
    status: body.status,
    tags: body.tags,
    notes: body.notes,
  };
}
