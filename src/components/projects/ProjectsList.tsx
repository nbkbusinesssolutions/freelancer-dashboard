import { Trash2 } from "lucide-react";

import type { ProjectItem, ProjectStatus } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: ProjectStatus) {
  if (status === "On Hold") return "secondary" as const;
  if (status === "Completed") return "outline" as const;
  return "default" as const;
}

export default function ProjectsList({
  items,
  loading,
  onDelete,
}: {
  items: ProjectItem[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-muted-foreground">{p.clientName}</div>
                  <div className="truncate font-medium">{p.projectName}</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{p.domainName}</div>
                </div>
                <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
              </div>

              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => onDelete(p.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">{loading ? "Loading…" : "No projects yet."}</div>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.clientName}</TableCell>
            <TableCell>{p.projectName}</TableCell>
            <TableCell>{p.domainName}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="icon" onClick={() => onDelete(p.id)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground">
              {loading ? "Loading…" : "No projects yet."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
