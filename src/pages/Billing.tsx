import * as React from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BillingLogItem, PaymentStatus, ServiceCadence } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import {
  useBillingLog,
  useDeleteBillingLogItem,
  useUpsertBillingLogItem,
} from "@/hooks/useServicesData";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/ui/search-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
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

export default function BillingPage() {
  const billingQ = useBillingLog();
  const upsertBilling = useUpsertBillingLogItem();
  const delBilling = useDeleteBillingLogItem();

  const billing = billingQ.data?.items ?? [];

  const serviceNames = useMasterList("nbk.master.serviceNames", []);
  const clientNames = useMasterList("nbk.master.clientNames", []);
  const projectNames = useMasterList("nbk.master.projectNames", []);
  const paymentModes = useMasterList("nbk.master.paymentModes", ["Bank transfer", "Card", "Cash", "Invoice"]);

  const [search, setSearch] = React.useState("");
  const [billingOpen, setBillingOpen] = React.useState(false);
  const [editingBilling, setEditingBilling] = React.useState<BillingLogItem | null>(null);

  const serviceNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([
      ...serviceNames.items,
      ...billing.map((b) => b.serviceName),
    ]).sort((a, b) => a.localeCompare(b));
  }, [serviceNames.items, billing]);

  const clientNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...clientNames.items, ...billing.map((b) => b.clientName)]).sort((a, b) => a.localeCompare(b));
  }, [clientNames.items, billing]);

  const projectNameOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...projectNames.items, ...billing.map((b) => b.projectName ?? "")]).sort((a, b) => a.localeCompare(b));
  }, [projectNames.items, billing]);

  const paymentModeOptions = React.useMemo(() => {
    return uniqCaseInsensitive([...paymentModes.items, ...billing.map((b) => b.paymentMode ?? "")]).sort((a, b) => a.localeCompare(b));
  }, [paymentModes.items, billing]);

  const filtered = billing.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(q) ||
      (b.projectName?.toLowerCase().includes(q) ?? false) ||
      b.serviceName.toLowerCase().includes(q) ||
      (b.notes?.toLowerCase().includes(q) ?? false)
    );
  });

  const billingForm = useForm<z.infer<typeof billingSchema>>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      clientName: "",
      projectName: "",
      serviceName: "",
      cadence: "One-time",
      amount: "",
      paymentStatus: "Unpaid",
      paymentMode: "",
      serviceDate: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!billingOpen) return;
    billingForm.reset({
      clientName: editingBilling?.clientName ?? "",
      projectName: editingBilling?.projectName ?? "",
      serviceName: editingBilling?.serviceName ?? "",
      cadence: editingBilling?.cadence ?? "One-time",
      amount: typeof editingBilling?.amount === "number" ? String(editingBilling.amount) : "",
      paymentStatus: editingBilling?.paymentStatus ?? "Unpaid",
      paymentMode: editingBilling?.paymentMode ?? "",
      serviceDate: editingBilling?.serviceDate ?? "",
      notes: editingBilling?.notes ?? "",
    });
  }, [billingOpen, editingBilling, billingForm]);

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
      toast({ title: "Save failed", description: e?.message ? String(e.message) : "", variant: "destructive" });
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Billing</h1>
          <p className="text-sm text-muted-foreground">Track payments and invoices for client work.</p>
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => {
            setEditingBilling(null);
            setBillingOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Billing Record
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Billing Records</CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search billing..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <BillingLogList
            items={filtered}
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

      <ResponsiveModal
        open={billingOpen}
        onOpenChange={(o) => {
          setBillingOpen(o);
          if (!o) setEditingBilling(null);
        }}
        title={editingBilling ? "Edit Billing Record" : "Add Billing Record"}
        description="Record payment details for client work."
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
                      placeholder="Type a client name..."
                      searchPlaceholder="Search clients..."
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
                      placeholder="Type a project name..."
                      searchPlaceholder="Search projects..."
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
                    <FormLabel>Service / Description</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={field.onChange}
                        onCreate={(v) => serviceNames.addItem(v)}
                        options={serviceNameOptions}
                        placeholder="Select or type..."
                        searchPlaceholder="Search services..."
                        addLabel={(v) => `+ Add: ${v}`}
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
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={field.value}
                        onChange={(v) => {
                          const match = CADENCES.find((c) => c.toLowerCase() === v.trim().toLowerCase());
                          if (match) field.onChange(match);
                        }}
                        options={CADENCES}
                        placeholder="Select type..."
                        searchPlaceholder="Search..."
                        addLabel={() => "Select one of the standard values"}
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
                    <FormLabel>Amount</FormLabel>
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
                        placeholder="Select status..."
                        searchPlaceholder="Search status..."
                        addLabel={() => "Select one of the standard values"}
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
                        placeholder="Type a payment mode..."
                        searchPlaceholder="Search..."
                        addLabel={(v) => `+ Add: ${v}`}
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
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="min-h-11" {...field} />
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
                    <Textarea placeholder="Optional notes..." {...field} />
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
