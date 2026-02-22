import { motion } from "framer-motion";
import { Camera, Target, Shirt, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const quickActions = [
  { icon: Camera, label: "Generate Visual", path: "/dashboard/motion-alive", color: "text-primary" },
  { icon: Target, label: "Create Avatar", path: "/dashboard/athlete-id", color: "text-secondary" },
  { icon: Shirt, label: "Virtual Try-On", path: "/dashboard/dynamic-vto", color: "text-primary" },
  { icon: Sparkles, label: "Place Logo", path: "/dashboard/logo-placement", color: "text-secondary" },
];

const recentItems = [
  { name: "Summer Leggings Collection", type: "MotionAlive", time: "2 hours ago" },
  { name: "Brand Avatar – Athletic Female", type: "AthleteID", time: "5 hours ago" },
  { name: "Hoodie Virtual Try-On", type: "DynamicVTO", time: "1 day ago" },
  { name: "Q3 Campaign Lookbook", type: "CollectionForge", time: "2 days ago" },
];

const stats = [
  { label: "Generations This Month", value: "127", sub: "of 300" },
  { label: "Estimated Cost Saved", value: "€12,400", sub: "+34% vs last month" },
  { label: "Return Rate Reduction", value: "38%", sub: "Industry avg: 12%" },
  { label: "Assets in Library", value: "1,247", sub: "24 collections" },
];

const DashboardHome = () => (
  <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Welcome back</h1>
      <p className="text-muted-foreground">Pick up where you left off or start something new.</p>
    </motion.div>

    {/* Quick Actions */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((a, i) => (
        <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Link to={a.path} className="glass-card-hover p-5 flex flex-col items-center gap-3 text-center group block">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <a.icon className={`w-6 h-6 ${a.color}`} />
            </div>
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
          className="glass-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
          <p className="font-display text-2xl font-bold glow-text">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    {/* Recent */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
        <Link to="/dashboard/library" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {recentItems.map((item) => (
          <div key={item.name} className="glass-card-hover p-4 flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.type}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {item.time}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default DashboardHome;
