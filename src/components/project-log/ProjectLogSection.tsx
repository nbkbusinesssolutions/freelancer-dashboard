import * as React from "react";
import { format, parseISO } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useProjectLog } from "@/hooks/use-project-log";

interface ProjectLogSectionProps {
  projectId: string;
}

export default function ProjectLogSection({ projectId }: ProjectLogSectionProps) {
  const { entries, addEntry, isLoading } = useProjectLog(projectId);
  const [newEntry, setNewEntry] = React.useState("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleAdd = () => {
    if (!newEntry.trim()) return;
    addEntry.mutate(newEntry.trim());
    setNewEntry("");
  };

  function formatTimestamp(dateStr: string) {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateStr;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Log</CardTitle>
        <CardDescription>Chronological record of decisions and discussions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a log entry (decisions, client discussions, notes)..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!newEntry.trim() || addEntry.isPending}>
              Add Entry
            </Button>
          </div>
        </div>

        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

        {entries.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground">No log entries yet</div>
        )}

        {entries.length > 0 && (
          <div className="space-y-3">
            {(isExpanded ? entries : entries.slice(0, 3)).map((entry) => (
              <div key={entry.id} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {formatTimestamp(entry.createdAt)}
                </div>
                <div className="text-sm whitespace-pre-wrap">{entry.text}</div>
              </div>
            ))}
            {entries.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : `Show ${entries.length - 3} more entries`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
