import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { useAccountVault, useDeleteProject, useProjects, useUpsertProject } from "@/hooks/useApiData";
import type { ProjectItem, ProjectStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: ProjectStatus[] = ["Active", "Completed", "On Hold"];

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
  hostingStartDate: z.string().optional(),
  status: z.enum(STATUSES as [ProjectStatus, ...ProjectStatus[]]),
  notes: z.string().trim().max(2000).optional(),
});

export default function ProjectsPage() {
  const [params] = useSearchParams();
  const filterStatus = (params.get("status") as ProjectStatus | null) ?? null;

  const vaultQ = useAccountVault();
  const projectsQ = useProjects();
  const upsert = useUpsertProject();
  const del = useDeleteProject();

  const [open, setOpen] = React.useState(false);
  const items = projectsQ.data?.items ?? [];
  const filtered = filterStatus ? items.filter((p) => p.status === filterStatus) : items;

  const vault = vaultQ.data?.items ?? [];

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
      hostingStartDate: "",
      status: "Active",
      notes: "",
    },
  });

  const domainPurchaseDate = form.watch("domainPurchaseDate");
  React.useEffect(() => {
    const hostingStartDate = form.getValues("hostingStartDate");
    if (!hostingStartDate && domainPurchaseDate) {
      form.setValue("hostingStartDate", domainPurchaseDate);
    }
  }, [domainPurchaseDate, form]);

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
        hostingStartDate: values.hostingStartDate || values.domainPurchaseDate || null,
        status: values.status,
        notes: values.notes?.trim() || null,
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
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Client website management with clear account traceability.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Project
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects {filterStatus ? `(filtered: ${filterStatus})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.clientName}</TableCell>
                  <TableCell>{p.projectName}</TableCell>
                  <TableCell>{p.domainName}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "On Hold" ? "secondary" : p.status === "Completed" ? "outline" : "default"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await del.mutateAsync(p.id);
                          toast({ title: "Deleted" });
                        } catch (e: any) {
                          toast({ title: "Delete failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {projectsQ.isLoading ? "Loading…" : "No projects yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Everything references Account Vault first.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                      <Input placeholder="example.com" {...field} />
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Namecheap">Namecheap</SelectItem>
                          <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input {...field} />
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={upsert.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
