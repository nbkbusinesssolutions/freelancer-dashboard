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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { useMasterList } from "@/hooks/useMasterList";

const CORE_PLATFORMS: Exclude<Platform, "Other">[] = [
  "Gmail",
  "Namecheap",
  "GoDaddy",
  "Netlify",
  "Cursor",
  "Lovable",
  "Replit",
];

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  platformName: z.string().trim().min(1, "Select or type a platform").max(50),
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
  const platforms = useMasterList("nbk.master.platforms", CORE_PLATFORMS);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: existing?.email ?? initialEmail ?? "",
      platformName:
        existing?.platform === "Other" ? (existing.platformOther ?? "Other") : (existing?.platform ?? "Gmail"),
      username: existing?.username ?? "",
      notes: existing?.notes ?? "",
      isActive: existing?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      email: existing?.email ?? initialEmail ?? "",
      platformName:
        existing?.platform === "Other" ? (existing.platformOther ?? "Other") : (existing?.platform ?? "Gmail"),
      username: existing?.username ?? "",
      notes: existing?.notes ?? "",
      isActive: existing?.isActive ?? true,
    });
  }, [open, existing, initialEmail, form]);

  async function onSubmit(values: z.infer<typeof schema>) {
    const normalized = values.email.trim().toLowerCase();
    const isDuplicate = takenEmails.some((e) => e.toLowerCase() === normalized && e !== existing?.email);
    if (isDuplicate) {
      form.setError("email", { message: "This email already exists in Account Vault" });
      return;
    }

    const platformName = values.platformName.trim();
    if (platformName) platforms.addItem(platformName);
    const isCorePlatform = CORE_PLATFORMS.some((p) => p.toLowerCase() === platformName.toLowerCase());
    const platform: Platform = isCorePlatform ? (CORE_PLATFORMS.find((p) => p.toLowerCase() === platformName.toLowerCase()) as Platform) : "Other";
    const platformOther = isCorePlatform ? null : platformName;

    try {
      const created = await upsert.mutateAsync({
        id: existing?.id,
        email: values.email.trim(),
        platform,
        platformOther,
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
