import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EmailAccountItem } from "@/lib/types";

export function useEmailAccounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const data = await api.emailAccounts.list();
      return data.items as EmailAccountItem[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Omit<EmailAccountItem, "id"> & { id?: string }) => {
      return await api.emailAccounts.upsert(item) as EmailAccountItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.emailAccounts.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const bulkAddMutation = useMutation({
    mutationFn: async ({ emails, provider, tags }: { emails: string[]; provider: EmailAccountItem["provider"]; tags?: string[] }) => {
      const added: EmailAccountItem[] = [];
      const skipped: string[] = [];
      
      const existing = query.data || [];
      const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()));
      
      for (const email of emails) {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || existingEmails.has(trimmed)) {
          skipped.push(email);
          continue;
        }
        
        try {
          const result = await api.emailAccounts.upsert({
            email: email.trim(),
            provider,
            password: "",
            status: "Active",
            tags: tags?.length ? tags : null,
          });
          added.push(result);
          existingEmails.add(trimmed);
        } catch {
          skipped.push(email);
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
