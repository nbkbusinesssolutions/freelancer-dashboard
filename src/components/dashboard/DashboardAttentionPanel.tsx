import { Link, useNavigate } from "react-router-dom";

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

export default function DashboardAttentionPanel({
  reminder,
  upcoming,
}: {
  reminder: DashboardReminderHit | null;
  upcoming: DashboardExpiryRow[];
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
              <div className="text-sm font-medium">Upcoming expiries (≤ 7 days)</div>
              <Button variant="outline" className="min-h-11" onClick={() => navigate("/ai-subscriptions")}
              >
                Open
              </Button>
            </div>
            {upcoming.length ? (
              <div className="space-y-2">
                {upcoming.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.toolName}</div>
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
            <Link to="/services">
              <span>Services & Billing</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full justify-between">
            <Link to="/account-vault">
              <span>Add Email / Credential</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
