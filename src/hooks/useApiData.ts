import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AISubscriptionItem, ProjectItem } from "@/lib/types";

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

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { items: data.map(snakeToCamel) };
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { items: data.map(snakeToCamel) as ProjectItem[] };
    },
  });
}

export function useAISubscriptions() {
  return useQuery({
    queryKey: ["ai-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { items: data.map(snakeToCamel) as AISubscriptionItem[] };
    },
  });
}

export function useUpsertClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const snakePayload = camelToSnake(payload);
      delete snakePayload.created_at;
      
      if (payload.id) {
        const { data, error } = await supabase
          .from("clients")
          .update(snakePayload)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data);
      } else {
        delete snakePayload.id;
        const { data, error } = await supabase
          .from("clients")
          .insert(snakePayload)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectItem> & { id?: string }) => {
      const snakePayload = camelToSnake(payload);
      delete snakePayload.created_at;
      
      if (payload.id) {
        const { data, error } = await supabase
          .from("projects")
          .update(snakePayload)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as ProjectItem;
      } else {
        delete snakePayload.id;
        const { data, error } = await supabase
          .from("projects")
          .insert(snakePayload)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as ProjectItem;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpsertAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AISubscriptionItem> & { id?: string }) => {
      const snakePayload = camelToSnake(payload);
      delete snakePayload.created_at;
      
      if (payload.id) {
        const { data, error } = await supabase
          .from("ai_subscriptions")
          .update(snakePayload)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as AISubscriptionItem;
      } else {
        delete snakePayload.id;
        const { data, error } = await supabase
          .from("ai_subscriptions")
          .insert(snakePayload)
          .select()
          .single();
        if (error) throw error;
        return snakeToCamel(data) as AISubscriptionItem;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}

export function useDeleteAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}
