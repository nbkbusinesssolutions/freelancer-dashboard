import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BillingLogItem, ServiceCatalogItem } from "@/lib/types";

const SERVICES_KEY = ["services"] as const;
const BILLING_KEY = ["billing"] as const;

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function readServices(): ServiceCatalogItem[] {
  return safeParseJson<ServiceCatalogItem[]>(localStorage.getItem("nbk.services.catalog"), []);
}

function writeServices(items: ServiceCatalogItem[]) {
  localStorage.setItem("nbk.services.catalog", JSON.stringify(items));
}

function readBilling(): BillingLogItem[] {
  return safeParseJson<BillingLogItem[]>(localStorage.getItem("nbk.services.billing"), []);
}

function writeBilling(items: BillingLogItem[]) {
  localStorage.setItem("nbk.services.billing", JSON.stringify(items));
}

export function useServicesCatalog() {
  return useQuery({
    queryKey: SERVICES_KEY,
    queryFn: async () => ({ items: readServices() }),
  });
}

export function useUpsertServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ServiceCatalogItem, "id"> & { id?: string }) => {
      const db = readServices();
      const id = payload.id ?? newId("svc");
      const next: ServiceCatalogItem = {
        id,
        serviceName: payload.serviceName.trim(),
        cadence: payload.cadence,
        defaultAmount: payload.defaultAmount ?? null,
        notes: payload.notes ?? null,
        isActive: payload.isActive,
      };
      const out = [next, ...db.filter((x) => x.id !== id)];
      writeServices(out);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useDeleteServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = readServices();
      writeServices(db.filter((x) => x.id !== id));
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useBillingLog() {
  return useQuery({
    queryKey: BILLING_KEY,
    queryFn: async () => ({ items: readBilling() }),
  });
}

export function useUpsertBillingLogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<BillingLogItem, "id"> & { id?: string }) => {
      const db = readBilling();
      const id = payload.id ?? newId("bill");
      const next: BillingLogItem = {
        id,
        clientName: payload.clientName.trim(),
        projectName: payload.projectName?.trim() || null,
        serviceName: payload.serviceName.trim(),
        cadence: payload.cadence,
        amount: payload.amount ?? null,
        paymentStatus: payload.paymentStatus,
        paymentMode: payload.paymentMode?.trim() || null,
        serviceDate: payload.serviceDate || null,
        notes: payload.notes ?? null,
      };
      const out = [next, ...db.filter((x) => x.id !== id)];
      writeBilling(out);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BILLING_KEY });
    },
  });
}

export function useDeleteBillingLogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = readBilling();
      writeBilling(db.filter((x) => x.id !== id));
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BILLING_KEY });
    },
  });
}
