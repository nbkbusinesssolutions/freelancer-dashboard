import * as React from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { useAccountVault, useDeleteProject, useProjects, useUpsertProject } from "@/hooks/useApiData";
import type { ProjectItem, ProjectStatus, ProjectPaymentStatus } from "@/lib/types";
import { computeDateExpiry } from "@/lib/dateExpiry";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import EmailCombobox from "@/components/account-vault/EmailCombobox";

import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import ProjectsList from "@/components/projects/ProjectsList";
import { useMasterList } from "@/hooks/useMasterList";

function uniqCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const n = String(v ?? "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

const STATUSES: ProjectStatus[] = ["Active", "Completed", "On Hold"];
const PAYMENT_STATUSES: ProjectPaymentStatus[] = ["Paid", "Pending", "Partial"];

const schema = z.object({
  clientName: z.string().trim().min(1).max(100),
  projectName: z.string().trim().min(1).max(100),
  domainName: z.string().trim().min(1).max(255),
  domainProvider: z.enum(["Namecheap", "GoDaddy", "Other"]),
  domainProviderOther: z.string().trim().max(50).optional(),
  domainEmailId: z.string().min(1, "Select a domain account email"),
  hostingPlatform: z.string().trim().min(1).max(50).default("Netlify"),
  deploymentEmailId: z.string().min(1, "Select a deployment email"),
  domainPurchaseDate: z.string().optional(),
  domainRenewalDate: z.string().optional(),
  hostingStartDate: z.string().optional(),
  hostingRenewalDate: z.string().optional(),
  status: z.enum(STATUSES as [ProjectStatus, ...ProjectStatus[]]),
  notes: z.string().trim().max(2000).optional(),
  projectAmount: z.string().trim().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES as [ProjectPaymentStatus, ...ProjectPaymentStatus[]]).optional(),
  completedDate: z.string().optional(),
  pendingAmount: z.string().trim().optional(),
});

