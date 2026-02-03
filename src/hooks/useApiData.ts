import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AISubscriptionItem, ProjectItem } from "@/lib/types";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const data = await api.clients.list();
      return { items: data.items };
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await api.projects.list();
      return { items: data.items as ProjectItem[] };
    },
  });
}

export function useAISubscriptions() {
  return useQuery({
    queryKey: ["ai-subscriptions"],
    queryFn: async () => {
      const data = await api.aiSubscriptions.list();
      return { items: data.items as AISubscriptionItem[] };
    },
  });
}

export function useUpsertClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      return await api.clients.upsert(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.clients.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectItem> & { id?: string }) => {
      return await api.projects.upsert(payload) as ProjectItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.projects.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpsertAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AISubscriptionItem> & { id?: string }) => {
      return await api.aiSubscriptions.upsert(payload) as AISubscriptionItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}

export function useDeleteAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.aiSubscriptions.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}
