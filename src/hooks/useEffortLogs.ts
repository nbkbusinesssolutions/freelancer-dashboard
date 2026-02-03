import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface EffortLog {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  notes: string | null;
  createdAt: string;
}

export function useEffortLogs(projectId?: string) {
  return useQuery({
    queryKey: ["effort-logs", projectId],
    queryFn: async () => {
      const data = await api.effortLogs.list(projectId);
      return { items: data.items as EffortLog[] };
    },
  });
}

export function useAllEffortLogs() {
  return useEffortLogs();
}

export function useCreateEffortLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: string; date: string; hours: number; notes?: string }) => {
      return await api.effortLogs.add(data) as EffortLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["effort-logs"] });
    },
  });
}

export function useDeleteEffortLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.effortLogs.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["effort-logs"] });
    },
  });
}
