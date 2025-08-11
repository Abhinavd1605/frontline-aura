import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <div className="container mx-auto flex h-16 items-center justify-between px-3">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <NavLink to="/" className="text-sm font-semibold tracking-wide story-link">Frontline AI</NavLink>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm">
        <NavLink to="/workspace" className="story-link">Workspace</NavLink>
        <NavLink to="/about" className="story-link">About</NavLink>
        <NavLink to="/contact" className="story-link">Contact</NavLink>
      </nav>
      <div className="flex items-center gap-2">
        <Button variant="glass" size="sm">Request demo</Button>
      </div>
    </div>
  );
}
