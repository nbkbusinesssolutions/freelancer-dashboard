import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ActionItem, ActionItemContext } from "@/lib/types";

export function useActions(context?: ActionItemContext) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["actions", context?.type, context?.id],
    queryFn: async () => {
      const data = await api.actionItems.list(context?.type, context?.id);
      return data as ActionItem[];
    },
  });

  const addAction = useMutation({
    mutationFn: async (data: { text: string; dueDate?: string | null; context: ActionItemContext }) => {
      return await api.actionItems.add(data) as ActionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const toggleAction = useMutation({
    mutationFn: async (id: string) => {
      return await api.actionItems.toggle(id) as ActionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      await api.actionItems.delete(id);
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
      const data = await api.actionItems.listIncomplete();
      return data as ActionItem[];
    },
  });

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
  };
}
