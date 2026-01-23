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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PLATFORMS: Platform[] = ["Gmail", "Namecheap", "GoDaddy", "Netlify", "Cursor", "Lovable", "Replit", "Other"];

type ParsedRow = {
  line: number;
  raw: string;
  email: string;
  username: string;
  valid: boolean;
  duplicate: boolean;
  error?: string;
};

function splitCsvRow(row: string): string[] {
  // Minimal CSV splitting (supports quoted values and escaped quotes)
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseBulkText(input: string) {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { rows: [] as Array<{ email: string; username: string; raw: string; line: number }> };

  // Detect header CSV: email,username
  const firstCols = splitCsvRow(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstCols.includes("email") && (firstCols.includes("username") || firstCols.includes("user") || firstCols.includes("name"));
  const startIndex = hasHeader ? 1 : 0;
  const emailIdx = hasHeader ? firstCols.indexOf("email") : 0;
  const usernameIdx = hasHeader ? Math.max(firstCols.indexOf("username"), firstCols.indexOf("user"), firstCols.indexOf("name")) : 1;

  const rows = lines.slice(startIndex).map((raw, i) => {
    const cols = splitCsvRow(raw);
    const email = (cols[emailIdx] ?? "").trim();
    const username = (cols[usernameIdx] ?? "").trim();
    return { raw, line: startIndex + i + 1, email, username };
  });
  return { rows };
}

const schema = z.object({
  bulkText: z.string().trim().min(1, "Paste emails first"),
  platform: z.enum(PLATFORMS as [Platform, ...Platform[]]),
  platformOther: z.string().trim().max(50).optional(),
  isActive: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
});

export default function AccountVaultBulkAddDialog({
  open,
  onOpenChange,
  takenEmails,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  takenEmails: string[];
}) {
  const upsert = useUpsertAccountVault();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      bulkText: "",
      platform: "Gmail",
      platformOther: "",
      isActive: true,
      skipDuplicates: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      bulkText: "",
      platform: "Gmail",
      platformOther: "",
      isActive: true,
      skipDuplicates: true,
    });
  }, [open, form]);

  const watchedText = form.watch("bulkText");
  const watchedSkip = form.watch("skipDuplicates");

  const parsed = React.useMemo(() => {
    const emailSchema = z.string().trim().email();
    const taken = new Set(takenEmails.map((e) => e.toLowerCase()));

    const { rows } = parseBulkText(watchedText);

    // Dedup within the pasted list (keep first occurrence)
    const seenPaste = new Set<string>();

    const out: ParsedRow[] = rows.map((r) => {
      const normalized = r.email.trim().toLowerCase();
      const duplicateExisting = normalized.length > 0 && taken.has(normalized);
      const duplicatePaste = normalized.length > 0 && seenPaste.has(normalized);
      if (normalized.length > 0) seenPaste.add(normalized);

      const result = emailSchema.safeParse(r.email);
      const valid = result.success && !duplicatePaste;
      return {
        line: r.line,
        raw: r.raw,
        email: r.email.trim(),
        username: r.username.trim(),
        valid,
        duplicate: duplicateExisting,
        error: !result.success ? "Invalid email" : duplicatePaste ? "Duplicate in paste" : undefined,
      };
    });

    const totals = {
      total: out.length,
      invalid: out.filter((r) => !r.valid).length,
      duplicates: out.filter((r) => r.duplicate).length,
      toCreate: out.filter((r) => r.valid && (!r.duplicate || !watchedSkip)).length,
    };

    return { rows: out, totals };
  }, [takenEmails, watchedText, watchedSkip]);

  async function onUploadCsv(file: File) {
    const text = await file.text();
    form.setValue("bulkText", text, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    const platformOther = values.platform === "Other" ? (values.platformOther?.trim() || null) : null;

    const rowsToCreate = parsed.rows.filter((r) => r.valid && (!r.duplicate || !values.skipDuplicates));
    if (rowsToCreate.length === 0) {
      toast({ title: "Nothing to add", description: "All rows are invalid or already exist." });
      return;
    }

    try {
      const results = await Promise.allSettled(
        rowsToCreate.map((r) =>
          upsert.mutateAsync({
            email: r.email,
            platform: values.platform,
            platformOther,
            username: r.username || null,
            notes: null,
            isActive: values.isActive,
          })
        )
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;

      if (failed === 0) {
        toast({ title: `Added ${ok} emails` });
        onOpenChange(false);
      } else {
        toast({
          title: `Added ${ok}, ${failed} failed`,
          description: "Some rows failed to save. Check API connectivity or duplicates constraints on your API.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Bulk add failed", description: e?.message ? String(e.message) : "Check your API.", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Emails</DialogTitle>
          <DialogDescription>
            Paste <span className="font-medium">email,username</span> per line or paste/upload a CSV with headers <span className="font-medium">email,username</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform (applies to all)</FormLabel>
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

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Active by default</FormLabel>
                        <div className="text-xs text-muted-foreground">Applied to all rows.</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skipDuplicates"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Skip duplicates</FormLabel>
                        <div className="text-xs text-muted-foreground">If email already exists in Vault.</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="bulkText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste list</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`email,username\nname@domain.com,nbk\nother@domain.com,`}
                        className="min-h-[220px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">Total: {parsed.totals.total}</Badge>
                    <Badge variant={parsed.totals.invalid > 0 ? "secondary" : "outline"}>Invalid: {parsed.totals.invalid}</Badge>
                    <Badge variant={parsed.totals.duplicates > 0 ? "secondary" : "outline"}>Duplicates: {parsed.totals.duplicates}</Badge>
                    <Badge variant="default">To add: {parsed.totals.toCreate}</Badge>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.rows.slice(0, 8).map((r) => (
                        <TableRow key={`${r.line}-${r.email}-${r.username}`} className={!r.valid || r.duplicate ? "opacity-70" : undefined}>
                          <TableCell className="font-medium">{r.email || <span className="text-muted-foreground">(empty)</span>}</TableCell>
                          <TableCell>{r.username || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell>
                            {!r.valid ? (
                              <Badge variant="destructive">{r.error ?? "Invalid"}</Badge>
                            ) : r.duplicate ? (
                              <Badge variant="secondary">Duplicate</Badge>
                            ) : (
                              <Badge variant="outline">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsed.rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            Paste emails to see preview.
                          </TableCell>
                        </TableRow>
                      )}
                      {parsed.rows.length > 8 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            Showing first 8 rows…
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium">CSV upload (optional)</div>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUploadCsv(f);
                      }}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">CSV headers supported: email,username</div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsert.isPending || parsed.totals.toCreate === 0}>
                Add {parsed.totals.toCreate}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
