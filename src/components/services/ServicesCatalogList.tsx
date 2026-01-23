import { Pencil, Trash2 } from "lucide-react";

import type { ServiceCatalogItem } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ServicesCatalogList({
  items,
  loading,
  onEdit,
  onDelete,
}: {
  items: ServiceCatalogItem[];
  loading: boolean;
  onEdit: (item: ServiceCatalogItem) => void;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();

  if (loading) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">Loading…</div>;
  }

  if (items.length === 0) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">No services yet. Add your first service to speed up billing.</div>;
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="nbk-break-anywhere font-medium">{s.serviceName}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{s.cadence}</Badge>
                  <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                  {typeof s.defaultAmount === "number" ? <Badge variant="outline">${s.defaultAmount}</Badge> : null}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onEdit(s)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onDelete(s.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Cadence</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.serviceName}</TableCell>
              <TableCell>{s.cadence}</TableCell>
              <TableCell>{typeof s.defaultAmount === "number" ? `$${s.defaultAmount}` : "—"}</TableCell>
              <TableCell>
                <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onEdit(s)}>
                    Edit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onDelete(s.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
