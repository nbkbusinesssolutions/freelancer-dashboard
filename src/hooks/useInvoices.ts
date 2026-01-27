import * as React from "react";
import type { InvoiceItem } from "@/lib/types";

const STORAGE_KEY = "nbk.invoices";

function loadItems(): InvoiceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InvoiceItem[];
  } catch {
    return [];
  }
}

function saveItems(items: InvoiceItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useInvoices() {
  const [items, setItems] = React.useState<InvoiceItem[]>(() => loadItems());
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(() => {
    setItems(loadItems());
  }, []);

  const upsert = React.useCallback((item: Omit<InvoiceItem, "id"> & { id?: string }) => {
    const current = loadItems();
    const id = item.id || crypto.randomUUID();
    const existing = current.findIndex((i) => i.id === id);
    const newItem: InvoiceItem = { ...item, id };

    if (existing >= 0) {
      current[existing] = newItem;
    } else {
      current.unshift(newItem);
    }

    saveItems(current);
    setItems(current);
    return newItem;
  }, []);

  const remove = React.useCallback((id: string) => {
    const current = loadItems().filter((i) => i.id !== id);
    saveItems(current);
    setItems(current);
  }, []);

  const getById = React.useCallback((id: string): InvoiceItem | undefined => {
    return items.find(i => i.id === id);
  }, [items]);

  return { items, loading, refresh, upsert, remove, getById };
}
