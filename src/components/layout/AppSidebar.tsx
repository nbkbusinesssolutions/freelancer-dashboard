import { Vault, LayoutDashboard, FolderKanban, Sparkles, Settings, Receipt } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Services & Billing", url: "/services", icon: Receipt },
  { title: "AI Subscriptions", url: "/ai-subscriptions", icon: Sparkles },
  { title: "Account Vault", url: "/account-vault", icon: Vault },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-2 flex items-center gap-2">
          <img src="/logo-icon.png" alt="NBK" className="h-8 w-8 rounded" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div>
            <div className="text-xs font-medium text-sidebar-foreground/70">NBK Business Solutions</div>
            <div className="text-sm font-semibold">Control Center</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="w-full"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      onClick={handleNavigate}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
