import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatISO } from "date-fns";

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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardAttentionPanel from "@/components/dashboard/DashboardAttentionPanel";
import DashboardKpiGrid, { type DashboardKpi } from "@/components/dashboard/DashboardKpiGrid";

function stageLabel(stage: ReminderStage) {
  // Back-compat helper for AI reminder stages.
  return dateStageLabel(stage as unknown as DateReminderStage);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const projectsQ = useProjects();
  const subsQ = useAISubscriptions();

  const projects = projectsQ.data?.items ?? [];
  const subs = subsQ.data?.items ?? [];

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

  const kpis: DashboardKpi[] = [
    {
      title: "Total Projects",
      value: projects.length,
      actionLabel: "Open",
      actionTo: "/projects",
      sparkline: projects.map((p) => (p.status === "Active" ? 1 : 0)).slice(-14),
      tone: "primary",
    },
    {
      title: "Active Domains",
      value: projects.filter((p) => p.status === "Active").length,
      actionLabel: "Filter",
      actionTo: "/projects?status=Active",
      sparkline: projects.map((p) => (p.status === "Active" ? 1 : 0)).slice(-14),
      tone: "muted",
    },
    {
      title: "AI Expiring Soon",
      value: expiringSoon.length,
      actionLabel: "Review",
      actionTo: "/ai-subscriptions?status=Expiring%20Soon",
      sparkline: computedSubs
        .filter((s) => s.daysLeft !== null && s.daysLeft <= 14)
        .slice(0, 14)
        .map((s) => Math.max(0, 14 - (s.daysLeft ?? 14))),
      tone: "muted",
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
                        <div className="truncate text-xs text-muted-foreground">{p.clientName}</div>
                        <div className="truncate font-medium">{p.projectName}</div>
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
                          <div className="truncate font-medium">{s.toolName}</div>
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
    </main>
  );
}
