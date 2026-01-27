import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectLogEntry } from "@/lib/types";

const STORAGE_KEY = "nbk.projectLogs";

function getLogs(): ProjectLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(items: ProjectLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useProjectLog(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projectLogs", projectId],
    queryFn: () => {
      const all = getLogs();
      return all
        .filter((log) => log.projectId === projectId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  });

  const addEntry = useMutation({
    mutationFn: async (text: string) => {
      const items = getLogs();
      const newEntry: ProjectLogEntry = {
        id: crypto.randomUUID(),
        projectId,
        text,
        createdAt: new Date().toISOString(),
      };
      items.push(newEntry);
      saveLogs(items);
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectLogs", projectId] });
    },
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    addEntry,
  };
}
