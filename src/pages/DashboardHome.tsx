import { motion } from "framer-motion";
import { Camera, Target, Shirt, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: Camera, label: "Generate Visual", desc: "Text to product image", path: "/dashboard/motion-alive" },
  { icon: Target, label: "Create Avatar", desc: "Consistent brand models", path: "/dashboard/athlete-id" },
  { icon: Shirt, label: "Virtual Try-On", desc: "See garments on avatars", path: "/dashboard/dynamic-vto" },
  { icon: Sparkles, label: "Place Logo", desc: "Brand your garments", path: "/dashboard/logo-placement" },
];

const recentItems = [
  { name: "Summer Leggings Collection", type: "MotionAlive", time: "2 hours ago" },
  { name: "Brand Avatar – Athletic Female", type: "AthleteID", time: "5 hours ago" },
  { name: "Hoodie Virtual Try-On", type: "DynamicVTO", time: "1 day ago" },
  { name: "Q3 Campaign Lookbook", type: "CollectionForge", time: "2 days ago" },
];

const stats = [
  { label: "Generations This Month", value: "127", sub: "of 400" },
  { label: "Estimated Cost Saved", value: "€12,400", sub: "+34% vs last month" },
  { label: "Return Rate Reduction", value: "38%", sub: "Industry avg: 12%" },
  { label: "Assets in Library", value: "1,247", sub: "24 collections" },
];

const DashboardHome = () => (
  <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-1 tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">Pick up where you left off or start something new.</p>
    </motion.div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickActions.map((a, i) => (
        <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6 }}>
          <Link to={a.path} className="glass-card-hover p-6 flex flex-col items-center gap-3 text-center group block">
            <div className="w-12 h-12 rounded-2xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500">
              <a.icon className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <span className="text-sm font-medium block">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
          className="glass-card p-6">
          <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
          <p className="font-display text-2xl font-bold glow-text">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">Recent Activity</h2>
        <Link to="/dashboard/library" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-wide font-medium">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {recentItems.map((item) => (
          <div key={item.name} className="glass-card-hover p-5 flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {item.time}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default DashboardHome;
