import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Briefcase, DollarSign, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useProjects } from "@/hooks/useApiData";
import { useBillingLog } from "@/hooks/useServicesData";
import { useActions } from "@/hooks/use-actions";
import ActionItemsSection from "@/components/actions/ActionItemsSection";
import { AttentionBadge } from "@/components/attention/AttentionStateSelector";

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const clientName = clientId ? decodeURIComponent(clientId) : "";

  const projectsQ = useProjects();
  const billingQ = useBillingLog();

  const projects = projectsQ.data?.items ?? [];
  const billing = billingQ.data?.items ?? [];

  const isLoading = projectsQ.isLoading || billingQ.isLoading;

  const clientProjects = projects.filter(
    (p) => p.clientName.toLowerCase() === clientName.toLowerCase()
  );

  const clientBilling = billing.filter(
    (b) => b.clientName.toLowerCase() === clientName.toLowerCase()
  );

  const totalBilled = clientBilling.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const totalPaid = clientBilling
    .filter((b) => b.paymentStatus === "Paid")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  if (isLoading) {
    return (
      <main className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (clientProjects.length === 0) {
    return (
      <main className="space-y-6 p-4">
        <Link to="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Client Not Found</h2>
            <p className="mt-2 text-muted-foreground">No projects found for this client.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {clientName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
              <CardDescription>All projects for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{project.projectName}</div>
                      <div className="text-xs text-muted-foreground">{project.domainName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.attentionState && project.attentionState !== "stable" && (
                      <AttentionBadge value={project.attentionState} />
                    )}
                    <Badge
                      variant={
                        project.status === "Ongoing"
                          ? "default"
                          : project.status === "Completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <ActionItemsSection context={{ type: "client", id: clientName }} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Billed</span>
                <span className="font-medium">${totalBilled.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="font-medium text-green-600">${totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="font-medium text-orange-600">
                  ${(totalBilled - totalPaid).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Billing</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {clientBilling.length > 0 ? (
                <div className="space-y-2">
                  {clientBilling.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-md border p-2">
                      <div>
                        <div className="text-sm font-medium">{b.serviceName}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(b.serviceDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{b.amount ? `$${b.amount}` : "-"}</div>
                        <Badge
                          variant={
                            b.paymentStatus === "Paid"
                              ? "default"
                              : b.paymentStatus === "Overdue"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {b.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No billing records</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
