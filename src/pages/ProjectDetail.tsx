import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Globe, Server, Mail, CreditCard, AlertCircle, Clock, CheckCircle2, Circle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useProjects, useAccountVault, useAISubscriptions } from "@/hooks/useApiData";
import { useBillingLog } from "@/hooks/useServicesData";
import { useActions } from "@/hooks/use-actions";
import { useProjectLog } from "@/hooks/use-project-log";
import ActionItemsSection from "@/components/actions/ActionItemsSection";
import ProjectLogSection from "@/components/project-log/ProjectLogSection";
import AttentionStateSelector from "@/components/attention/AttentionStateSelector";

import type { AttentionState } from "@/lib/types";

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

function getDaysLeft(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    return differenceInDays(parseISO(dateStr), new Date());
  } catch {
    return null;
  }
}

function getDaysLabel(days: number | null) {
  if (days === null) return null;
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const projectsQ = useProjects();
  const vaultQ = useAccountVault();
  const aiSubsQ = useAISubscriptions();
  const billingQ = useBillingLog();

  const projects = projectsQ.data?.items ?? [];
  const vault = vaultQ.data?.items ?? [];
  const aiSubs = aiSubsQ.data?.items ?? [];
  const billing = billingQ.data?.items ?? [];

  const project = projects.find((p) => p.id === projectId);

  const isLoading = projectsQ.isLoading || vaultQ.isLoading || aiSubsQ.isLoading || billingQ.isLoading;

  if (isLoading) {
    return (
      <main className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="space-y-6 p-4">
        <Link to="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Project Not Found</h2>
            <p className="mt-2 text-muted-foreground">The project you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const domainEmail = vault.find((v) => v.id === project.domainEmailId);
  const deploymentEmail = vault.find((v) => v.id === project.deploymentEmailId);

  const linkedAiSubs = aiSubs.filter((s) => {
    const email = vault.find((v) => v.id === s.emailId);
    return email && (email.id === project.domainEmailId || email.id === project.deploymentEmailId);
  });

  const projectBilling = billing.filter(
    (b) =>
      b.clientName.toLowerCase() === project.clientName.toLowerCase() ||
      (b.projectName && b.projectName.toLowerCase() === project.projectName.toLowerCase())
  );

  const domainDays = getDaysLeft(project.domainRenewalDate);
  const hostingDays = getDaysLeft(project.hostingRenewalDate);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl" data-testid="text-project-name">
              {project.projectName}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-client-name">
              {project.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === "Active" ? "default" : project.status === "Completed" ? "secondary" : "outline"}>
            {project.status}
          </Badge>
          <AttentionStateSelector
            value={project.attentionState ?? "stable"}
            onChange={() => {}}
            entityType="project"
            entityId={project.id}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Domain</div>
                    <div className="text-sm text-muted-foreground">{project.domainName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Provider: {project.domainProvider === "Other" ? project.domainProviderOther : project.domainProvider}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Server className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Hosting</div>
                    <div className="text-sm text-muted-foreground">{project.hostingPlatform}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" /> Domain Renewal
                  </div>
                  <div className="text-sm">{formatDate(project.domainRenewalDate)}</div>
                  {domainDays !== null && (
                    <Badge variant={domainDays < 0 ? "destructive" : domainDays <= 30 ? "secondary" : "outline"}>
                      {getDaysLabel(domainDays)}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" /> Hosting Renewal
                  </div>
                  <div className="text-sm">{formatDate(project.hostingRenewalDate)}</div>
                  {hostingDays !== null && (
                    <Badge variant={hostingDays < 0 ? "destructive" : hostingDays <= 30 ? "secondary" : "outline"}>
                      {getDaysLabel(hostingDays)}
                    </Badge>
                  )}
                </div>
              </div>

              {project.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium">Notes</div>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked Accounts</CardTitle>
              <CardDescription>Email accounts associated with this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {domainEmail && (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{domainEmail.email}</div>
                    <div className="text-xs text-muted-foreground">Domain account ({domainEmail.platform})</div>
                  </div>
                </div>
              )}
              {deploymentEmail && deploymentEmail.id !== domainEmail?.id && (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{deploymentEmail.email}</div>
                    <div className="text-xs text-muted-foreground">Deployment account ({deploymentEmail.platform})</div>
                  </div>
                </div>
              )}
              {!domainEmail && !deploymentEmail && (
                <div className="text-sm text-muted-foreground">No linked accounts</div>
              )}
            </CardContent>
          </Card>

          {linkedAiSubs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Subscriptions</CardTitle>
                <CardDescription>Subscriptions linked to project accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkedAiSubs.map((sub) => {
                  const daysLeft = getDaysLeft(sub.cancelByDate);
                  return (
                    <div key={sub.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="text-sm font-medium">{sub.toolName}</div>
                        <div className="text-xs text-muted-foreground">
                          Cancel by: {formatDate(sub.cancelByDate)}
                        </div>
                      </div>
                      {daysLeft !== null && (
                        <Badge variant={daysLeft < 0 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>
                          {getDaysLabel(daysLeft)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <ActionItemsSection context={{ type: "project", id: project.id }} />

          <ProjectLogSection projectId={project.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Project Amount</span>
                <span className="font-medium">
                  {project.projectAmount ? `$${project.projectAmount.toLocaleString()}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                {project.paymentStatus ? (
                  <Badge
                    variant={
                      project.paymentStatus === "Paid"
                        ? "default"
                        : project.paymentStatus === "Pending"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {project.paymentStatus}
                  </Badge>
                ) : (
                  <span className="text-sm">-</span>
                )}
              </div>
              {project.pendingAmount && project.pendingAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Amount</span>
                  <span className="font-medium text-destructive">${project.pendingAmount.toLocaleString()}</span>
                </div>
              )}
              {project.completedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">{formatDate(project.completedDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing History</CardTitle>
              <CardDescription>Recent billing for this client/project</CardDescription>
            </CardHeader>
            <CardContent>
              {projectBilling.length > 0 ? (
                <div className="space-y-2">
                  {projectBilling.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-md border p-2">
                      <div>
                        <div className="text-sm font-medium">{b.serviceName}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(b.serviceDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{b.amount ? `$${b.amount}` : "-"}</div>
                        <Badge
                          variant={b.paymentStatus === "Paid" ? "default" : b.paymentStatus === "Overdue" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {b.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No billing records found</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
