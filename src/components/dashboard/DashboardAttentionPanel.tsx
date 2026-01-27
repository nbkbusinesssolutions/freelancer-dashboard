import { Link, useNavigate } from "react-router-dom";
import { IndianRupee } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type DashboardReminderHit = {
  stageLabel: string;
  toolName: string;
  cancelByDate?: string;
  onReview: () => void;
};

export type DashboardExpiryRow = {
  id: string;
  toolName: string;
  daysLeft: number;
  status: "Active" | "Expiring Soon" | "Expired";
};

export type PendingPaymentRow = {
  id: string;
  clientName: string;
  projectName: string;
  pendingAmount: number;
  paymentStatus: "Pending" | "Partial";
};

export default function DashboardAttentionPanel({
  reminder,
  upcomingAi,
  upcomingDomains,
  upcomingHosting,
  pendingPayments = [],
}: {
  reminder: DashboardReminderHit | null;
  upcomingAi: DashboardExpiryRow[];
  upcomingDomains: DashboardExpiryRow[];
  upcomingHosting: DashboardExpiryRow[];
  pendingPayments?: PendingPaymentRow[];
}) {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Attention</CardTitle>
          <CardDescription className="text-xs">Time-sensitive items requiring action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminder ? (
            <div className="rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Reminder</span>
                    <Badge variant={reminder.stageLabel === "Expired" ? "destructive" : "secondary"}>
                      {reminder.stageLabel}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="nbk-break-anywhere">{reminder.toolName}</span>
                    {reminder.cancelByDate ? <span>{` • cancel-by ${reminder.cancelByDate}`}</span> : null}
                  </div>
                </div>
                <Button variant="secondary" className="min-h-11 w-full sm:w-auto" onClick={reminder.onReview}>
                  Review
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">No reminders today.</div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">AI expiries (≤ 7 days)</div>
              <Button variant="outline" className="min-h-11" onClick={() => navigate("/ai-subscriptions")}>Open</Button>
            </div>
            {upcomingAi.length ? (
              <div className="space-y-2">
                {upcomingAi.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="nbk-break-anywhere font-medium">{s.toolName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Days left: {s.daysLeft}</div>
                    </div>
                    <Badge
                      variant={
                        s.status === "Expired" ? "destructive" : s.status === "Expiring Soon" ? "secondary" : "outline"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">No upcoming expiries.</div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Domain renewals (≤ 30 days)</div>
              <Button variant="outline" className="min-h-11" onClick={() => navigate("/projects?renewal=domain")}>Open</Button>
            </div>
            {upcomingDomains.length ? (
              <div className="space-y-2">
                {upcomingDomains.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="nbk-break-anywhere font-medium">{r.toolName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Days left: {r.daysLeft}</div>
                    </div>
                    <Badge variant={r.status === "Expired" ? "destructive" : r.status === "Expiring Soon" ? "secondary" : "outline"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">No upcoming domain renewals.</div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Hosting renewals (≤ 30 days)</div>
              <Button variant="outline" className="min-h-11" onClick={() => navigate("/projects?renewal=hosting")}>Open</Button>
            </div>
            {upcomingHosting.length ? (
              <div className="space-y-2">
                {upcomingHosting.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="nbk-break-anywhere font-medium">{r.toolName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Days left: {r.daysLeft}</div>
                    </div>
                    <Badge variant={r.status === "Expired" ? "destructive" : r.status === "Expiring Soon" ? "secondary" : "outline"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">No upcoming hosting renewals.</div>
            )}
          </div>

          {pendingPayments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <IndianRupee className="h-4 w-4 text-destructive" />
                    Pending Payments
                  </div>
                  <Button variant="outline" className="min-h-11" onClick={() => navigate("/projects")}>Open</Button>
                </div>
                <div className="space-y-2" data-testid="pending-payments-list">
                  {pendingPayments.slice(0, 6).map((p) => (
                    <div key={p.id} data-testid={`card-pending-payment-${p.id}`} className="flex items-start justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <div className="min-w-0">
                        <div data-testid={`text-client-${p.id}`} className="nbk-break-anywhere font-medium">{p.clientName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{p.projectName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge data-testid={`badge-payment-${p.id}`} variant={p.paymentStatus === "Pending" ? "destructive" : "secondary"}>
                          {p.paymentStatus}
                        </Badge>
                        <span data-testid={`text-amount-${p.id}`} className="text-sm font-medium text-destructive">₹{p.pendingAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Shortcuts</CardTitle>
          <CardDescription className="text-xs">Jump to the next action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="min-h-11 w-full justify-between">
            <Link to="/projects">
              <span>New / Manage Projects</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full justify-between">
            <Link to="/invoices">
              <span>Invoices & Billing</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full justify-between">
            <Link to="/email-accounts">
              <span>Add Email Account</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