export default function ProjectsPage() {
  const [params] = useSearchParams();
  const filterStatus = (params.get("status") as ProjectStatus | null) ?? null;
  const filterRenewal = (params.get("renewal") as "domain" | "hosting" | "overdue" | null) ?? null;
  const filterPayment = params.get("payment") ?? null;

  const vaultQ = useAccountVault();
  const projectsQ = useProjects();
  const upsert = useUpsertProject();
  const del = useDeleteProject();

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const items = projectsQ.data?.items ?? [];
  const filtered = items.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterPayment === "pending") {
      const ps = p.paymentStatus;
      const pending = p.pendingAmount;
      if ((ps === "Pending" || ps === "Partial") && pending && pending > 0) return true;
      return false;
    }
    if (!filterRenewal) return true;

    const domain = computeDateExpiry(p.domainRenewalDate, 30);
    const hosting = computeDateExpiry(p.hostingRenewalDate, 30);
    if (filterRenewal === "domain") return domain ? domain.status !== "Active" : false;
    if (filterRenewal === "hosting") return hosting ? hosting.status !== "Active" : false;
    // overdue
    return (domain?.daysLeft ?? 9999) < 0 || (hosting?.daysLeft ?? 9999) < 0;
  }).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.clientName.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q) ||
      p.domainName.toLowerCase().includes(q) ||
      (p.hostingPlatform?.toLowerCase().includes(q) ?? false) ||
      (p.notes?.toLowerCase().includes(q) ?? false)
    );
  });

  const vault = vaultQ.data?.items ?? [];

  const hostingPlatforms = useMasterList("nbk.master.hostingPlatforms", ["Netlify"]);
  const domainProviders = useMasterList("nbk.master.domainProviders", ["Namecheap", "GoDaddy"]);

  const hostingPlatformOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...hostingPlatforms.items, ...items.map((p) => p.hostingPlatform)]).sort((a, b) => a.localeCompare(b));
  }, [hostingPlatforms.items, items]);

  const domainProviderOptions = React.useMemo(() => {
    const existing = items.map((p) => (p.domainProvider === "Other" ? p.domainProviderOther : p.domainProvider) ?? "");
    return uniqCaseInsensitive([...domainProviders.items, ...existing]).sort((a, b) => a.localeCompare(b));
  }, [domainProviders.items, items]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: "",
      projectName: "",
      domainName: "",
      domainProvider: "Namecheap",
      domainProviderOther: "",
      domainEmailId: "",
      hostingPlatform: "Netlify",
      deploymentEmailId: "",
      domainPurchaseDate: "",
      domainRenewalDate: "",
      hostingStartDate: "",
      hostingRenewalDate: "",
      status: "Active",
      notes: "",
      projectAmount: "",
      paymentStatus: undefined,
      completedDate: "",
      pendingAmount: "",
    },
  });

  const domainPurchaseDate = form.watch("domainPurchaseDate");
  React.useEffect(() => {
    const hostingStartDate = form.getValues("hostingStartDate");
    if (!hostingStartDate && domainPurchaseDate) {
      form.setValue("hostingStartDate", domainPurchaseDate);
    }
  }, [domainPurchaseDate, form]);

  function parseMoney(input?: string) {
    const n = Number(String(input ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await upsert.mutateAsync({
        clientName: values.clientName,
        projectName: values.projectName,
        domainName: values.domainName,
        domainProvider: values.domainProvider,
        domainProviderOther: values.domainProvider === "Other" ? (values.domainProviderOther?.trim() || null) : null,
        domainEmailId: values.domainEmailId,
        hostingPlatform: values.hostingPlatform,
        deploymentEmailId: values.deploymentEmailId,
        domainPurchaseDate: values.domainPurchaseDate || null,
        domainRenewalDate: values.domainRenewalDate || null,
        hostingStartDate: values.hostingStartDate || values.domainPurchaseDate || null,
        hostingRenewalDate: values.hostingRenewalDate || null,
        status: values.status,
        notes: values.notes?.trim() || null,
        projectAmount: parseMoney(values.projectAmount),
        paymentStatus: values.paymentStatus || null,
        completedDate: values.completedDate || null,
        pendingAmount: parseMoney(values.pendingAmount),
      });
      toast({ title: "Project saved" });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "Check your API.", variant: "destructive" });
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Projects</h1>
          <p className="text-sm text-muted-foreground">Client website management with clear account traceability.</p>
        </div>
        <Button className="min-h-11 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Project
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Projects {filterStatus ? `(${filterStatus})` : filterRenewal ? `(${filterRenewal} renewals)` : ""}
          </CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search projects..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <ProjectsList
            items={filtered}
            loading={projectsQ.isLoading}
            onDelete={async (id) => {
              try {
                await del.mutateAsync(id);
                toast({ title: "Deleted" });
              } catch (e: any) {
                toast({ title: "Delete failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
              }
            }}
          />
        </CardContent>
      </Card>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Create Project"
        description="Everything references Account Vault first."
        contentClassName="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="project-create-form" disabled={upsert.isPending}>
              Save
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="project-create-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="domainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Name</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" placeholder="example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="domainProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Provider</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={
                            form.watch("domainProvider") === "Other"
                              ? form.watch("domainProviderOther") || ""
                              : form.watch("domainProvider")
                          }
                          onChange={(v) => {
                            const name = v.trim();
                            if (!name) return;
                            // Persist globally when a new provider is created/selected.
                            domainProviders.addItem(name);
                            const isCore = ["Namecheap", "GoDaddy"].some((p) => p.toLowerCase() === name.toLowerCase());
                            if (isCore) {
                              const core = (["Namecheap", "GoDaddy"] as const).find((p) => p.toLowerCase() === name.toLowerCase())!;
                              form.setValue("domainProvider", core, { shouldDirty: true, shouldValidate: true });
                              form.setValue("domainProviderOther", "", { shouldDirty: true, shouldValidate: true });
                            } else {
                              form.setValue("domainProvider", "Other", { shouldDirty: true, shouldValidate: true });
                              form.setValue("domainProviderOther", name, { shouldDirty: true, shouldValidate: true });
                            }
                          }}
                          onCreate={(v) => domainProviders.addItem(v)}
                          options={domainProviderOptions}
                          placeholder="Select or type a provider…"
                          searchPlaceholder="Search providers…"
                          addLabel={(v) => `+ Add provider: ${v}`}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("domainProvider") === "Other" && (
                  <FormField
                    control={form.control}
                    name="domainProviderOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter provider" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="domainEmailId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Account Email</FormLabel>
                      <FormControl>
                        <EmailCombobox label="domain email" items={vault} valueId={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deploymentEmailId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deployment Email</FormLabel>
                      <FormControl>
                        <EmailCombobox label="deployment email" items={vault} valueId={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="hostingPlatform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hosting Platform</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(v) => hostingPlatforms.addItem(v)}
                          options={hostingPlatformOptions}
                          placeholder="Type a hosting platform…"
                          searchPlaceholder="Search hosting platforms…"
                          addLabel={(v) => `+ Add hosting platform: ${v}`}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domainPurchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Purchase Date</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domainRenewalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Renewal Date</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hostingStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hosting Start Date</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="hidden md:block" />
                <FormField
                  control={form.control}
                  name="hostingRenewalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hosting Renewal Date</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="hidden md:block" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={(v) => {
                            const match = STATUSES.find((s) => s.toLowerCase() === v.trim().toLowerCase());
                            if (match) field.onChange(match);
                          }}
                          options={STATUSES}
                          placeholder="Select status…"
                          searchPlaceholder="Search status…"
                          addLabel={() => "Select one of the standard project status values"}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="projectAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Amount</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" inputMode="decimal" placeholder="e.g. 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value ?? ""}
                          onChange={(v) => {
                            const match = PAYMENT_STATUSES.find((s) => s.toLowerCase() === v.trim().toLowerCase());
                            if (match) field.onChange(match);
                            else if (!v.trim()) field.onChange(undefined);
                          }}
                          options={PAYMENT_STATUSES}
                          placeholder="Select payment status..."
                          searchPlaceholder="Search status..."
                          addLabel={() => "Select one of the payment status values"}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="completedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completed Date</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pendingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pending Amount</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" inputMode="decimal" placeholder="e.g. 2000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
        </Form>
      </ResponsiveModal>
    </main>
  );
}
