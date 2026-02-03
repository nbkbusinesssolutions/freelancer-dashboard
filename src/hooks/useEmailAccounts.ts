import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EmailAccountItem } from "@/lib/types";

function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== "object") return obj;
  
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = snakeToCamel(obj[key]);
  }
  return converted;
}

function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj !== "object") return obj;
  
  const converted: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    converted[snakeKey] = camelToSnake(obj[key]);
  }
  return converted;
}

export function useEmailAccounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(snakeToCamel) as EmailAccountItem[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Omit<EmailAccountItem, "id"> & { id?: string }) => {
      const snakePayload = camelToSnake(item);
      delete snakePayload.created_at;
      
      if (item.id) {
        const { data, error } = await supabase
          .from("email_accounts")
          .update(snakePayload)
          .eq("id", item.id)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as EmailAccountItem;
      } else {
        delete snakePayload.id;
        const { data, error } = await supabase
          .from("email_accounts")
          .insert(snakePayload)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as EmailAccountItem;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const bulkAddMutation = useMutation({
    mutationFn: async ({ emails, provider, tags }: { emails: string[]; provider: EmailAccountItem["provider"]; tags?: string[] }) => {
      const { data: existing } = await supabase.from("email_accounts").select("email");
      const existingEmails = new Set((existing || []).map((e: any) => e.email.toLowerCase()));
      
      const added: EmailAccountItem[] = [];
      const skipped: string[] = [];
      
      for (const email of emails) {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || existingEmails.has(trimmed)) {
          skipped.push(email);
          continue;
        }
        
        const { data, error } = await supabase
          .from("email_accounts")
          .insert({
            email: email.trim(),
            provider,
            password: "",
            status: "Active",
            tags: tags?.length ? tags : null,
          })
          .select()
          .single();
        
        if (!error && data) {
          added.push(snakeToCamel(data) as EmailAccountItem);
          existingEmails.add(trimmed);
        }
      }
      
      return { added, skipped };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const items = query.data ?? [];
  const loading = query.isLoading;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] });

  const upsert = (item: Omit<EmailAccountItem, "id"> & { id?: string }) => {
    return upsertMutation.mutateAsync(item);
  };

  const bulkAdd = (emails: string[], provider: EmailAccountItem["provider"], tags?: string[]) => {
    return bulkAddMutation.mutateAsync({ emails, provider, tags });
  };

  const remove = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const getById = (id: string): EmailAccountItem | undefined => {
    return items.find((i) => i.id === id);
  };

  return { items, loading, refresh, upsert, bulkAdd, remove, getById };
}
