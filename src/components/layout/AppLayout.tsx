import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-svh w-full flex bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content */}
        <SidebarInset>
          <header className="sticky top-0 z-40 glass-nav border-b">
            <TopNav />
          </header>
          <main className="px-4 md:px-8 py-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
