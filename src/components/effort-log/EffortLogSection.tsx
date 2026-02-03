import * as React from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Clock } from "lucide-react";

import { useEffortLogs, useCreateEffortLog, useDeleteEffortLog } from "@/hooks/useEffortLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface EffortLogSectionProps {
  projectId: string;
}

export default function EffortLogSection({ projectId }: EffortLogSectionProps) {
  const { data, isLoading } = useEffortLogs(projectId);
  const createMutation = useCreateEffortLog();
  const deleteMutation = useDeleteEffortLog();

  const [showForm, setShowForm] = React.useState(false);
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const logs = data?.items ?? [];
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      toast({ title: "Please enter valid hours", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        projectId,
        date,
        hours: parseFloat(hours),
        notes: notes.trim() || undefined,
      });
      toast({ title: "Effort logged" });
      setHours("");
      setNotes("");
      setShowForm(false);
    } catch {
      toast({ title: "Failed to log effort", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Log deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Effort Log
            </CardTitle>
            <CardDescription>Track time spent on this project</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total Hours</div>
              <div className="text-lg font-bold">{totalHours.toFixed(1)}h</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-1 h-4 w-4" />
              Log
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 rounded-md border p-4 bg-muted/30">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="effort-date">Date</Label>
                <Input
                  id="effort-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effort-hours">Hours</Label>
                <Input
                  id="effort-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g., 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="effort-notes">Notes (optional)</Label>
                <Textarea
                  id="effort-notes"
                  placeholder="What did you work on?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={1}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No effort logged yet</div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.hours}h</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(log.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {log.notes && (
                    <div className="mt-1 text-xs text-muted-foreground truncate">{log.notes}</div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this effort log entry.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(log.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {logs.length > 10 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{logs.length - 10} more entries
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
