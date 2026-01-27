import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EmailAccountItem } from "@/lib/types";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function EmailCombobox({
  label,
  valueId,
  onChange,
  showAddButton = true,
}: {
  label: string;
  valueId: string | undefined;
  onChange: (id: string) => void;
  showAddButton?: boolean;
}) {
  const { items } = useEmailAccounts();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = valueId ? items.find((i) => i.id === valueId) : null;

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    return item.email.toLowerCase().includes(query.toLowerCase());
  });

  const handleSelect = (itemId: string) => {
    onChange(itemId);
    setOpen(false);
    setQuery("");
  };

  const content = (
    <Command>
      <CommandInput
        placeholder={`Search ${label.toLowerCase()}...`}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No email found.</CommandEmpty>
        <CommandGroup>
          {filtered.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onSelect={() => handleSelect(item.id)}
              className={cn(!item.status || item.status === "Not in use" ? "opacity-70" : "")}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  valueId === item.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span>{item.email}</span>
                <span className="text-xs text-muted-foreground">{item.provider}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("min-h-11 w-full min-w-0 justify-between", selected?.status === "Not in use" && "opacity-70")}
          >
            <span className="truncate">{selected?.email ?? `Select ${label}...`}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("min-h-11 w-full min-w-0 justify-between", selected?.status === "Not in use" && "opacity-70")}
        >
          <span className="truncate">{selected?.email ?? `Select ${label}...`}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}
