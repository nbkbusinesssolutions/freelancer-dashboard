import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AppSidebar from "@/components/layout/AppSidebar";
import ExternalApiSettings from "@/components/api/ExternalApiSettings";
import MobileTopMenu from "@/components/layout/MobileTopMenu";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppShell() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop navigation */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background px-3">
            {/* Mobile navigation: collapsible top menu */}
            {isMobile ? <MobileTopMenu /> : <SidebarTrigger className="min-h-11 min-w-11" />}
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">NBK Control Center</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ExternalApiSettings />
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
