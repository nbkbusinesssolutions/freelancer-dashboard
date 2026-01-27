import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/api";
import type { AISubscriptionItem, ProjectItem } from "@/lib/types";

type ListResponse<T> = { items: T[] };

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetchJson<ListResponse<ProjectItem>>("/projects"),
  });
}

export function useAISubscriptions() {
  return useQuery({
    queryKey: ["ai-subscriptions"],
    queryFn: () => apiFetchJson<ListResponse<AISubscriptionItem>>("/ai-subscriptions"),
  });
}

export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProjectItem> & { id?: string }) => {
      if (payload.id) return apiFetchJson<ProjectItem>(`/projects?id=${payload.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return apiFetchJson<ProjectItem>("/projects", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetchJson<void>(`/projects?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpsertAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AISubscriptionItem> & { id?: string }) => {
      if (payload.id)
        return apiFetchJson<AISubscriptionItem>(`/ai-subscriptions?id=${payload.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return apiFetchJson<AISubscriptionItem>("/ai-subscriptions", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}

export function useDeleteAISubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetchJson<void>(`/ai-subscriptions?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-subscriptions"] }),
  });
}
