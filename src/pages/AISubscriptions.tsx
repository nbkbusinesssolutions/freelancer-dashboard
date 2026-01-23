import * as React from "react";
import { Plus } from "lucide-react";
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

import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { useMasterList } from "@/hooks/useMasterList";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import AISubscriptionsList from "@/components/ai-subscriptions/AISubscriptionsList";

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

  const vaultQ = useAccountVault();
  const q = useAISubscriptions();
  const upsert = useUpsertAISubscription();
  const del = useDeleteAISubscription();
  const vault = vaultQ.data?.items ?? [];

  const platforms = useMasterList("nbk.master.platforms", CORE_PLATFORMS);
  const toolHistory = useMasterList("nbk.master.aiTools", []);

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
    if (platformName) platforms.addItem(platformName);
    if (values.toolName.trim()) toolHistory.addItem(values.toolName.trim());

    const isCorePlatform = CORE_PLATFORMS.some((p) => p.toLowerCase() === platformName.toLowerCase());
    const platform: Platform = isCorePlatform
      ? (CORE_PLATFORMS.find((p) => p.toLowerCase() === platformName.toLowerCase()) as Platform)
      : "Other";
    const platformOther = isCorePlatform ? null : platformName;

    try {
      await upsert.mutateAsync({
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
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions {filterStatus ? `(filtered: ${filterStatus})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <AISubscriptionsList
            items={filtered}
            loading={q.isLoading}
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
        title="Add Subscription"
        description="Personal tools only. Optional password is temporary storage."
        contentClassName="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="ai-sub-form" disabled={upsert.isPending}>
              Save
            </Button>
          </>
        }
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
                          options={[...toolHistory.items, ...Array.from(new Set(items.map((i) => i.toolName))).sort()]}
                          placeholder="Type a tool name…"
                          searchPlaceholder="Search tool history…"
                          addLabel={(v) => `+ Add tool: ${v}`}
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
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value}
                          onChange={field.onChange}
                          options={platforms.items}
                          placeholder="Select or type a platform…"
                          searchPlaceholder="Search platform…"
                          addLabel={(v) => `+ Add platform: ${v}`}
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
            </form>
        </Form>
      </ResponsiveModal>
    </main>
  );
}
