import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
      try {
        const data = await api.branding.get();
        return data as BrandingData;
      } catch {
        return DEFAULT_BRANDING;
      }
    },
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BrandingData>) => {
      return await api.branding.update(data) as BrandingData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
    },
  });
}
