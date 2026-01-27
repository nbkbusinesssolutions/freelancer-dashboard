import * as React from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { useActions } from "@/hooks/use-actions";
import type { ActionItemContext } from "@/lib/types";

interface ActionItemsSectionProps {
  context: ActionItemContext;
}

export default function ActionItemsSection({ context }: ActionItemsSectionProps) {
  const { actions, addAction, toggleAction, deleteAction } = useActions(context);
  const [newText, setNewText] = React.useState("");
  const [newDueDate, setNewDueDate] = React.useState<Date | undefined>();
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    addAction.mutate({
      text: newText.trim(),
      dueDate: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
      context,
    });
    setNewText("");
    setNewDueDate(undefined);
    setIsAdding(false);
  };

  const incomplete = actions.filter((a) => !a.completed);
  const completed = actions.filter((a) => a.completed);

  function formatDueDate(dateStr?: string | null) {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Action Items</CardTitle>
            <CardDescription>Tasks and follow-ups for this {context.type}</CardDescription>
          </div>
          {!isAdding && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="space-y-2 rounded-md border p-3">
            <Input
              placeholder="What needs to be done?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-1 h-4 w-4" />
                    {newDueDate ? format(newDueDate, "MMM d") : "Due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!newText.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}

        {incomplete.length === 0 && completed.length === 0 && !isAdding && (
          <div className="text-sm text-muted-foreground">No action items yet</div>
        )}

        {incomplete.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-3 rounded-md border p-3"
          >
            <Checkbox
              checked={false}
              onCheckedChange={() => toggleAction.mutate(action.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{action.text}</div>
              {action.dueDate && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {formatDueDate(action.dueDate)}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteAction.mutate(action.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {completed.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Completed</div>
            {completed.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-md border p-3 opacity-60"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => toggleAction.mutate(action.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm line-through">{action.text}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteAction.mutate(action.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
