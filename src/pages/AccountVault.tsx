import * as React from "react";
import { Trash2, Pencil, Plus } from "lucide-react";

import { useAccountVault, useDeleteAccountVault } from "@/hooks/useApiData";
import type { AccountVaultItem } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AccountVaultUpsertDialog from "@/components/account-vault/AccountVaultUpsertDialog";
import AccountVaultBulkAddDialog from "@/components/account-vault/AccountVaultBulkAddDialog";

export default function AccountVaultPage() {
  const q = useAccountVault();
  const del = useDeleteAccountVault();

  const items = q.data?.items ?? [];
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AccountVaultItem | undefined>(undefined);
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const takenEmails = React.useMemo(() => items.map((i) => i.email), [items]);
  const filtered = items.filter((i) => i.email.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account Vault</h1>
          <p className="text-sm text-muted-foreground">Central registry of every account email used anywhere.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            Bulk Add
          </Button>
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Email
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Emails</CardTitle>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email…" className="md:max-w-xs" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className={!item.isActive ? "opacity-70" : undefined}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>{item.platform === "Other" ? item.platformOther || "Other" : item.platform}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditing(item);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          try {
                            await del.mutateAsync(item.id);
                            toast({ title: "Deleted" });
                          } catch (e: any) {
                            toast({
                              title: "Cannot delete",
                              description: e?.message ? String(e.message) : "This email may be referenced elsewhere.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {q.isLoading ? "Loading…" : "No emails yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AccountVaultUpsertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existing={editing}
        takenEmails={takenEmails}
      />

      <AccountVaultBulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} takenEmails={takenEmails} />
    </main>
  );
}
