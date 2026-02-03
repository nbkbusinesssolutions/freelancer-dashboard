import { useBranding, useUpdateBranding, type BrandingData } from "./useBranding";
import type { BusinessBranding } from "@/lib/types";

export function useBusinessBranding() {
  const brandingQuery = useBranding();
  const updateMutation = useUpdateBranding();
  
  const branding: BusinessBranding = brandingQuery.data ?? {
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

  const refresh = () => {
    brandingQuery.refetch();
  };

  const update = async (updates: Partial<BusinessBranding>) => {
    await updateMutation.mutateAsync(updates as Partial<BrandingData>);
    return { ...branding, ...updates };
  };

  const reset = async () => {
    await updateMutation.mutateAsync({
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
  };

  return { branding, refresh, update, reset, isLoading: brandingQuery.isLoading };
}
