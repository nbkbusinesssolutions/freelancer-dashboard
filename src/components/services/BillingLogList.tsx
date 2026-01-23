import { Pencil, Trash2 } from "lucide-react";

import type { BillingLogItem } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function paymentBadgeVariant(status: BillingLogItem["paymentStatus"]) {
  if (status === "Overdue") return "destructive" as const;
  if (status === "Unpaid") return "secondary" as const;
  return "default" as const;
}

export default function BillingLogList({
  items,
  loading,
  onEdit,
  onDelete,
}: {
  items: BillingLogItem[];
  loading: boolean;
  onEdit: (item: BillingLogItem) => void;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();

  if (loading) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">Loading…</div>;
  }
  if (items.length === 0) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">No billing records yet. Add one to track what’s paid.</div>;
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((r) => (
          <Card key={r.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Client</div>
                <div className="nbk-break-anywhere font-medium">{r.clientName}</div>
                {r.projectName ? <div className="nbk-break-anywhere mt-1 text-sm text-muted-foreground">{r.projectName}</div> : null}
              </div>
              <div className="shrink-0 text-right">
                <Badge variant={paymentBadgeVariant(r.paymentStatus)}>{r.paymentStatus}</Badge>
                <div className="mt-2 text-sm font-medium">{typeof r.amount === "number" ? `$${r.amount}` : "—"}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Service</div>
                <div className="nbk-break-anywhere text-sm">{r.serviceName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.cadence}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Paid via</div>
                <div className="nbk-break-anywhere text-sm">{r.paymentMode || "—"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.serviceDate || ""}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onEdit(r)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onDelete(r.id)}>
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
            <TableHead>Client</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Cadence</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.clientName}</TableCell>
              <TableCell>{r.projectName || "—"}</TableCell>
              <TableCell>{r.serviceName}</TableCell>
              <TableCell>{r.cadence}</TableCell>
              <TableCell>{typeof r.amount === "number" ? `$${r.amount}` : "—"}</TableCell>
              <TableCell>
                <Badge variant={paymentBadgeVariant(r.paymentStatus)}>{r.paymentStatus}</Badge>
              </TableCell>
              <TableCell>{r.paymentMode || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onEdit(r)}>
                    Edit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onDelete(r.id)}>
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
