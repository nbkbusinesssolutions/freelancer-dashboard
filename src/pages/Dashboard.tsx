import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatISO, format, parseISO } from "date-fns";
import { CheckCircle2, Circle, Calendar, ChevronRight } from "lucide-react";

import { useAISubscriptions, useProjects } from "@/hooks/useApiData";
import { useInvoices } from "@/hooks/useInvoices";
import { useIncompleteActions } from "@/hooks/use-actions";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  computeAllUrgencyItems,
  getTopUrgencyItem,
  isAllClear,
  getFinancialVitals,
  type UrgencyItem,
  type InvoiceForUrgency,
  type ProjectForUrgency,
  type AISubscriptionForUrgency,
  type ActionItemForUrgency,
} from "@/lib/urgencyScore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import OneThingCard from "@/components/dashboard/OneThingCard";
import AllClearCard from "@/components/dashboard/AllClearCard";
import FinancialVitalsBar from "@/components/dashboard/FinancialVitalsBar";
import { AttentionBadge } from "@/components/attention/AttentionStateSelector";

function getUrgencyBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 1000) return "destructive";
  if (score >= 500) return "secondary";
  if (score >= 200) return "default";
  return "outline";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const projectsQ = useProjects();
  const subsQ = useAISubscriptions();
  const { items: invoiceItems } = useInvoices();
  const { actions: incompleteActions } = useIncompleteActions();

  const projects = projectsQ.data?.items ?? [];
  const subs = subsQ.data?.items ?? [];

  const invoicesForUrgency: InvoiceForUrgency[] = invoiceItems.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    grandTotal: inv.grandTotal,
    balanceDue: inv.balanceDue,
    paymentStatus: inv.paymentStatus,
    dueDate: inv.dueDate,
    invoiceDate: inv.invoiceDate,
  }));

  const projectsForUrgency: ProjectForUrgency[] = projects.map((p) => ({
    id: p.id,
    clientName: p.clientName,
    projectName: p.projectName,
    domainName: p.domainName,
    domainRenewalDate: p.domainRenewalDate,
    hostingRenewalDate: p.hostingRenewalDate,
    pendingAmount: p.pendingAmount,
    paymentStatus: p.paymentStatus,
  }));

  const subsForUrgency: AISubscriptionForUrgency[] = subs.map((s) => ({
    id: s.id,
    toolName: s.toolName,
    cancelByDate: s.cancelByDate,
    manualStatus: s.manualStatus,
    cost: s.cost,
  }));

  const actionsForUrgency: ActionItemForUrgency[] = incompleteActions.map((a) => ({
    id: a.id,
    text: a.text,
    dueDate: a.dueDate,
    completed: a.completed,
    context: a.context,
  }));

  const urgencyItems = React.useMemo(
    () => computeAllUrgencyItems(invoicesForUrgency, projectsForUrgency, subsForUrgency, actionsForUrgency),
    [invoicesForUrgency, projectsForUrgency, subsForUrgency, actionsForUrgency]
  );

  const topItem = getTopUrgencyItem(urgencyItems);
  const allClear = isAllClear(urgencyItems);
  const financialVitals = React.useMemo(
    () => getFinancialVitals(invoicesForUrgency, subsForUrgency, projectsForUrgency),
    [invoicesForUrgency, subsForUrgency, projectsForUrgency]
  );

  const itemsNeedingAttention = [
    ...projects.filter((p) => p.attentionState && p.attentionState !== "stable").map((p) => ({
      id: p.id,
      type: "project" as const,
      name: `${p.clientName} — ${p.projectName}`,
      attentionState: p.attentionState!,
      link: `/projects/${p.id}`,
    })),
    ...subs.filter((s) => s.attentionState && s.attentionState !== "stable").map((s) => ({
      id: s.id,
      type: "ai-subscription" as const,
      name: s.toolName,
      attentionState: s.attentionState!,
      link: `/ai-subscriptions?focus=${s.id}`,
    })),
  ];

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Command Center</h1>
        <p className="text-sm text-muted-foreground">Your business, under control.</p>
      </header>

      <FinancialVitalsBar
        totalPendingPayments={financialVitals.totalPendingPayments}
        revenueThisMonth={financialVitals.revenueThisMonth}
        thirtyDayExpenseHorizon={financialVitals.thirtyDayExpenseHorizon}
      />

      {allClear ? (
        <AllClearCard revenueThisMonth={financialVitals.revenueThisMonth} />
      ) : topItem ? (
        <OneThingCard item={topItem} />
      ) : null}

      {urgencyItems.length > 1 && !allClear && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Priority Queue</CardTitle>
            <CardDescription>Next items requiring attention, sorted by urgency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgencyItems.slice(1, 6).map((item) => (
                <Link
                  key={item.id}
                  to={item.actionLink}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.context}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getUrgencyBadgeVariant(item.urgencyScore)} className="text-xs">
                      {item.urgencyScore.toLocaleString()}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {urgencyItems.length > 6 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{urgencyItems.length - 6} more items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>Fast scan. No clutter.</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-2">
                {projects.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="block rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="nbk-break-anywhere text-xs text-muted-foreground">{p.clientName}</div>
                        <div className="nbk-break-anywhere font-medium">{p.projectName}</div>
                      </div>
                      <Badge variant={p.status === "On Hold" ? "secondary" : p.status === "Completed" ? "outline" : "default"}>
                        {p.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {projects.length === 0 && <div className="rounded-md border p-3 text-sm text-muted-foreground">No projects yet.</div>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 6).map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <TableCell className="font-medium">{p.clientName}</TableCell>
                      <TableCell>{p.projectName}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "On Hold" ? "secondary" : p.status === "Completed" ? "outline" : "default"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No projects yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            <div className="mt-3">
              <Button asChild variant="link" className="px-0">
                <Link to="/projects">Open Projects →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Incomplete tasks sorted by due date</CardDescription>
          </CardHeader>
          <CardContent>
            {incompleteActions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending action items</div>
            ) : (
              <div className="space-y-2">
                {incompleteActions.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-start gap-3 rounded-md border p-3">
                    <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{action.text}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{action.context.type}</span>
                        {action.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(action.dueDate), "MMM d")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {incompleteActions.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{incompleteActions.length - 5} more items
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {itemsNeedingAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items Needing Attention</CardTitle>
            <CardDescription>Projects and subscriptions you've flagged for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itemsNeedingAttention.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.link}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{item.type.replace("-", " ")}</div>
                  </div>
                  <AttentionBadge value={item.attentionState} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
