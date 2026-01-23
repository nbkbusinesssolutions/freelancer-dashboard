import * as React from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BillingLogItem, PaymentStatus, ServiceCadence, ServiceCatalogItem } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import {
  useBillingLog,
  useDeleteBillingLogItem,
  useDeleteServiceCatalogItem,
  useServicesCatalog,
  useUpsertBillingLogItem,
  useUpsertServiceCatalogItem,
} from "@/hooks/useServicesData";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";

import ServicesCatalogList from "@/components/services/ServicesCatalogList";
import BillingLogList from "@/components/services/BillingLogList";
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

const CADENCES: ServiceCadence[] = ["One-time", "Monthly", "Yearly"];
const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Paid", "Overdue"];

const serviceSchema = z.object({
  serviceName: z.string().trim().min(1, "Service name is required").max(120),
  cadence: z.enum(CADENCES as [ServiceCadence, ...ServiceCadence[]]),
  defaultAmount: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional(),
  isActive: z.boolean().default(true),
});

const billingSchema = z.object({
  clientName: z.string().trim().min(1, "Client is required").max(120),
  projectName: z.string().trim().max(120).optional(),
  serviceName: z.string().trim().min(1, "Service is required").max(120),
  cadence: z.enum(CADENCES as [ServiceCadence, ...ServiceCadence[]]),
  amount: z.string().trim().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES as [PaymentStatus, ...PaymentStatus[]]),
  paymentMode: z.string().trim().max(80).optional(),
  serviceDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

function parseMoney(input?: string) {
  const n = Number(String(input ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function ServicesPage() {
  const servicesQ = useServicesCatalog();
  const billingQ = useBillingLog();

  const upsertService = useUpsertServiceCatalogItem();
  const delService = useDeleteServiceCatalogItem();
  const upsertBilling = useUpsertBillingLogItem();
  const delBilling = useDeleteBillingLogItem();

  const services = servicesQ.data?.items ?? [];
  const billing = billingQ.data?.items ?? [];

  const serviceNames = useMasterList("nbk.master.serviceNames", []);
  const clientNames = useMasterList("nbk.master.clientNames", []);
  const projectNames = useMasterList("nbk.master.projectNames", []);
  const paymentModes = useMasterList("nbk.master.paymentModes", ["Bank transfer", "Card", "Cash", "Invoice"]);

  const serviceNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([
      ...serviceNames.items,
      ...services.map((s) => s.serviceName),
      ...billing.map((b) => b.serviceName),
    ]).sort((a, b) => a.localeCompare(b));
  }, [serviceNames.items, services, billing]);

  const clientNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...clientNames.items, ...billing.map((b) => b.clientName)]).sort((a, b) => a.localeCompare(b));
  }, [clientNames.items, billing]);

  const projectNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...projectNames.items, ...billing.map((b) => b.projectName ?? "")]).sort((a, b) => a.localeCompare(b));
  }, [projectNames.items, billing]);

  const paymentModeOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...paymentModes.items, ...billing.map((b) => b.paymentMode ?? "")]).sort((a, b) => a.localeCompare(b));
  }, [paymentModes.items, billing]);

  const [tab, setTab] = React.useState<"catalog" | "billing">("catalog");
  const [serviceOpen, setServiceOpen] = React.useState(false);
  const [billingOpen, setBillingOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServiceCatalogItem | null>(null);
  const [editingBilling, setEditingBilling] = React.useState<BillingLogItem | null>(null);

  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { serviceName: "", cadence: "Monthly", defaultAmount: "", notes: "", isActive: true },
  });

  const billingForm = useForm<z.infer<typeof billingSchema>>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      clientName: "",
      projectName: "",
      serviceName: "",
      cadence: "Monthly",
      amount: "",
      paymentStatus: "Unpaid",
      paymentMode: "",
      serviceDate: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!serviceOpen) return;
    serviceForm.reset({
      serviceName: editingService?.serviceName ?? "",
      cadence: editingService?.cadence ?? "Monthly",
      defaultAmount: typeof editingService?.defaultAmount === "number" ? String(editingService.defaultAmount) : "",
      notes: editingService?.notes ?? "",
      isActive: editingService?.isActive ?? true,
    });
  }, [serviceOpen, editingService, serviceForm]);

  React.useEffect(() => {
    if (!billingOpen) return;
    billingForm.reset({
      clientName: editingBilling?.clientName ?? "",
      projectName: editingBilling?.projectName ?? "",
      serviceName: editingBilling?.serviceName ?? "",
      cadence: editingBilling?.cadence ?? "Monthly",
      amount: typeof editingBilling?.amount === "number" ? String(editingBilling.amount) : "",
      paymentStatus: editingBilling?.paymentStatus ?? "Unpaid",
      paymentMode: editingBilling?.paymentMode ?? "",
      serviceDate: editingBilling?.serviceDate ?? "",
      notes: editingBilling?.notes ?? "",
    });
  }, [billingOpen, editingBilling, billingForm]);

  async function submitService(values: z.infer<typeof serviceSchema>) {
    try {
      const name = values.serviceName.trim();
      await upsertService.mutateAsync({
        id: editingService?.id,
        serviceName: name,
        cadence: values.cadence,
        defaultAmount: parseMoney(values.defaultAmount),
        notes: values.notes?.trim() || null,
        isActive: values.isActive,
      });
      toast({ title: editingService ? "Service updated" : "Service added" });
      setServiceOpen(false);
      setEditingService(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "" , variant: "destructive" });
    }
  }

  async function submitBilling(values: z.infer<typeof billingSchema>) {
    try {
      await upsertBilling.mutateAsync({
        id: editingBilling?.id,
        clientName: values.clientName,
        projectName: values.projectName?.trim() || null,
        serviceName: values.serviceName,
        cadence: values.cadence,
        amount: parseMoney(values.amount),
        paymentStatus: values.paymentStatus,
        paymentMode: values.paymentMode?.trim() || null,
        serviceDate: values.serviceDate || null,
        notes: values.notes?.trim() || null,
      });
      toast({ title: editingBilling ? "Record updated" : "Record added" });
      setBillingOpen(false);
      setEditingBilling(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "" , variant: "destructive" });
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Services & Billing</h1>
          <p className="text-sm text-muted-foreground">Daily-use log for what you deliver and what’s been paid.</p>
        </div>

        {tab === "catalog" ? (
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              setEditingService(null);
              setServiceOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Button>
        ) : (
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              setEditingBilling(null);
              setBillingOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Billing Record
          </Button>
        )}
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Services</TabsTrigger>
          <TabsTrigger value="billing">Billing Log</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicesCatalogList
                items={services}
                loading={servicesQ.isLoading}
                onEdit={(item) => {
                  setEditingService(item);
                  setServiceOpen(true);
                }}
                onDelete={async (id) => {
                  try {
                    await delService.mutateAsync(id);
                    toast({ title: "Deleted" });
                  } catch (e: any) {
                    toast({ title: "Delete failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Billing Records</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingLogList
                items={billing}
                loading={billingQ.isLoading}
                onEdit={(item) => {
                  setEditingBilling(item);
                  setBillingOpen(true);
                }}
                onDelete={async (id) => {
                  try {
                    await delBilling.mutateAsync(id);
                    toast({ title: "Deleted" });
                  } catch (e: any) {
                    toast({ title: "Delete failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponsiveModal
        open={serviceOpen}
        onOpenChange={(o) => {
          setServiceOpen(o);
          if (!o) setEditingService(null);
        }}
        title={editingService ? "Edit Service" : "Add Service"}
        description="Create once; reuse everywhere. Fully mobile-friendly."
        contentClassName="max-w-xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setServiceOpen(false)} className="min-h-11">
              Cancel
            </Button>
            <Button type="submit" form="service-form" disabled={upsertService.isPending} className="min-h-11">
              Save
            </Button>
          </>
        }
      >
        <Form {...serviceForm}>
          <form id="service-form" onSubmit={serviceForm.handleSubmit(submitService)} className="space-y-4">
            <FormField
              control={serviceForm.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <CreatableCombobox
                      value={field.value}
                      onChange={field.onChange}
                      onCreate={(v) => serviceNames.addItem(v)}
                      options={serviceNameOptions}
                      placeholder="Type a service…"
                      searchPlaceholder="Search services…"
                      addLabel={(v) => `+ Add service: ${v}`}
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={serviceForm.control}
                name="cadence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cadence</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={(v) => {
                          const match = CADENCES.find((c) => c.toLowerCase() === v.trim().toLowerCase());
                          if (match) field.onChange(match);
                        }}
                        options={CADENCES}
                        placeholder="Select cadence…"
                        searchPlaceholder="Search cadence…"
                        addLabel={() => "Select one of the standard cadence values"}
                        className="min-h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Amount (optional)</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" inputMode="decimal" placeholder="e.g. 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={serviceForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={serviceForm.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <div className="text-xs text-muted-foreground">Inactive services stay selectable but are visually dimmed.</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ResponsiveModal>

      <ResponsiveModal
        open={billingOpen}
        onOpenChange={(o) => {
          setBillingOpen(o);
          if (!o) setEditingBilling(null);
        }}
        title={editingBilling ? "Edit Billing Record" : "Add Billing Record"}
        description="Fast, phone-first logging. No blockers."
        contentClassName="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setBillingOpen(false)} className="min-h-11">
              Cancel
            </Button>
            <Button type="submit" form="billing-form" disabled={upsertBilling.isPending} className="min-h-11">
              Save
            </Button>
          </>
        }
      >
        <Form {...billingForm}>
          <form id="billing-form" onSubmit={billingForm.handleSubmit(submitBilling)} className="space-y-4">
            <FormField
              control={billingForm.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <CreatableCombobox
                      value={field.value}
                      onChange={field.onChange}
                      onCreate={(v) => clientNames.addItem(v)}
                      options={clientNameOptions}
                      placeholder="Type a client name…"
                      searchPlaceholder="Search clients…"
                      addLabel={(v) => `+ Add client: ${v}`}
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={billingForm.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (optional)</FormLabel>
                  <FormControl>
                    <CreatableCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onCreate={(v) => projectNames.addItem(v)}
                      options={projectNameOptions}
                      placeholder="Type a project name…"
                      searchPlaceholder="Search projects…"
                      addLabel={(v) => `+ Add project: ${v}`}
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={billingForm.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={field.onChange}
                      onCreate={(v) => serviceNames.addItem(v)}
                        options={serviceNameOptions}
                        placeholder="Select or type a service…"
                        searchPlaceholder="Search services…"
                        addLabel={(v) => `+ Add service: ${v}`}
                        className="min-h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={billingForm.control}
                name="cadence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cadence</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={(v) => {
                          const match = CADENCES.find((c) => c.toLowerCase() === v.trim().toLowerCase());
                          if (match) field.onChange(match);
                        }}
                        options={CADENCES}
                        placeholder="Select cadence…"
                        searchPlaceholder="Search cadence…"
                        addLabel={() => "Select one of the standard cadence values"}
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
                control={billingForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (optional)</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" inputMode="decimal" placeholder="e.g. 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={billingForm.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={(v) => {
                          const match = PAYMENT_STATUSES.find((s) => s.toLowerCase() === v.trim().toLowerCase());
                          if (match) field.onChange(match);
                        }}
                        options={PAYMENT_STATUSES}
                        placeholder="Select status…"
                        searchPlaceholder="Search status…"
                        addLabel={() => "Select one of the standard payment status values"}
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
                control={billingForm.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode (optional)</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      onCreate={(v) => paymentModes.addItem(v)}
                        options={paymentModeOptions}
                        placeholder="Type a payment mode…"
                        searchPlaceholder="Search payment modes…"
                        addLabel={(v) => `+ Add payment mode: ${v}`}
                        className="min-h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={billingForm.control}
                name="serviceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (optional)</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={billingForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" {...field} />
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
