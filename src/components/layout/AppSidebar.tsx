import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { Bot, Boxes, Home, Info, Mail } from "lucide-react";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Workspace", url: "/workspace", icon: Boxes },
  { title: "About", url: "/about", icon: Info },
  { title: "Contact", url: "/contact", icon: Mail },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-foreground" : "hover:bg-sidebar-accent/60";

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-r">
      <SidebarHeader className="pt-4">
        <div className="flex items-center gap-2 px-2">
          <Bot className="h-5 w-5 text-primary" />
          {!collapsed && <span className="text-sm font-semibold tracking-wide">Frontline AI</span>}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} aria-current={isActive(item.url) ? "page" : undefined}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
