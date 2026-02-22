import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Camera, Target, Shirt, TrendingUp, Layers, Video,
  Image, BarChart3, Users, CreditCard, Settings, Sparkles,
  ChevronLeft, ChevronRight, LogOut, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Camera, label: "MotionAlive", path: "/dashboard/motion-alive" },
  { icon: Target, label: "AthleteID", path: "/dashboard/athlete-id" },
  { icon: Shirt, label: "DynamicVTO", path: "/dashboard/dynamic-vto" },
  { icon: TrendingUp, label: "FitEvolve", path: "/dashboard/fit-evolve" },
  { icon: Layers, label: "CollectionForge", path: "/dashboard/collection-forge" },
  { icon: Video, label: "CampaignFlow", path: "/dashboard/campaign-flow" },
  { icon: Sparkles, label: "LogoPlacement", path: "/dashboard/logo-placement" },
  { divider: true },
  { icon: Image, label: "Library", path: "/dashboard/library" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Users, label: "Team", path: "/dashboard/team" },
  { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
  { icon: Settings, label: "Brand Settings", path: "/dashboard/settings" },
] as const;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/" className="font-display text-lg font-bold">
            Fit<span className="text-primary">Lumoo</span>
          </Link>
        )}
        <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          if ('divider' in item) return <div key={i} className="my-3 border-t border-sidebar-border" />;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Log out</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-xl flex items-center px-4">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="ml-3 font-display font-bold">Fit<span className="text-primary">Lumoo</span></span>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-60 bg-sidebar border-r border-border">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:pt-0 pt-14 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
