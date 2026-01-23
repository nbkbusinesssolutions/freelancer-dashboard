import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import type { AccountVaultItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import AccountVaultUpsertDialog from "@/components/account-vault/AccountVaultUpsertDialog";

export default function EmailCombobox({
  label,
  items,
  valueId,
  onChange,
}: {
  label: string;
  items: AccountVaultItem[];
  valueId: string | undefined;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [prefillEmail, setPrefillEmail] = React.useState<string>("");

  const selected = items.find((i) => i.id === valueId);
  const normalizedQuery = query.trim().toLowerCase();
  const exactMatch = normalizedQuery.length > 0 && items.some((i) => i.email.toLowerCase() === normalizedQuery);

  const takenEmails = React.useMemo(() => items.map((i) => i.email), [items]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", selected && !selected.isActive && "opacity-70")}
          >
            <span className="truncate">
              {selected ? selected.email : <span className="text-muted-foreground">Select {label}…</span>}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Search ${label}…`}
              value={query}
              onValueChange={(v) => setQuery(v)}
            />
            <CommandList>
              <CommandEmpty>No email found.</CommandEmpty>
              <CommandGroup heading="Account Vault">
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.email}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    className={cn(!item.isActive && "opacity-70")}
                  >
                    <Check className={cn("mr-2 h-4 w-4", valueId === item.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{item.email}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {!exactMatch && normalizedQuery.includes("@") && (
                <CommandGroup heading="Quick add">
                  <CommandItem
                    value={`+ Add ${normalizedQuery}`}
                    onSelect={() => {
                      setPrefillEmail(query.trim());
                      setAddOpen(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    + Add this email to Account Vault
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AccountVaultUpsertDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialEmail={prefillEmail}
        takenEmails={takenEmails}
        onCreated={(created) => onChange(created.id)}
      />
    </>
  );
}
