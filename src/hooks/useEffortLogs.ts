import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface EffortLog {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  notes: string | null;
  createdAt: string;
}

async function fetchEffortLogs(projectId?: string): Promise<{ items: EffortLog[] }> {
  const url = projectId ? `/api/effort-logs?projectId=${projectId}` : "/api/effort-logs";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch effort logs");
  return res.json();
}

async function createEffortLog(data: { projectId: string; date: string; hours: number; notes?: string }): Promise<EffortLog> {
  const res = await fetch("/api/effort-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create effort log");
  return res.json();
}

async function deleteEffortLog(id: string): Promise<void> {
  const res = await fetch(`/api/effort-logs?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete effort log");
}

export function useEffortLogs(projectId?: string) {
  return useQuery({
    queryKey: ["effort-logs", projectId],
    queryFn: () => fetchEffortLogs(projectId),
  });
}

export function useAllEffortLogs() {
  return useQuery({
    queryKey: ["effort-logs"],
    queryFn: () => fetchEffortLogs(),
  });
}

export function useCreateEffortLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEffortLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["effort-logs"] });
    },
  });
}

export function useDeleteEffortLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEffortLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["effort-logs"] });
    },
  });
}
