import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InvoiceItem } from "@/lib/types";

export function useInvoices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const data = await api.invoices.list();
      return data as InvoiceItem[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Omit<InvoiceItem, "id"> & { id?: string }) => {
      return await api.invoices.upsert(item);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.invoices.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const items = query.data ?? [];
  const loading = query.isLoading;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["invoices"] });

  const upsert = (item: Omit<InvoiceItem, "id"> & { id?: string }) => {
    return upsertMutation.mutateAsync(item);
  };

  const remove = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const getById = (id: string): InvoiceItem | undefined => {
    return items.find((i) => i.id === id);
  };

  return { items, loading, refresh, upsert, remove, getById };
}
