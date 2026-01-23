import * as React from "react";
import { Trash2, Pencil, Plus } from "lucide-react";

import { useAccountVault, useDeleteAccountVault } from "@/hooks/useApiData";
import type { AccountVaultItem } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountVaultUpsertDialog from "@/components/account-vault/AccountVaultUpsertDialog";
import AccountVaultBulkAddDialog from "@/components/account-vault/AccountVaultBulkAddDialog";
import AccountVaultList from "@/components/account-vault/AccountVaultList";

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
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Account Vault</h1>
          <p className="text-sm text-muted-foreground">Central registry of every account email used anywhere.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={() => setBulkOpen(true)}>
            Bulk Add
          </Button>
          <Button
            className="min-h-11 w-full sm:w-auto"
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
          <AccountVaultList
            items={filtered}
            loading={q.isLoading}
            onEdit={(item) => {
              setEditing(item);
              setDialogOpen(true);
            }}
            onDelete={async (id) => {
              try {
                await del.mutateAsync(id);
                toast({ title: "Deleted" });
              } catch (e: any) {
                toast({
                  title: "Cannot delete",
                  description: e?.message ? String(e.message) : "This email may be referenced elsewhere.",
                  variant: "destructive",
                });
              }
            }}
          />
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
