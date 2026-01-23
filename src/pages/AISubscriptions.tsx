import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { useAccountVault, useAISubscriptions, useDeleteAISubscription, useUpsertAISubscription } from "@/hooks/useApiData";
import type { Platform, SubscriptionType } from "@/lib/types";
import { computeSubscriptionStatus } from "@/lib/subscriptionStatus";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EmailCombobox from "@/components/account-vault/EmailCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PLATFORMS: Platform[] = ["Gmail", "Namecheap", "GoDaddy", "Netlify", "Cursor", "Lovable", "Replit", "Other"];
const TYPES: SubscriptionType[] = ["Free Trial", "Paid"];

const schema = z.object({
  toolName: z.string().trim().min(1).max(100),
  platform: z.enum(PLATFORMS as [Platform, ...Platform[]]),
  platformOther: z.string().trim().max(50).optional(),
  emailId: z.string().min(1, "Select an email"),
  password: z.string().trim().max(200).optional(),
  subscriptionType: z.enum(TYPES as [SubscriptionType, ...SubscriptionType[]]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cancelByDate: z.string().optional(),
  cancelled: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
});

export default function AISubscriptionsPage() {
  const [params] = useSearchParams();
  const filterStatus = params.get("status");
  const focusId = params.get("focus");

  const vaultQ = useAccountVault();
  const q = useAISubscriptions();
  const upsert = useUpsertAISubscription();
  const del = useDeleteAISubscription();
  const vault = vaultQ.data?.items ?? [];

  const [open, setOpen] = React.useState(false);

  const items = (q.data?.items ?? []).map((s) => ({ ...s, computedStatus: computeSubscriptionStatus(s) }));
  const filtered = filterStatus ? items.filter((s) => s.computedStatus === filterStatus) : items;

  React.useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`sub-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      toolName: "",
      platform: "Other",
      platformOther: "",
      emailId: "",
      password: "",
      subscriptionType: "Free Trial",
      startDate: "",
      endDate: "",
      cancelByDate: "",
      cancelled: false,
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await upsert.mutateAsync({
        toolName: values.toolName,
        platform: values.platform,
        platformOther: values.platform === "Other" ? (values.platformOther?.trim() || null) : null,
        emailId: values.emailId,
        password: values.password?.trim() || null,
        subscriptionType: values.subscriptionType,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        cancelByDate: values.cancelByDate || null,
        manualStatus: values.cancelled ? "Cancelled" : null,
        notes: values.notes?.trim() || null,
      });
      toast({ title: "Subscription saved" });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Prevent forgotten trials and surprise charges.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions {filterStatus ? `(filtered: ${filterStatus})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cancel-by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered
                .sort((a, b) => (a.computedStatus === "Expired" ? 1 : -1))
                .map((s) => (
                  <TableRow key={s.id} id={`sub-${s.id}`} className={s.computedStatus === "Expired" ? "opacity-80" : undefined}>
                    <TableCell className="font-medium">{s.toolName}</TableCell>
                    <TableCell>{s.subscriptionType}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.computedStatus === "Expired"
                            ? "destructive"
                            : s.computedStatus === "Expiring Soon"
                              ? "secondary"
                              : s.computedStatus === "Cancelled"
                                ? "outline"
                                : "default"
                        }
                      >
                        {s.computedStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.cancelByDate || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          try {
                            await del.mutateAsync(s.id);
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
                    {q.isLoading ? "Loading…" : "No subscriptions yet."}
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
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Personal tools only. Optional password is temporary storage.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="toolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Tool Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriptionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PLATFORMS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("platform") === "Other" && (
                  <FormField
                    control={form.control}
                    name="platformOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other platform</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Platform Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="emailId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ID Used</FormLabel>
                    <FormControl>
                      <EmailCombobox label="email" items={vault} valueId={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (temporary storage)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cancelByDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancel-By Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cancelled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Manually set Cancelled</FormLabel>
                      <div className="text-xs text-muted-foreground">If enabled, status stays Cancelled.</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
