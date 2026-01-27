import * as React from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Mail } from "lucide-react";
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

const PROVIDERS: EmailProvider[] = ["Gmail", "Outlook", "Custom"];
const STATUSES: EmailAccountStatus[] = ["Active", "Not in use"];

const schema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  provider: z.enum(PROVIDERS as [EmailProvider, ...EmailProvider[]]),
  password: z.string().trim().max(200).optional(),
  recoveryEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(STATUSES as [EmailAccountStatus, ...EmailAccountStatus[]]),
});

export default function EmailAccountsPage() {
  const { items, upsert, remove } = useEmailAccounts();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EmailAccountItem | null>(null);
  const [visiblePasswords, setVisiblePasswords] = React.useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.email.toLowerCase().includes(q) ||
      item.provider.toLowerCase().includes(q) ||
      (item.notes?.toLowerCase().includes(q) ?? false)
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
    });
  }, [open, editing, form]);

  function onSubmit(values: z.infer<typeof schema>) {
    upsert({
      id: editing?.id,
      email: values.email,
      provider: values.provider,
      password: values.password?.trim() || null,
      recoveryEmail: values.recoveryEmail?.trim() || null,
      phone: values.phone?.trim() || null,
      notes: values.notes?.trim() || null,
      status: values.status,
    });
    toast({ title: editing ? "Email account updated" : "Email account added" });
    setOpen(false);
    setEditing(null);
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
          <p className="text-sm text-muted-foreground">Manage your email account credentials securely.</p>
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Email Account
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All Email Accounts</CardTitle>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search emails..."
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No email accounts yet." : "No matches found."}
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
                    <th className="pb-2 font-medium">Recovery</th>
                    <th className="pb-2 font-medium">Phone</th>
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
                      <td className="py-3 pr-4">{item.recoveryEmail || "-"}</td>
                      <td className="py-3 pr-4">{item.phone || "-"}</td>
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

      <ResponsiveModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        title={editing ? "Edit Email Account" : "Add Email Account"}
        description="Store your email credentials securely in local storage."
        contentClassName="max-w-xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-11">
              Cancel
            </Button>
            <Button type="submit" form="email-form" className="min-h-11">
              Save
            </Button>
          </>
        }
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
          </form>
        </Form>
      </ResponsiveModal>
    </main>
  );
}
