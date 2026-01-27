import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatISO, format, parseISO } from "date-fns";
import { CheckCircle2, Circle, Calendar } from "lucide-react";

import { useAISubscriptions, useProjects } from "@/hooks/useApiData";
import { computeSubscriptionStatus, getDaysLeft } from "@/lib/subscriptionStatus";
import { hasShownReminder, markReminderShown, type ReminderStage } from "@/hooks/useLocalReminderLog";
import {
  computeDateExpiry,
  DEFAULT_REMINDER_THRESHOLDS,
  matchReminderStage,
  stageLabel as dateStageLabel,
  stagePriority,
  type DateReminderStage,
} from "@/lib/dateExpiry";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIncompleteActions } from "@/hooks/use-actions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardAttentionPanel from "@/components/dashboard/DashboardAttentionPanel";
import DashboardKpiGrid, { type DashboardKpi } from "@/components/dashboard/DashboardKpiGrid";
import FinancialSnapshot from "@/components/financial/FinancialSnapshot";
import { AttentionBadge } from "@/components/attention/AttentionStateSelector";

function stageLabel(stage: ReminderStage) {
  // Back-compat helper for AI reminder stages.
  return dateStageLabel(stage as unknown as DateReminderStage);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const projectsQ = useProjects();
  const subsQ = useAISubscriptions();
  const { actions: incompleteActions } = useIncompleteActions();

  const projects = projectsQ.data?.items ?? [];
  const subs = subsQ.data?.items ?? [];

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

  const computedSubs = subs
    .map((s) => {
      const status = computeSubscriptionStatus(s);
      const daysLeft = s.cancelByDate ? getDaysLeft(s.cancelByDate) : null;
      return { ...s, status, daysLeft };
    })
    .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

  const expiringSoon = computedSubs.filter((s) => s.status === "Expiring Soon");
  const expired = computedSubs.filter((s) => s.status === "Expired");

  const upcoming7 = computedSubs
    .filter((s) => s.daysLeft !== null && s.daysLeft <= 7)
    .map((s) => ({
      id: s.id,
      toolName: s.toolName,
      daysLeft: s.daysLeft as number,
      status: s.status as "Active" | "Expiring Soon" | "Expired",
    }));

  const domainUpcoming30 = projects
    .map((p) => {
      const exp = computeDateExpiry(p.domainRenewalDate, 30);
      if (!exp) return null;
      if (exp.daysLeft > 30) return null;
      return {
        id: p.id,
        toolName: `${p.clientName} — ${p.domainName}`,
        daysLeft: exp.daysLeft,
        status: exp.status,
      } as const;
    })
    .filter(Boolean)
    .sort((a, b) => (a!.daysLeft ?? 9999) - (b!.daysLeft ?? 9999)) as Array<{
    id: string;
    toolName: string;
    daysLeft: number;
    status: "Active" | "Expiring Soon" | "Expired";
  }>;

  const hostingUpcoming30 = projects
    .map((p) => {
      const exp = computeDateExpiry(p.hostingRenewalDate, 30);
      if (!exp) return null;
      if (exp.daysLeft > 30) return null;
      return {
        id: p.id,
        toolName: `${p.clientName} — ${p.projectName}`,
        daysLeft: exp.daysLeft,
        status: exp.status,
      } as const;
    })
    .filter(Boolean)
    .sort((a, b) => (a!.daysLeft ?? 9999) - (b!.daysLeft ?? 9999)) as Array<{
    id: string;
    toolName: string;
    daysLeft: number;
    status: "Active" | "Expiring Soon" | "Expired";
  }>;

  // Local-only reminders (per-device) – shown once per stage per day.
  const todayIso = formatISO(new Date(), { representation: "date" });
  const reminderCandidates: Array<{
    stage: DateReminderStage;
    key: string;
    title: string;
    dateIso?: string;
    onReview: () => void;
  }> = [];

  // AI
  computedSubs.forEach((s) => {
    if (!s.cancelByDate || s.manualStatus === "Cancelled") return;
    if (s.daysLeft === null) return;
    const stage = matchReminderStage(s.daysLeft, DEFAULT_REMINDER_THRESHOLDS);
    if (!stage) return;
    const key = `ai:${s.id}:${stage}`;
    if (hasShownReminder(key, todayIso)) return;
    reminderCandidates.push({
      stage,
      key,
      title: `AI — ${s.toolName}`,
      dateIso: s.cancelByDate ?? undefined,
      onReview: () => navigate(`/ai-subscriptions?focus=${encodeURIComponent(s.id)}`),
    });
  });

  // Projects: domain + hosting
  projects.forEach((p) => {
    const domain = p.domainRenewalDate ? getDaysLeft(p.domainRenewalDate) : null;
    if (domain !== null) {
      const stage = matchReminderStage(domain, DEFAULT_REMINDER_THRESHOLDS);
      if (stage) {
        const key = `domain:${p.id}:${stage}`;
        if (!hasShownReminder(key, todayIso)) {
          reminderCandidates.push({
            stage,
            key,
            title: `Domain — ${p.clientName} • ${p.domainName}`,
            dateIso: p.domainRenewalDate ?? undefined,
            onReview: () => navigate(`/projects?renewal=domain`),
          });
        }
      }
    }

    const hosting = p.hostingRenewalDate ? getDaysLeft(p.hostingRenewalDate) : null;
    if (hosting !== null) {
      const stage = matchReminderStage(hosting, DEFAULT_REMINDER_THRESHOLDS);
      if (stage) {
        const key = `hosting:${p.id}:${stage}`;
        if (!hasShownReminder(key, todayIso)) {
          reminderCandidates.push({
            stage,
            key,
            title: `Hosting — ${p.clientName} • ${p.projectName}`,
            dateIso: p.hostingRenewalDate ?? undefined,
            onReview: () => navigate(`/projects?renewal=hosting`),
          });
        }
      }
    }
  });

  const reminderHit = reminderCandidates.sort((a, b) => stagePriority(a.stage) - stagePriority(b.stage))[0];

  // Local notifications (no backend): only when app is open.
  // We request permission only when we actually have a reminder to show.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (!reminderHit) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const show = () => {
      try {
        new Notification(`Reminder: ${dateStageLabel(reminderHit.stage)}`, {
          body: reminderHit.title,
        });
      } catch {
        // ignore
      }
    };

    if (Notification.permission === "granted") {
      show();
      markReminderShown(reminderHit.key, todayIso);
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          show();
          markReminderShown(reminderHit.key, todayIso);
        }
      });
    }
  }, [reminderHit, todayIso]);

  const pendingPayments = projects
    .filter((p) => {
      const status = p.paymentStatus;
      const pending = p.pendingAmount;
      return (status === "Pending" || status === "Partial") && pending && pending > 0;
    })
    .map((p) => ({
      id: p.id,
      clientName: p.clientName,
      projectName: p.projectName,
      pendingAmount: p.pendingAmount!,
      paymentStatus: p.paymentStatus as "Pending" | "Partial",
    }))
    .sort((a, b) => b.pendingAmount - a.pendingAmount);

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.pendingAmount, 0);

  const kpis: DashboardKpi[] = [
    {
      title: "Total Projects",
      value: projects.length,
      actionLabel: "Open",
      actionTo: "/projects",
      sparkline: projects.map((p) => (p.status === "Ongoing" ? 1 : 0)).slice(-14),
      tone: "primary",
    },
    {
      title: "Ongoing Projects",
      value: projects.filter((p) => p.status === "Ongoing").length,
      actionLabel: "Filter",
      actionTo: "/projects?status=Ongoing",
      sparkline: projects.map((p) => (p.status === "Ongoing" ? 1 : 0)).slice(-14),
      tone: "muted",
    },
    {
      title: "Pending Payments",
      value: `₹${totalPending.toLocaleString("en-IN")}`,
      actionLabel: "Review",
      actionTo: "/projects?payment=pending",
      sparkline: pendingPayments.slice(0, 14).map((p) => Math.min(10, p.pendingAmount / 1000)),
      tone: totalPending > 0 ? "destructive" : "muted",
    },
    {
      title: "Expired Items",
      value: expired.length,
      actionLabel: "Review",
      actionTo: "/ai-subscriptions?status=Expired",
      sparkline: computedSubs
        .filter((s) => s.daysLeft !== null)
        .slice(0, 14)
        .map((s) => ((s.daysLeft ?? 0) < 0 ? Math.min(14, Math.abs(s.daysLeft ?? 0)) : 0)),
      tone: "destructive",
    },
  ];

  return (
    <main className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Operational view — fast scan, clear next actions.</p>
      </header>

      <DashboardAttentionPanel
        reminder={
          reminderHit
            ? {
                stageLabel: stageLabel(reminderHit.stage as unknown as ReminderStage),
                toolName: reminderHit.title,
                cancelByDate: reminderHit.dateIso,
                onReview: () => {
                  markReminderShown(reminderHit.key, todayIso);
                  reminderHit.onReview();
                },
              }
            : null
        }
        upcomingAi={upcoming7}
        upcomingDomains={domainUpcoming30}
        upcomingHosting={hostingUpcoming30}
        pendingPayments={pendingPayments}
      />

      <DashboardKpiGrid items={kpis} />

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
                  <div key={p.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="nbk-break-anywhere text-xs text-muted-foreground">{p.clientName}</div>
                        <div className="nbk-break-anywhere font-medium">{p.projectName}</div>
                      </div>
                      <Badge variant={p.status === "On Hold" ? "secondary" : p.status === "Completed" ? "outline" : "default"}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
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
                    <TableRow key={p.id}>
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
            <CardTitle>Upcoming Expiries (Next 7 Days)</CardTitle>
            <CardDescription>Personal tools only.</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-2">
                {computedSubs
                  .filter((s) => s.daysLeft !== null && s.daysLeft <= 7)
                  .slice(0, 7)
                  .map((s) => (
                    <div key={s.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="nbk-break-anywhere font-medium">{s.toolName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Days left: {s.daysLeft}</div>
                        </div>
                        <Badge variant={s.status === "Expired" ? "destructive" : s.status === "Expiring Soon" ? "secondary" : "outline"}>
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {computedSubs.filter((s) => s.daysLeft !== null && s.daysLeft <= 7).length === 0 && (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">No upcoming expiries.</div>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Days left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computedSubs
                    .filter((s) => s.daysLeft !== null && s.daysLeft <= 7)
                    .slice(0, 7)
                    .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.toolName}</TableCell>
                        <TableCell>{s.daysLeft}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "Expired" ? "destructive" : s.status === "Expiring Soon" ? "secondary" : "outline"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  {computedSubs.filter((s) => s.daysLeft !== null && s.daysLeft <= 7).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No upcoming expiries.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            <div className="mt-3">
              <Button asChild variant="link" className="px-0">
                <Link to="/ai-subscriptions">Open AI Subscriptions →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FinancialSnapshot />

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
