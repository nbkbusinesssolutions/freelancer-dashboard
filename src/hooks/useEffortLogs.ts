import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface EffortLog {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  notes: string | null;
  createdAt: string;
}

function dbToEffortLog(row: any): EffortLog {
  return {
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    hours: Number(row.hours),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function useEffortLogs(projectId?: string) {
  return useQuery({
    queryKey: ["effort-logs", projectId],
    queryFn: async () => {
      let q = supabase.from("effort_logs").select("*");
      
      if (projectId) {
        q = q.eq("project_id", projectId);
      }
      
      const { data, error } = await q.order("date", { ascending: false });
      if (error) throw error;
      return { items: data.map(dbToEffortLog) };
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
      const { data: result, error } = await supabase
        .from("effort_logs")
        .insert({
          project_id: data.projectId,
          date: data.date,
          hours: data.hours,
          notes: data.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return dbToEffortLog(result);
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
      const { error } = await supabase.from("effort_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["effort-logs"] });
    },
  });
}
