import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActionItem, ActionItemContext } from "@/lib/types";

const STORAGE_KEY = "nbk.actions";

function getActions(): ActionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveActions(items: ActionItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useActions(context?: ActionItemContext) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["actions", context?.type, context?.id],
    queryFn: () => {
      const all = getActions();
      if (!context) return all;
      return all.filter(
        (a) => a.context.type === context.type && a.context.id === context.id
      );
    },
  });

  const addAction = useMutation({
    mutationFn: async (data: { text: string; dueDate?: string | null; context: ActionItemContext }) => {
      const items = getActions();
      const newItem: ActionItem = {
        id: crypto.randomUUID(),
        text: data.text,
        dueDate: data.dueDate ?? null,
        completed: false,
        context: data.context,
        createdAt: new Date().toISOString(),
      };
      items.push(newItem);
      saveActions(items);
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const toggleAction = useMutation({
    mutationFn: async (id: string) => {
      const items = getActions();
      const idx = items.findIndex((a) => a.id === id);
      if (idx >= 0) {
        items[idx].completed = !items[idx].completed;
        saveActions(items);
      }
      return items[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const items = getActions().filter((a) => a.id !== id);
      saveActions(items);
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["actions", "incomplete"],
    queryFn: () => {
      const all = getActions();
      return all
        .filter((a) => !a.completed)
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
    },
  });

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
  };
}
