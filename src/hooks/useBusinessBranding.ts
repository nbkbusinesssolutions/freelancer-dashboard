import * as React from "react";
import type { BusinessBranding } from "@/lib/types";

const STORAGE_KEY = "nbk.businessBranding";

const DEFAULT_BRANDING: BusinessBranding = {
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

function loadBranding(): BusinessBranding {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING;
    return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRANDING;
  }
}

function saveBranding(branding: BusinessBranding) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
}

export function useBusinessBranding() {
  const [branding, setBranding] = React.useState<BusinessBranding>(() => loadBranding());

  const refresh = React.useCallback(() => {
    setBranding(loadBranding());
  }, []);

  const update = React.useCallback((updates: Partial<BusinessBranding>) => {
    const current = loadBranding();
    const updated = { ...current, ...updates };
    saveBranding(updated);
    setBranding(updated);
    return updated;
  }, []);

  const reset = React.useCallback(() => {
    saveBranding(DEFAULT_BRANDING);
    setBranding(DEFAULT_BRANDING);
  }, []);

  return { branding, refresh, update, reset };
}
