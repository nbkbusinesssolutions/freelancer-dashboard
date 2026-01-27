import * as React from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Mail, Upload } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { EmailAccountItem, EmailAccountStatus, EmailProvider } from "@/lib/types";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";

const PROVIDERS: EmailProvider[] = ["Gmail", "Outlook", "Yahoo", "Zoho", "Custom"];
const STATUSES: EmailAccountStatus[] = ["Active", "Not in use"];
const COMMON_TAGS = ["Domain", "Hosting", "Admin", "Client", "Personal", "Business"];

const schema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  provider: z.enum(PROVIDERS as [EmailProvider, ...EmailProvider[]]),
  password: z.string().trim().max(200).optional(),
  recoveryEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(STATUSES as [EmailAccountStatus, ...EmailAccountStatus[]]),
  tags: z.array(z.string()).optional(),
});

const bulkSchema = z.object({
  bulkText: z.string().min(1, "Please enter at least one email"),
  provider: z.enum(PROVIDERS as [EmailProvider, ...EmailProvider[]]),
  tags: z.array(z.string()).optional(),
  skipDuplicates: z.boolean().default(true),
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailAccountsPage() {
  const { items, upsert, bulkAdd, remove } = useEmailAccounts();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EmailAccountItem | null>(null);
  const [previewItem, setPreviewItem] = React.useState<EmailAccountItem | null>(null);
  const [visiblePasswords, setVisiblePasswords] = React.useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.email.toLowerCase().includes(q) ||
      item.provider.toLowerCase().includes(q) ||
      (item.notes?.toLowerCase().includes(q) ?? false) ||
      (item.tags?.some(t => t.toLowerCase().includes(q)) ?? false)
    );
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      provider: "Gmail",
      password: "",
      recoveryEmail: "",
      phone: "",
      notes: "",
      status: "Active",
      tags: [],
    },
  });

  const bulkForm = useForm<z.infer<typeof bulkSchema>>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      bulkText: "",
      provider: "Gmail",
      tags: [],
      skipDuplicates: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      email: editing?.email ?? "",
      provider: editing?.provider ?? "Gmail",
      password: editing?.password ?? "",
      recoveryEmail: editing?.recoveryEmail ?? "",
      phone: editing?.phone ?? "",
      notes: editing?.notes ?? "",
      status: editing?.status ?? "Active",
      tags: editing?.tags ?? [],
    });
  }, [open, editing, form]);

  React.useEffect(() => {
    if (!bulkOpen) return;
    bulkForm.reset({
      bulkText: "",
      provider: "Gmail",
      tags: [],
      skipDuplicates: true,
    });
  }, [bulkOpen, bulkForm]);

  function onSubmit(values: z.infer<typeof schema>) {
    const result = upsert({
      id: editing?.id,
      email: values.email,
      provider: values.provider,
      password: values.password?.trim() || null,
      recoveryEmail: values.recoveryEmail?.trim() || null,
      phone: values.phone?.trim() || null,
      notes: values.notes?.trim() || null,
      status: values.status,
      tags: values.tags?.length ? values.tags : null,
    });
    toast({ title: editing ? "Email account updated" : "Email account added" });
    setOpen(false);
    
    if (!editing && result) {
      setPreviewItem(result);
    }
    setEditing(null);
  }

  function onBulkSubmit(values: z.infer<typeof bulkSchema>) {
    const lines = values.bulkText
      .split(/[\n,;]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    for (const line of lines) {
      if (isValidEmail(line)) {
        validEmails.push(line);
      } else {
        invalidEmails.push(line);
      }
    }

    if (validEmails.length === 0) {
      toast({ title: "No valid emails found", variant: "destructive" });
      return;
    }

    const result = bulkAdd(validEmails, values.provider, values.tags);

    const messages: string[] = [];
    if (result.added.length > 0) {
      messages.push(`${result.added.length} email(s) added`);
    }
    if (result.skipped.length > 0) {
      messages.push(`${result.skipped.length} duplicate(s) skipped`);
    }
    if (invalidEmails.length > 0) {
      messages.push(`${invalidEmails.length} invalid email(s) ignored`);
    }

    toast({
      title: "Bulk Add Complete",
      description: messages.join(", "),
    });

    setBulkOpen(false);
  }

  function togglePasswordVisibility(id: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Email Accounts</h1>
          <p className="text-sm text-muted-foreground">Central registry of all email accounts used across your business.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => setBulkOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" /> Bulk Add
          </Button>
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Email
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All Email Accounts ({items.length})</CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search emails, tags..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No email accounts yet. Add your first email." : "No matches found."}
            </p>
          ) : isMobile ? (
            <div className="space-y-3">
              {filtered.map((item) => (
                <Card key={item.id} className={item.status === "Not in use" ? "opacity-70" : undefined}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium nbk-break-anywhere">{item.email}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{item.provider}</Badge>
                          <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.password && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Password:</span>
                            <span className="font-mono">
                              {visiblePasswords.has(item.id) ? item.password : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => togglePasswordVisibility(item.id)}
                            >
                              {visiblePasswords.has(item.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {item.recoveryEmail && (
                          <div className="text-sm text-muted-foreground">
                            Recovery: {item.recoveryEmail}
                          </div>
                        )}
                        {item.phone && (
                          <div className="text-sm text-muted-foreground">Phone: {item.phone}</div>
                        )}
                        {item.notes && (
                          <div className="text-sm text-muted-foreground">{item.notes}</div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(item);
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
                              <AlertDialogTitle>Delete Email Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {item.email}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  remove(item.id);
                                  toast({ title: "Deleted" });
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
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium">Password</th>
                    <th className="pb-2 font-medium">Tags</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b last:border-0 ${item.status === "Not in use" ? "opacity-70" : ""}`}
                    >
                      <td className="py-3 pr-4 font-medium">{item.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{item.provider}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {item.password ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {visiblePasswords.has(item.id) ? item.password : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => togglePasswordVisibility(item.id)}
                            >
                              {visiblePasswords.has(item.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(item);
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
                                <AlertDialogTitle>Delete Email Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {item.email}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    remove(item.id);
                                    toast({ title: "Deleted" });
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

      {/* Add/Edit Single Email Modal */}
      <ResponsiveModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        title={editing ? "Edit Email Account" : "Add Email Account"}
        description="Store your email credentials securely in local storage."
        contentClassName="max-w-xl"
      >
        <Form {...form}>
          <form id="email-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@gmail.com" className="min-h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVIDERS.map((p) => (
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder="Select status" />
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="min-h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="recoveryEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery Email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="recovery@example.com" className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 234 567 8900" className="min-h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map((tag) => (
                      <label
                        key={tag}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                          field.value?.includes(tag)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={field.value?.includes(tag) ?? false}
                          onChange={(e) => {
                            const current = field.value ?? [];
                            if (e.target.checked) {
                              field.onChange([...current, tag]);
                            } else {
                              field.onChange(current.filter((t) => t !== tag));
                            }
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                  <FormDescription>Select usage categories for this email</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
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
                Save
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Bulk Add Modal */}
      <ResponsiveModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk Add Email Accounts"
        description="Paste multiple email addresses at once. One per line, or separated by commas."
        contentClassName="max-w-xl"
      >
        <Form {...bulkForm}>
          <form id="bulk-email-form" onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
            <FormField
              control={bulkForm.control}
              name="bulkText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Addresses</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`email1@gmail.com\nemail2@outlook.com\nemail3@yahoo.com`}
                      className="min-h-32 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste emails separated by new lines, commas, or semicolons
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={bulkForm.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Provider</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
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

            <FormField
              control={bulkForm.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Tags (optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map((tag) => (
                      <label
                        key={tag}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                          field.value?.includes(tag)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={field.value?.includes(tag) ?? false}
                          onChange={(e) => {
                            const current = field.value ?? [];
                            if (e.target.checked) {
                              field.onChange([...current, tag]);
                            } else {
                              field.onChange(current.filter((t) => t !== tag));
                            }
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={bulkForm.control}
              name="skipDuplicates"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Skip duplicate emails
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setBulkOpen(false)} className="min-h-11">
                Cancel
              </Button>
              <Button type="submit" className="min-h-11">
                Add Emails
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Preview Modal after creation */}
      {previewItem && (
        <ResponsiveModal
          open={!!previewItem}
          onOpenChange={(o) => !o && setPreviewItem(null)}
          title="Email Account Added"
          description="Here's a summary of the email account you just added."
          contentClassName="max-w-lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium break-all">{previewItem.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">{previewItem.provider}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={previewItem.status === "Active" ? "default" : "secondary"}>
                  {previewItem.status}
                </Badge>
              </div>
              {previewItem.tags && previewItem.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {previewItem.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{previewItem.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </main>
  );
}
