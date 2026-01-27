import type { Context } from "@netlify/functions";
import { supabase, jsonResponse, errorResponse, corsHeaders } from "./_shared/supabase";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    switch (request.method) {
      case "GET": {
        const { data, error } = await supabase
          .from("business_branding")
          .select("*")
          .limit(1)
          .single();
        if (error) return errorResponse(error.message, 404);
        return jsonResponse(transformBranding(data));
      }

      case "PUT": {
        const body = await request.json();
        const dbBody = transformToDb(body);
        
        const { data: existing } = await supabase
          .from("business_branding")
          .select("id")
          .limit(1)
          .single();

        if (existing) {
          const { data, error } = await supabase
            .from("business_branding")
            .update({ ...dbBody, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
            .select()
            .single();
          if (error) return errorResponse(error.message, 400);
          return jsonResponse(transformBranding(data));
        } else {
          const { data, error } = await supabase
            .from("business_branding")
            .insert(dbBody)
            .select()
            .single();
          if (error) return errorResponse(error.message, 400);
          return jsonResponse(transformBranding(data), 201);
        }
      }

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error");
  }
};

function transformBranding(row: any) {
  return {
    businessName: row.business_name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    upiQrUrl: row.upi_qr_url,
    upiId: row.upi_id,
    mobile: row.mobile,
    address: row.address,
    email: row.email,
  };
}

function transformToDb(body: any) {
  return {
    business_name: body.businessName,
    tagline: body.tagline,
    logo_url: body.logoUrl,
    upi_qr_url: body.upiQrUrl,
    upi_id: body.upiId,
    mobile: body.mobile,
    address: body.address,
    email: body.email,
  };
}
