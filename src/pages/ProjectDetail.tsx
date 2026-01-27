import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Globe, Server, Mail, CreditCard, AlertCircle, Clock, CheckCircle2, User, Building, Edit, IndianRupee, CalendarCheck, CalendarClock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useProjects, useAISubscriptions } from "@/hooks/useApiData";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { useInvoices } from "@/hooks/useInvoices";
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

function formatCurrency(amount?: number | null) {
  if (amount === null || amount === undefined) return "-";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function InfoRow({ label, value, icon: Icon, badge, badgeVariant }: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ElementType;
  badge?: string | null;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium break-words">{value}</div>
        {badge && (
          <Badge variant={badgeVariant ?? "secondary"} className="mt-1">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const projectsQ = useProjects();
  const { items: emailAccounts, loading: emailLoading } = useEmailAccounts();
  const aiSubsQ = useAISubscriptions();
  const { items: invoices, loading: invoicesLoading } = useInvoices();

  const projects = projectsQ.data?.items ?? [];
  const aiSubs = aiSubsQ.data?.items ?? [];

  const project = projects.find((p) => p.id === projectId);

  const isLoading = projectsQ.isLoading || emailLoading || aiSubsQ.isLoading || invoicesLoading;

  if (isLoading) {
    return (
      <main className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
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

  const domainEmail = emailAccounts.find((v) => v.id === project.domainEmailId);
  const deploymentEmail = emailAccounts.find((v) => v.id === project.deploymentEmailId);

  const linkedAiSubs = aiSubs.filter((s) => {
    const email = emailAccounts.find((v) => v.id === s.emailId);
    return email && (email.id === project.domainEmailId || email.id === project.deploymentEmailId);
  });

  const projectInvoices = invoices.filter(
    (inv) =>
      inv.clientName.toLowerCase() === project.clientName.toLowerCase() ||
      (inv.projectName && inv.projectName.toLowerCase() === project.projectName.toLowerCase())
  );

  const domainDays = getDaysLeft(project.domainRenewalDate);
  const hostingDays = getDaysLeft(project.hostingRenewalDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing": return "default";
      case "Completed": return "secondary";
      case "On Hold": return "outline";
      default: return "secondary";
    }
  };

  const getPaymentStatusColor = (status?: string | null) => {
    switch (status) {
      case "Paid": return "default";
      case "Pending": return "destructive";
      case "Partial": return "secondary";
      default: return "outline";
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl" data-testid="text-project-name">
                {project.projectName}
              </h1>
              <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span data-testid="text-client-name">{project.clientName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <AttentionStateSelector
            value={project.attentionState ?? "stable"}
            onChange={() => {}}
            entityType="project"
            entityId={project.id}
          />
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects?edit=${project.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Client Name" value={project.clientName} icon={User} />
                <InfoRow label="Project Name" value={project.projectName} icon={Building} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Domain Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Domain Name" value={project.domainName} icon={Globe} />
                <InfoRow
                  label="Domain Provider"
                  value={project.domainProvider === "Other" ? project.domainProviderOther ?? "Other" : project.domainProvider}
                />
                <InfoRow
                  label="Domain Account Email"
                  value={domainEmail?.email ?? "-"}
                  icon={Mail}
                />
                <InfoRow
                  label="Domain Username"
                  value={project.domainUsername ?? "-"}
                  icon={User}
                />
              </div>
              <Separator className="my-4" />
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <InfoRow
                  label="Domain Purchase Date"
                  value={formatDate(project.domainPurchaseDate)}
                  icon={Calendar}
                />
                <div className="flex items-start gap-3 py-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain Renewal Date</div>
                    <div className="mt-0.5 text-sm font-medium">{formatDate(project.domainRenewalDate)}</div>
                    {domainDays !== null && (
                      <Badge
                        variant={domainDays < 0 ? "destructive" : domainDays <= 30 ? "secondary" : "outline"}
                        className="mt-1"
                      >
                        {getDaysLabel(domainDays)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" />
                Hosting Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Hosting Platform" value={project.hostingPlatform} icon={Server} />
                <InfoRow
                  label="Deployment Email"
                  value={deploymentEmail?.email ?? "-"}
                  icon={Mail}
                />
                <InfoRow
                  label="Deployment Username"
                  value={project.deploymentUsername ?? "-"}
                  icon={User}
                />
              </div>
              <Separator className="my-4" />
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <InfoRow
                  label="Hosting Start Date"
                  value={formatDate(project.hostingStartDate)}
                  icon={Calendar}
                />
                <div className="flex items-start gap-3 py-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hosting Renewal Date</div>
                    <div className="mt-0.5 text-sm font-medium">{formatDate(project.hostingRenewalDate)}</div>
                    {hostingDays !== null && (
                      <Badge
                        variant={hostingDays < 0 ? "destructive" : hostingDays <= 30 ? "secondary" : "outline"}
                        className="mt-1"
                      >
                        {getDaysLabel(hostingDays)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IndianRupee className="h-4 w-4" />
                Payment & Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Project Status" value={project.status} />
                <InfoRow
                  label="Project Amount"
                  value={formatCurrency(project.projectAmount)}
                  icon={IndianRupee}
                />
                <div className="flex items-start gap-3 py-2">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment Status</div>
                    <div className="mt-1">
                      {project.paymentStatus ? (
                        <Badge variant={getPaymentStatusColor(project.paymentStatus)}>
                          {project.paymentStatus}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium">-</span>
                      )}
                    </div>
                  </div>
                </div>
                <InfoRow
                  label="Pending Amount"
                  value={project.pendingAmount && project.pendingAmount > 0 ? (
                    <span className="text-destructive">{formatCurrency(project.pendingAmount)}</span>
                  ) : "-"}
                  icon={IndianRupee}
                />
                <InfoRow
                  label="Completed Date"
                  value={formatDate(project.completedDate)}
                  icon={CalendarCheck}
                />
              </div>
            </CardContent>
          </Card>

          {project.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}

          <ActionItemsSection context={{ type: "project", id: project.id }} />

          <ProjectLogSection projectId={project.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Linked Email Accounts
              </CardTitle>
              <CardDescription>Email accounts associated with this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {domainEmail && (
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{domainEmail.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Domain Account • {domainEmail.provider}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {deploymentEmail && deploymentEmail.id !== domainEmail?.id && (
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{deploymentEmail.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Deployment Account • {deploymentEmail.provider}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!domainEmail && !deploymentEmail && (
                <div className="text-sm text-muted-foreground">No linked email accounts</div>
              )}
            </CardContent>
          </Card>

          {linkedAiSubs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI Subscriptions</CardTitle>
                <CardDescription>Subscriptions linked to project accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkedAiSubs.map((sub) => {
                  const daysLeft = getDaysLeft(sub.cancelByDate);
                  return (
                    <div key={sub.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{sub.toolName}</div>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice History</CardTitle>
              <CardDescription>Recent invoices for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {projectInvoices.length > 0 ? (
                <div className="space-y-2">
                  {projectInvoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(inv.grandTotal)}</div>
                        <Badge
                          variant={inv.paymentStatus === "Paid" ? "default" : inv.paymentStatus === "Overdue" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No invoices found</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
