import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BrandingData {
  id?: string;
  businessName: string;
  tagline: string | null;
  logoUrl: string | null;
  upiQrUrl: string | null;
  upiId: string | null;
  mobile: string | null;
  address: string | null;
  email: string | null;
  defaultHourlyRate: number | null;
}

function dbToBranding(row: any): BrandingData {
  return {
    id: row.id,
    businessName: row.business_name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    upiQrUrl: row.upi_qr_url,
    upiId: row.upi_id,
    mobile: row.mobile,
    address: row.address,
    email: row.email,
    defaultHourlyRate: row.default_hourly_rate ? Number(row.default_hourly_rate) : null,
  };
}

const DEFAULT_BRANDING: BrandingData = {
  businessName: "NBK Business Solutions",
  tagline: "Professional Web Development & Design",
  logoUrl: null,
  upiQrUrl: null,
  upiId: null,
  mobile: null,
  address: null,
  email: null,
  defaultHourlyRate: null,
};

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_branding")
        .select("*")
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === "PGRST116") {
          return DEFAULT_BRANDING;
        }
        throw error;
      }
      
      return dbToBranding(data);
    },
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BrandingData>) => {
      const { data: existing } = await supabase
        .from("business_branding")
        .select("id")
        .limit(1)
        .single();
      
      const payload = {
        business_name: data.businessName,
        tagline: data.tagline,
        logo_url: data.logoUrl,
        upi_qr_url: data.upiQrUrl,
        upi_id: data.upiId,
        mobile: data.mobile,
        address: data.address,
        email: data.email,
        default_hourly_rate: data.defaultHourlyRate,
        updated_at: new Date().toISOString(),
      };

      Object.keys(payload).forEach((key) => {
        if ((payload as any)[key] === undefined) {
          delete (payload as any)[key];
        }
      });
      
      if (existing?.id) {
        const { data: result, error } = await supabase
          .from("business_branding")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return dbToBranding(result);
      } else {
        const { data: result, error } = await supabase
          .from("business_branding")
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return dbToBranding(result);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
    },
  });
}
