import { Pencil, Trash2 } from "lucide-react";

import type { AISubscriptionItem } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type ItemWithStatus = AISubscriptionItem & { computedStatus: string };

function statusVariant(status: string) {
  if (status === "Expired") return "destructive" as const;
  if (status === "Expiring Soon") return "secondary" as const;
  if (status === "Cancelled") return "outline" as const;
  return "default" as const;
}

export default function AISubscriptionsList({
  items,
  loading,
  onEdit,
  onDelete,
}: {
  items: ItemWithStatus[];
  loading: boolean;
  onEdit: (item: AISubscriptionItem) => void;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items
          .slice()
          .sort((a, b) => (a.computedStatus === "Expired" ? 1 : -1))
          .map((s) => (
            <Card key={s.id} id={`sub-${s.id}`} className={s.computedStatus === "Expired" ? "opacity-80" : undefined}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.toolName}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{s.subscriptionType}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Cancel-by: {s.cancelByDate || "—"}</div>
                  </div>
                  <Badge variant={statusVariant(s.computedStatus)}>{s.computedStatus}</Badge>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => onEdit(s)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{s.toolName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(s.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}

        {items.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">{loading ? "Loading…" : "No subscriptions yet."}</div>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tool</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Cancel-by</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items
          .slice()
          .sort((a, b) => (a.computedStatus === "Expired" ? 1 : -1))
          .map((s) => (
            <TableRow key={s.id} id={`sub-${s.id}`} className={s.computedStatus === "Expired" ? "opacity-80" : undefined}>
              <TableCell className="font-medium">{s.toolName}</TableCell>
              <TableCell>{s.subscriptionType}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(s.computedStatus)}>{s.computedStatus}</Badge>
              </TableCell>
              <TableCell>{s.cancelByDate || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="icon" onClick={() => onEdit(s)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{s.toolName}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(s.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground">
              {loading ? "Loading…" : "No subscriptions yet."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
