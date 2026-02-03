import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ActionItem, ActionItemContext } from "@/lib/types";

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

function dbToActionItem(row: any): ActionItem {
  return {
    id: row.id,
    text: row.text,
    dueDate: row.due_date,
    completed: row.completed,
    context: {
      type: row.context_type,
      id: row.context_id,
    },
    createdAt: row.created_at,
  };
}

export function useActions(context?: ActionItemContext) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["actions", context?.type, context?.id],
    queryFn: async () => {
      let q = supabase.from("action_items").select("*");
      
      if (context) {
        q = q.eq("context_type", context.type).eq("context_id", context.id);
      }
      
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(dbToActionItem);
    },
  });

  const addAction = useMutation({
    mutationFn: async (data: { text: string; dueDate?: string | null; context: ActionItemContext }) => {
      const { data: result, error } = await supabase
        .from("action_items")
        .insert({
          text: data.text,
          due_date: data.dueDate || null,
          completed: false,
          context_type: data.context.type,
          context_id: data.context.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return dbToActionItem(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const toggleAction = useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from("action_items")
        .select("completed")
        .eq("id", id)
        .single();
      
      const { data, error } = await supabase
        .from("action_items")
        .update({ completed: !current?.completed })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToActionItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
    addAction,
    toggleAction,
    deleteAction,
  };
}

export function useAllActions() {
  return useActions();
}

export function useIncompleteActions() {
  const query = useQuery({
    queryKey: ["actions", "incomplete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("completed", false)
        .order("due_date", { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data.map(dbToActionItem);
    },
  });

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
  };
}
