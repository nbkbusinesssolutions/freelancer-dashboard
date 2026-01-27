import * as React from "react";
import type { EmailAccountItem } from "@/lib/types";

const STORAGE_KEY = "nbk.emailAccounts";

function loadItems(): EmailAccountItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmailAccountItem[];
  } catch {
    return [];
  }
}

function saveItems(items: EmailAccountItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useEmailAccounts() {
  const [items, setItems] = React.useState<EmailAccountItem[]>(() => loadItems());
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(() => {
    setItems(loadItems());
  }, []);

  const upsert = React.useCallback((item: Omit<EmailAccountItem, "id"> & { id?: string }) => {
    const current = loadItems();
    const id = item.id || crypto.randomUUID();
    const existing = current.findIndex((i) => i.id === id);
    const newItem: EmailAccountItem = { ...item, id };

    if (existing >= 0) {
      current[existing] = newItem;
    } else {
      current.push(newItem);
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

  return { items, loading, refresh, upsert, remove };
}
