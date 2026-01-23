import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AccountVaultItem, Platform } from "@/lib/types";
import { useUpsertAccountVault } from "@/hooks/useApiData";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const PLATFORMS: Platform[] = ["Gmail", "Namecheap", "GoDaddy", "Netlify", "Cursor", "Lovable", "Replit", "Other"];

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  platform: z.enum(PLATFORMS as [Platform, ...Platform[]]),
  platformOther: z.string().trim().max(50).optional(),
  username: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export default function AccountVaultUpsertDialog({
  open,
  onOpenChange,
  existing,
  initialEmail,
  takenEmails,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AccountVaultItem;
  initialEmail?: string;
  takenEmails: string[];
  onCreated?: (created: AccountVaultItem) => void;
}) {
  const upsert = useUpsertAccountVault();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: existing?.email ?? initialEmail ?? "",
      platform: existing?.platform ?? "Gmail",
      platformOther: existing?.platformOther ?? "",
      username: existing?.username ?? "",
      notes: existing?.notes ?? "",
      isActive: existing?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      email: existing?.email ?? initialEmail ?? "",
      platform: existing?.platform ?? "Gmail",
      platformOther: existing?.platformOther ?? "",
      username: existing?.username ?? "",
      notes: existing?.notes ?? "",
      isActive: existing?.isActive ?? true,
    });
  }, [open, existing, initialEmail, form]);

  const watchedPlatform = form.watch("platform");

  async function onSubmit(values: z.infer<typeof schema>) {
    const normalized = values.email.trim().toLowerCase();
    const isDuplicate = takenEmails.some((e) => e.toLowerCase() === normalized && e !== existing?.email);
    if (isDuplicate) {
      form.setError("email", { message: "This email already exists in Account Vault" });
      return;
    }

    try {
      const created = await upsert.mutateAsync({
        id: existing?.id,
        email: values.email.trim(),
        platform: values.platform,
        platformOther: values.platform === "Other" ? (values.platformOther?.trim() || null) : null,
        username: values.username?.trim() || null,
        notes: values.notes?.trim() || null,
        isActive: values.isActive,
      });
      toast({ title: existing ? "Account updated" : "Account added" });
      onCreated?.(created);
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ? String(e.message) : "Check your API connectivity.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Account" : "Add to Account Vault"}</DialogTitle>
          <DialogDescription>One email = one source of truth. Keep it clean.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email ID</FormLabel>
                  <FormControl>
                    <Input placeholder="name@domain.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          <SelectValue placeholder="Select platform" />
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

              {watchedPlatform === "Other" && (
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <div className="text-xs text-muted-foreground">Inactive emails remain selectable but dimmed.</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {existing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
