import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProjectLogEntry } from "@/lib/types";

function dbToLogEntry(row: any): ProjectLogEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export function useProjectLog(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projectLogs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map(dbToLogEntry);
    },
  });

  const addEntry = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase
        .from("project_logs")
        .insert({
          project_id: projectId,
          text,
        })
        .select()
        .single();
      
      if (error) throw error;
      return dbToLogEntry(data);
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
