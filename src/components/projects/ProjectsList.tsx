import { Trash2, Calendar, Clock, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";

import type { ProjectItem, ProjectStatus, ProjectPaymentStatus } from "@/lib/types";
import { computeDateExpiry } from "@/lib/dateExpiry";
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

function paymentVariant(status?: ProjectPaymentStatus | null) {
  if (status === "Pending") return "destructive" as const;
  if (status === "Partial") return "secondary" as const;
  return "outline" as const;
}

function expiryVariant(status: "Active" | "Expiring Soon" | "Expired") {
  if (status === "Expired") return "destructive" as const;
  if (status === "Expiring Soon") return "secondary" as const;
  return "outline" as const;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function getDaysLeftLabel(daysLeft: number) {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
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
        {items.map((p) => {
          const domain = computeDateExpiry(p.domainRenewalDate, 30);
          const hosting = computeDateExpiry(p.hostingRenewalDate, 30);
          const hasPendingPayment = p.paymentStatus === "Pending" || p.paymentStatus === "Partial";
          
          return (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="nbk-break-anywhere text-sm text-muted-foreground">{p.clientName}</div>
                    <div className="nbk-break-anywhere font-medium">{p.projectName}</div>
                    <div className="mt-1 nbk-break-anywhere text-sm text-muted-foreground">{p.domainName}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    {p.paymentStatus && (
                      <Badge variant={paymentVariant(p.paymentStatus)}>
                        <DollarSign className="mr-1 h-3 w-3" />
                        {p.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>

                {p.status === "Completed" && p.completedDate && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Completed: {formatDate(p.completedDate)}
                  </div>
                )}

                {hasPendingPayment && typeof p.pendingAmount === "number" && p.pendingAmount > 0 && (
                  <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm">
                    <span className="font-medium text-destructive">Pending: ${p.pendingAmount}</span>
                  </div>
                )}

                {(domain || hosting) && (
                  <div className="mt-3 space-y-2">
                    {domain && (
                      <div className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">Domain Renewal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(p.domainRenewalDate)}</span>
                          <Badge variant={expiryVariant(domain.status)}>
                            {getDaysLeftLabel(domain.daysLeft)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {hosting && (
                      <div className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">Hosting Renewal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(p.hostingRenewalDate)}</span>
                          <Badge variant={expiryVariant(hosting.status)}>
                            {getDaysLeftLabel(hosting.daysLeft)}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <Button variant="outline" className="min-h-11 w-full" onClick={() => onDelete(p.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">{loading ? "Loading..." : "No projects yet."}</div>
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
          <TableHead>Renewals</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => {
          const domain = computeDateExpiry(p.domainRenewalDate, 30);
          const hosting = computeDateExpiry(p.hostingRenewalDate, 30);
          const hasPendingPayment = p.paymentStatus === "Pending" || p.paymentStatus === "Partial";
          
          return (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.clientName}</TableCell>
              <TableCell>
                <div>{p.projectName}</div>
                {p.status === "Completed" && p.completedDate && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(p.completedDate)}
                  </div>
                )}
              </TableCell>
              <TableCell>{p.domainName}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  {domain ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={expiryVariant(domain.status)}>
                        Domain: {getDaysLeftLabel(domain.daysLeft)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(p.domainRenewalDate)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Domain: No date</span>
                  )}
                  {hosting ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={expiryVariant(hosting.status)}>
                        Hosting: {getDaysLeftLabel(hosting.daysLeft)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(p.hostingRenewalDate)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Hosting: No date</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
              </TableCell>
              <TableCell>
                {p.paymentStatus ? (
                  <div className="space-y-1">
                    <Badge data-testid={`badge-payment-status-${p.id}`} variant={paymentVariant(p.paymentStatus)}>{p.paymentStatus}</Badge>
                    {hasPendingPayment && typeof p.pendingAmount === "number" && p.pendingAmount > 0 && (
                      <div data-testid={`text-pending-amount-${p.id}`} className="text-xs font-medium text-destructive">${p.pendingAmount} pending</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="icon" onClick={() => onDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground">
              {loading ? "Loading..." : "No projects yet."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
