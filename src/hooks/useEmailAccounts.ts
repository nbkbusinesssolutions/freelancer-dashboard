import * as React from "react";
import type { EmailAccountItem } from "@/lib/types";

const STORAGE_KEY = "nbk.emailAccounts";
const OLD_VAULT_KEY = "mockApiDb:v1";

function migrateFromAccountVault(): EmailAccountItem[] {
  try {
    const oldData = localStorage.getItem(OLD_VAULT_KEY);
    if (!oldData) return [];
    
    const parsed = JSON.parse(oldData);
    if (!parsed?.accountVault?.length) return [];
    
    const migrated: EmailAccountItem[] = parsed.accountVault.map((old: any) => ({
      id: old.id,
      email: old.email,
      provider: old.platform === "Gmail" ? "Gmail" : 
               old.platform === "Outlook" ? "Outlook" : "Custom",
      password: null,
      recoveryEmail: null,
      phone: null,
      notes: old.notes || null,
      status: old.isActive ? "Active" : "Not in use",
      tags: old.platform ? [old.platform] : null,
    }));
    
    return migrated;
  } catch {
    return [];
  }
}

function loadItems(): EmailAccountItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as EmailAccountItem[];
    }
    
    const migrated = migrateFromAccountVault();
    if (migrated.length > 0) {
      saveItems(migrated);
      return migrated;
    }
    
    return [];
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
      current.unshift(newItem);
    }

    saveItems(current);
    setItems(current);
    return newItem;
  }, []);

  const bulkAdd = React.useCallback((emails: string[], provider: EmailAccountItem["provider"], tags?: string[]) => {
    const current = loadItems();
    const existingEmails = new Set(current.map(i => i.email.toLowerCase()));
    
    const added: EmailAccountItem[] = [];
    const skipped: string[] = [];
    
    for (const email of emails) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) continue;
      
      if (existingEmails.has(trimmed)) {
        skipped.push(email);
        continue;
      }
      
      const newItem: EmailAccountItem = {
        id: crypto.randomUUID(),
        email: email.trim(),
        provider,
        password: null,
        recoveryEmail: null,
        phone: null,
        notes: null,
        status: "Active",
        tags: tags?.length ? tags : null,
      };
      
      current.unshift(newItem);
      existingEmails.add(trimmed);
      added.push(newItem);
    }
    
    saveItems(current);
    setItems(current);
    
    return { added, skipped };
  }, []);

  const remove = React.useCallback((id: string) => {
    const current = loadItems().filter((i) => i.id !== id);
    saveItems(current);
    setItems(current);
  }, []);

  const getById = React.useCallback((id: string): EmailAccountItem | undefined => {
    return items.find(i => i.id === id);
  }, [items]);

  return { items, loading, refresh, upsert, bulkAdd, remove, getById };
}
