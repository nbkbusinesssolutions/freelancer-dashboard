import type { Context } from "@netlify/functions";
import { getDb, corsHeaders, jsonResponse, errorResponse } from "./db";

export default async (request: Request, context: Context) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sql = getDb();

  try {
    if (request.method === "GET") {
      const rows = await sql`SELECT * FROM business_branding LIMIT 1`;
      
      if (rows.length === 0) {
        return jsonResponse({
          businessName: "NBK Business Solutions",
          tagline: "Professional Web Development & Design",
          logoUrl: null,
          upiQrUrl: null,
          upiId: null,
          mobile: null,
          address: null,
          email: null,
          defaultHourlyRate: null,
        });
      }
      
      const r = rows[0];
      return jsonResponse({
        id: r.id,
        businessName: r.business_name,
        tagline: r.tagline,
        logoUrl: r.logo_url,
        upiQrUrl: r.upi_qr_url,
        upiId: r.upi_id,
        mobile: r.mobile,
        address: r.address,
        email: r.email,
        defaultHourlyRate: r.default_hourly_rate ? Number(r.default_hourly_rate) : null,
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      
      const existing = await sql`SELECT id FROM business_branding LIMIT 1`;
      
      if (existing.length > 0) {
        const rows = await sql`
          UPDATE business_branding SET 
            business_name = COALESCE(${body.businessName}, business_name),
            tagline = COALESCE(${body.tagline}, tagline),
            logo_url = COALESCE(${body.logoUrl}, logo_url),
            upi_qr_url = COALESCE(${body.upiQrUrl}, upi_qr_url),
            upi_id = COALESCE(${body.upiId}, upi_id),
            mobile = COALESCE(${body.mobile}, mobile),
            address = COALESCE(${body.address}, address),
            email = COALESCE(${body.email}, email),
            default_hourly_rate = COALESCE(${body.defaultHourlyRate}, default_hourly_rate),
            updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
        const r = rows[0];
        return jsonResponse({
          id: r.id,
          businessName: r.business_name,
          tagline: r.tagline,
          logoUrl: r.logo_url,
          upiQrUrl: r.upi_qr_url,
          upiId: r.upi_id,
          mobile: r.mobile,
          address: r.address,
          email: r.email,
          defaultHourlyRate: r.default_hourly_rate ? Number(r.default_hourly_rate) : null,
        });
      } else {
        const rows = await sql`
          INSERT INTO business_branding (
            business_name, tagline, logo_url, upi_qr_url, upi_id,
            mobile, address, email, default_hourly_rate
          ) VALUES (
            ${body.businessName || 'NBK Business Solutions'},
            ${body.tagline},
            ${body.logoUrl},
            ${body.upiQrUrl},
            ${body.upiId},
            ${body.mobile},
            ${body.address},
            ${body.email},
            ${body.defaultHourlyRate}
          )
          RETURNING *
        `;
        const r = rows[0];
        return jsonResponse({
          id: r.id,
          businessName: r.business_name,
          tagline: r.tagline,
          logoUrl: r.logo_url,
          upiQrUrl: r.upi_qr_url,
          upiId: r.upi_id,
          mobile: r.mobile,
          address: r.address,
          email: r.email,
          defaultHourlyRate: r.default_hourly_rate ? Number(r.default_hourly_rate) : null,
        });
      }
    }

    return errorResponse("Method not allowed", 405);
  } catch (error: any) {
    return errorResponse(error.message);
  }
};
