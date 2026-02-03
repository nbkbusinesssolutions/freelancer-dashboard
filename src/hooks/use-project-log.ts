import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProjectLogEntry } from "@/lib/types";

export function useProjectLog(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projectLogs", projectId],
    queryFn: async () => {
      const data = await api.projectLogs.list(projectId);
      return data as ProjectLogEntry[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (text: string) => {
      return await api.projectLogs.add(projectId, text) as ProjectLogEntry;
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
