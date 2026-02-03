import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BrandingData {
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

async function fetchBranding(): Promise<BrandingData | null> {
  const res = await fetch("/api/branding");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch branding");
  return res.json();
}

async function updateBranding(data: Partial<BrandingData>): Promise<BrandingData> {
  const res = await fetch("/api/branding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update branding");
  return res.json();
}

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: fetchBranding,
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBranding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
    },
  });
}
