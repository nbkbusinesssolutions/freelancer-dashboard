import { Link, useNavigate } from "react-router-dom";
import { formatISO } from "date-fns";

import { useAISubscriptions, useProjects } from "@/hooks/useApiData";
import { computeSubscriptionStatus, getDaysLeft } from "@/lib/subscriptionStatus";
import { hasShownReminder, markReminderShown, type ReminderStage } from "@/hooks/useLocalReminderLog";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function stageLabel(stage: ReminderStage) {
  if (stage === 0) return "Expired";
  return `${stage} day reminder`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
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

  // Local-only reminders (per-device) – shown once per stage per day.
  const todayIso = formatISO(new Date(), { representation: "date" });
  const reminderStages: ReminderStage[] = [7, 3, 1, 0];
  const reminderHit = computedSubs
    .flatMap((s) => {
      if (!s.cancelByDate || s.manualStatus === "Cancelled") return [];
      const days = s.daysLeft;
      if (days === null) return [];

      const stage = reminderStages.find((st) => (st === 0 ? days < 0 : days === st));
      if (!stage) return [];
      const key = `ai:${s.id}:${stage}`;
      if (hasShownReminder(key, todayIso)) return [];
      return [{ sub: s, stage, key }];
    })
    .sort((a, b) => a.stage - b.stage)[0];

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Where is everything, who owns it, and what needs action.</p>
      </header>

      {reminderHit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Reminder: {stageLabel(reminderHit.stage)}</span>
              <Button
                variant="secondary"
                onClick={() => {
                  markReminderShown(reminderHit.key, todayIso);
                  navigate(`/ai-subscriptions?focus=${encodeURIComponent(reminderHit.sub.id)}`);
                }}
              >
                Review
              </Button>
            </CardTitle>
            <CardDescription>
              {reminderHit.sub.toolName}
              {reminderHit.sub.cancelByDate ? ` • cancel-by ${reminderHit.sub.cancelByDate}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl">{projects.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/projects")}
            >
              View
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Domains</CardDescription>
            <CardTitle className="text-3xl">{projects.filter((p) => p.status === "Active").length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/projects?status=Active")}
            >
              Filter
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Expiring Soon</CardDescription>
            <CardTitle className="text-3xl">{expiringSoon.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/ai-subscriptions?status=Expiring%20Soon")}
            >
              Filter
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expired Items</CardDescription>
            <CardTitle className="text-3xl">{expired.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/ai-subscriptions?status=Expired")}
            >
              Review
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>Fast scan. No clutter.</CardDescription>
          </CardHeader>
          <CardContent>
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
