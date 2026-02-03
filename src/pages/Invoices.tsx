import * as React from "react";
import { Plus, Eye, Pencil, Trash2, Printer, FileText, Send } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { format } from "date-fns";

import type { InvoiceItem, InvoiceLineItem, PaymentStatus } from "@/lib/types";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import SendReminderModal from "@/components/invoices/SendReminderModal";
import { useBranding } from "@/hooks/useBranding";

const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Paid", "Partial", "Overdue"];

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
});

const schema = z.object({
  invoiceNumber: z.string().trim().min(1, "Invoice number required"),
  invoiceDate: z.string().min(1, "Invoice date required"),
  dueDate: z.string().optional(),
  clientName: z.string().trim().min(1, "Client name required"),
  clientEmail: z.string().trim().email().optional().or(z.literal("")),
  clientAddress: z.string().trim().max(500).optional(),
  projectName: z.string().trim().max(200).optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES as [PaymentStatus, ...PaymentStatus[]]),
  notes: z.string().trim().max(2000).optional(),
});

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INV-${year}${month}-${random}`;
}

function calculateTotals(lineItems: { quantity: number; rate: number }[], taxRate?: number, discountAmount?: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
  const discount = discountAmount || 0;
  const grandTotal = subtotal + taxAmount - discount;
  return { subtotal, taxAmount, grandTotal };
}

function statusVariant(status: PaymentStatus) {
  switch (status) {
    case "Paid":
      return "default";
    case "Partial":
      return "secondary";
    case "Overdue":
      return "destructive";
    default:
      return "outline";
  }
}

export default function InvoicesPage() {
  const { items, upsert, remove } = useInvoices();
  const brandingQ = useBranding();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<InvoiceItem | null>(null);
  const [previewInvoice, setPreviewInvoice] = React.useState<InvoiceItem | null>(null);
  const [reminderInvoice, setReminderInvoice] = React.useState<InvoiceItem | null>(null);
  const isMobile = useIsMobile();

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.clientName.toLowerCase().includes(q) ||
      (item.projectName?.toLowerCase().includes(q) ?? false)
    );
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: "",
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      projectName: "",
      lineItems: [{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 }],
      taxRate: 0,
      discountAmount: 0,
      paidAmount: 0,
      paymentStatus: "Unpaid",
      notes: "",
    },
  });

  const { fields, append, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        invoiceNumber: editing.invoiceNumber,
        invoiceDate: editing.invoiceDate,
        dueDate: editing.dueDate ?? "",
        clientName: editing.clientName,
        clientEmail: editing.clientEmail ?? "",
        clientAddress: editing.clientAddress ?? "",
        projectName: editing.projectName ?? "",
        lineItems: editing.lineItems.map((li) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity,
          rate: li.rate,
        })),
        taxRate: editing.taxRate ?? 0,
        discountAmount: editing.discountAmount ?? 0,
        paidAmount: editing.paidAmount ?? 0,
        paymentStatus: editing.paymentStatus,
        notes: editing.notes ?? "",
      });
    } else {
      form.reset({
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: "",
        clientName: "",
        clientEmail: "",
        clientAddress: "",
        projectName: "",
        lineItems: [{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 }],
        taxRate: 0,
        discountAmount: 0,
        paidAmount: 0,
        paymentStatus: "Unpaid",
        notes: "",
      });
    }
  }, [open, editing, form]);

  const watchedLineItems = form.watch("lineItems");
  const watchedTaxRate = form.watch("taxRate");
  const watchedDiscount = form.watch("discountAmount");
  const watchedPaid = form.watch("paidAmount");

  const { subtotal, taxAmount, grandTotal } = React.useMemo(
    () => calculateTotals(
      (watchedLineItems || []).map(li => ({ quantity: li.quantity || 0, rate: li.rate || 0 })),
      watchedTaxRate,
      watchedDiscount
    ),
    [watchedLineItems, watchedTaxRate, watchedDiscount]
  );

  const balanceDue = Math.max(0, grandTotal - (watchedPaid || 0));

  function onSubmit(values: z.infer<typeof schema>) {
    const lineItems: InvoiceLineItem[] = values.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
      total: li.quantity * li.rate,
    }));

    const { subtotal, taxAmount, grandTotal } = calculateTotals(
      values.lineItems.map(li => ({ quantity: li.quantity, rate: li.rate })),
      values.taxRate,
      values.discountAmount
    );
    const paidAmount = values.paidAmount || 0;
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    const invoiceData: InvoiceItem = {
      id: editing?.id || crypto.randomUUID(),
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate || null,
      clientName: values.clientName,
      clientEmail: values.clientEmail || null,
      clientAddress: values.clientAddress || null,
      projectName: values.projectName || null,
      lineItems,
      subtotal,
      taxRate: values.taxRate || null,
      taxAmount: taxAmount || null,
      discountAmount: values.discountAmount || null,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus: values.paymentStatus,
      notes: values.notes || null,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    
    upsert(invoiceData);

    toast({ title: editing ? "Invoice updated" : "Invoice created" });
    setOpen(false);
    
    if (!editing) {
      setPreviewInvoice(invoiceData);
    }
    setEditing(null);
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create and manage professional invoices for your clients.</p>
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All Invoices</CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search invoices..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No invoices yet. Create your first invoice." : "No matches found."}
            </p>
          ) : isMobile ? (
            <div className="space-y-3">
              {filtered.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-sm">{inv.clientName}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(inv.paymentStatus)}>
                            {inv.paymentStatus}
                          </Badge>
                          <span className="text-sm font-medium">
                            ₹{inv.grandTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(inv.invoiceDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {inv.paymentStatus !== "Paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            onClick={() => setReminderInvoice(inv)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewInvoice(inv)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(inv);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete invoice {inv.invoiceNumber}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  remove(inv.id);
                                  toast({ title: "Invoice deleted" });
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Invoice #</th>
                    <th className="pb-2 font-medium">Client</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-3 pr-4">{inv.clientName}</td>
                      <td className="py-3 pr-4">{format(new Date(inv.invoiceDate), "MMM dd, yyyy")}</td>
                      <td className="py-3 pr-4 font-medium">₹{inv.grandTotal.toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(inv.paymentStatus)}>
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {inv.paymentStatus !== "Paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                              onClick={() => setReminderInvoice(inv)}
                              title="Send Reminder"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewInvoice(inv)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(inv);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete invoice {inv.invoiceNumber}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    remove(inv.id);
                                    toast({ title: "Invoice deleted" });
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Invoice Modal */}
      <ResponsiveModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        title={editing ? "Edit Invoice" : "Create Invoice"}
        description="Add invoice details and line items."
        contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <Form {...form}>
          <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Client Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="Client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" className="min-h-11" placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Address (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Client address..." rows={2} {...field} />
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
                      <FormLabel>Project Reference (optional)</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="Project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 })}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Description</FormLabel>}
                            <FormControl>
                              <Input className="min-h-10" placeholder="Item description" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Qty</FormLabel>}
                            <FormControl>
                              <Input type="number" step="0.01" className="min-h-10" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Rate</FormLabel>}
                            <FormControl>
                              <Input type="number" step="0.01" className="min-h-10" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right">
                      {index === 0 && <div className="text-xs font-medium mb-2">Total</div>}
                      <div className="min-h-10 flex items-center justify-end text-sm font-medium">
                        ₹{((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.rate || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate % (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="min-h-11" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="min-h-11" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({watchedTaxRate}%)</span>
                    <span>₹{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {(watchedDiscount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-₹{(watchedDiscount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" className="min-h-11" placeholder="0" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
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

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Balance Due: </span>
              <span className="font-semibold">₹{balanceDue.toLocaleString()}</span>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Payment instructions, thank you message, etc..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-11">
                Cancel
              </Button>
              <Button type="submit" className="min-h-11">
                {editing ? "Update" : "Create"} Invoice
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          open={!!previewInvoice}
          onOpenChange={(o) => !o && setPreviewInvoice(null)}
        />
      )}

      {/* Send Reminder Modal */}
      {reminderInvoice && (
        <SendReminderModal
          invoice={reminderInvoice}
          open={!!reminderInvoice}
          onOpenChange={(o) => !o && setReminderInvoice(null)}
          businessName={brandingQ.data?.businessName}
        />
      )}
    </main>
  );
}
