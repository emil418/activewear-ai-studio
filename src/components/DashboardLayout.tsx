import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Camera, Target, Shirt, TrendingUp, Layers, Video,
  Image, BarChart3, Users, CreditCard, Settings, Sparkles,
  ChevronLeft, ChevronRight, LogOut, Menu, X
} from "lucide-react";

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
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Active<span className="text-primary">Forge</span>
          </Link>
        )}
        <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all duration-300 text-sidebar-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if ('divider' in item) return <div key={i} className="my-4 border-t border-sidebar-border" />;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 relative ${
                active
                  ? "bg-primary/[0.08] text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              {active && (
                <motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
              )}
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300">
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Log out</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`hidden lg:flex flex-col border-r border-white/[0.04] bg-sidebar transition-all duration-500 ease-out ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/[0.04] bg-background/80 backdrop-blur-2xl flex items-center px-4">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="ml-3 font-display font-bold tracking-tight">Active<span className="text-primary">Forge</span></span>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-60 bg-sidebar border-r border-white/[0.04]">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:pt-0 pt-14 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
