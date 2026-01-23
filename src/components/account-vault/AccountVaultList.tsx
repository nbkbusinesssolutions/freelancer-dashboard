import { Pencil, Trash2 } from "lucide-react";

import type { AccountVaultItem } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AccountVaultList({
  items,
  loading,
  onEdit,
  onDelete,
}: {
  items: AccountVaultItem[];
  loading: boolean;
  onEdit: (item: AccountVaultItem) => void;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={!item.isActive ? "opacity-80" : undefined}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.email}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.platform === "Other" ? item.platformOther || "Other" : item.platform}
                  </div>
                </div>
                <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => onEdit(item)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" className="w-full" onClick={() => onDelete(item.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            {loading ? "Loading…" : "No emails yet."}
          </div>
        )}
      </div>
    );
  }

  return (
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
        {items.map((item) => (
          <TableRow key={item.id} className={!item.isActive ? "opacity-70" : undefined}>
            <TableCell className="font-medium">{item.email}</TableCell>
            <TableCell>{item.platform === "Other" ? item.platformOther || "Other" : item.platform}</TableCell>
            <TableCell>
              <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="outline" size="icon" onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              {loading ? "Loading…" : "No emails yet."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
