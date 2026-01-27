import * as React from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Receipt, Sparkles, Vault, Settings, Menu, Mail } from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Billing", url: "/services", icon: Receipt },
  { title: "AI Subscriptions", url: "/ai-subscriptions", icon: Sparkles },
  { title: "Email Accounts", url: "/email-accounts", icon: Mail },
  { title: "Account Vault", url: "/account-vault", icon: Vault },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function MobileTopMenu({ className }: { className?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className={cn("min-h-11 min-w-11", className)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <nav className="p-2">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  end
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                    "hover:bg-muted",
                    isActive(item.url) ? "bg-muted font-medium" : "",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="min-w-0 flex-1">{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
