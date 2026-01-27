import * as React from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { useAISubscriptions, useDeleteAISubscription, useUpsertAISubscription } from "@/hooks/useApiData";
import type { Platform, SubscriptionType } from "@/lib/types";
import { computeSubscriptionStatus } from "@/lib/subscriptionStatus";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
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
import EmailCombobox from "@/components/email-accounts/EmailCombobox";
import { Switch } from "@/components/ui/switch";

import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import AISubscriptionsList from "@/components/ai-subscriptions/AISubscriptionsList";
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

const CORE_PLATFORMS: Exclude<Platform, "Other">[] = [
  "Gmail",
  "Namecheap",
  "GoDaddy",
  "Netlify",
  "Cursor",
  "Lovable",
  "Replit",
];
const TYPES: SubscriptionType[] = ["Free Trial", "Paid"];

const schema = z.object({
  toolName: z.string().trim().min(1).max(100),
  platformName: z.string().trim().min(1, "Select or type a platform").max(50),
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

  const q = useAISubscriptions();
  const upsert = useUpsertAISubscription();
  const del = useDeleteAISubscription();

  const platforms = useMasterList("nbk.master.platforms", CORE_PLATFORMS);
  const tools = useMasterList("nbk.master.aiTools", []);

  const platformOptions = React.useMemo(() => {
    const existing = (q.data?.items ?? []).map((s) => (s.platform === "Other" ? s.platformOther : s.platform) ?? "");
    return uniqCaseInsensitive([...platforms.items, ...existing]).sort((a, b) => a.localeCompare(b));
  }, [platforms.items, q.data?.items]);

  const toolOptions = React.useMemo(() => {
    const existing = (q.data?.items ?? []).map((s) => s.toolName);
    return uniqCaseInsensitive([...tools.items, ...existing]).sort((a, b) => a.localeCompare(b));
  }, [tools.items, q.data?.items]);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<import("@/lib/types").AISubscriptionItem | null>(null);
  const [search, setSearch] = React.useState("");

  const items = (q.data?.items ?? []).map((s) => ({ ...s, computedStatus: computeSubscriptionStatus(s) }));
  const filtered = (filterStatus ? items.filter((s) => s.computedStatus === filterStatus) : items).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const platName = s.platform === "Other" ? s.platformOther : s.platform;
    return (
      s.toolName.toLowerCase().includes(q) ||
      (platName?.toLowerCase().includes(q) ?? false) ||
      (s.notes?.toLowerCase().includes(q) ?? false)
    );
  });

  React.useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`sub-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      toolName: "",
      platformName: "Netlify",
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
    const platformName = values.platformName.trim();
    const isCorePlatform = CORE_PLATFORMS.some((p) => p.toLowerCase() === platformName.toLowerCase());
    const platform: Platform = isCorePlatform
      ? (CORE_PLATFORMS.find((p) => p.toLowerCase() === platformName.toLowerCase()) as Platform)
      : "Other";
    const platformOther = isCorePlatform ? null : platformName;

    try {
      await upsert.mutateAsync({
        ...(editing?.id ? { id: editing.id } : {}),
        toolName: values.toolName,
        platform,
        platformOther,
        emailId: values.emailId,
        password: values.password?.trim() || null,
        subscriptionType: values.subscriptionType,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        cancelByDate: values.cancelByDate || null,
        manualStatus: values.cancelled ? "Cancelled" : null,
        notes: values.notes?.trim() || null,
      });
      toast({ title: editing ? "Subscription updated" : "Subscription saved" });
      setOpen(false);
      setEditing(null);
      form.reset();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">AI Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Prevent forgotten trials and surprise charges.</p>
        </div>
        <Button className="min-h-11 w-full sm:w-auto" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Subscriptions {filterStatus ? `(${filterStatus})` : ""}
          </CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search subscriptions..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <AISubscriptionsList
            items={filtered}
            loading={q.isLoading}
            onEdit={(item) => {
              setEditing(item);
              const platformName = item.platform === "Other" ? item.platformOther : item.platform;
              form.reset({
                toolName: item.toolName,
                platformName: platformName ?? "",
                emailId: item.emailId,
                password: item.password ?? "",
                subscriptionType: item.subscriptionType,
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
                cancelByDate: item.cancelByDate ?? "",
                cancelled: item.manualStatus === "Cancelled",
                notes: item.notes ?? "",
              });
              setOpen(true);
            }}
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
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditing(null);
            form.reset();
          }
        }}
        title={editing ? "Edit Subscription" : "Add Subscription"}
        description="Personal tools only. Optional password is temporary storage."
        contentClassName="max-w-2xl"
      >
        <Form {...form}>
          <form id="ai-sub-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="toolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Tool Name</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(v) => tools.addItem(v)}
                          options={toolOptions}
                          placeholder="Type a tool name…"
                          searchPlaceholder="Search tool history…"
                          addLabel={(v) => `+ Add tool: ${v}`}
                          className="min-h-11"
                        />
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
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={(v) => {
                            const match = TYPES.find((t) => t.toLowerCase() === v.trim().toLowerCase());
                            if (match) field.onChange(match);
                          }}
                          options={TYPES}
                          placeholder="Select type…"
                          searchPlaceholder="Search types…"
                          addLabel={() => "Select one of the standard subscription type values"}
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
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(v) => platforms.addItem(v)}
                          options={platformOptions}
                          placeholder="Select or type a platform…"
                          searchPlaceholder="Search platform…"
                          addLabel={(v) => `+ Add platform: ${v}`}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="emailId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ID Used</FormLabel>
                    <FormControl>
                      <EmailCombobox label="email" valueId={field.value} onChange={field.onChange} />
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

              <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={upsert.isPending}>
                  {upsert.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
        </Form>
      </ResponsiveModal>
    </main>
  );
}
