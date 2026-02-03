import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InvoiceItem, InvoiceLineItem } from "@/lib/types";

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

export function useInvoices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return invoices.map((inv: any) => {
        const items = (inv.invoice_items || []).map((item: any) => snakeToCamel(item));
        const { invoice_items: _, ...rest } = inv;
        return { ...snakeToCamel(rest), items } as InvoiceItem;
      });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Omit<InvoiceItem, "id"> & { id?: string }) => {
      const { lineItems, ...invoiceData } = item;
      const snakeInvoice = camelToSnake(invoiceData);
      delete snakeInvoice.created_at;
      
      let invoiceId = item.id;
      
      if (item.id) {
        const { data, error } = await supabase
          .from("invoices")
          .update(snakeInvoice)
          .eq("id", item.id)
          .select()
          .single();
        if (error) throw error;
        invoiceId = data.id;
      } else {
        delete snakeInvoice.id;
        const { data, error } = await supabase
          .from("invoices")
          .insert(snakeInvoice)
          .select()
          .single();
        if (error) throw error;
        invoiceId = data.id;
      }

      if (item.id) {
        await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      }

      if (lineItems && lineItems.length > 0) {
        const itemsToInsert = lineItems.map((li) => ({
          invoice_id: invoiceId,
          description: li.description,
          quantity: li.quantity,
          rate: li.rate,
          total: li.total,
        }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      return { ...item, id: invoiceId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
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
