import { motion } from "framer-motion";
import { Camera, Target, Shirt, Sparkles, ArrowRight, Clock, Layers, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: Camera, label: "Motion Simulate", desc: "Physics-accurate video", path: "/dashboard/motion-alive" },
  { icon: Target, label: "Build Athlete", desc: "Sport presets & metrics", path: "/dashboard/athlete-id" },
  { icon: Shirt, label: "Virtual Try-On", desc: "Compression heatmaps", path: "/dashboard/dynamic-vto" },
  { icon: Layers, label: "Batch Collection", desc: "ZIP/CSV → full drop", path: "/dashboard/collection-forge" },
  { icon: Sparkles, label: "Place Logo", desc: "Motion-accurate branding", path: "/dashboard/logo-placement" },
  { icon: Leaf, label: "Eco Simulator", desc: "Sustainable material testing", path: "/dashboard/motion-alive" },
];

const recentItems = [
  { name: "Sprint Compression Shorts — Multi-Angle", type: "MotionAlive", time: "2 hours ago" },
  { name: "Athlete Builder — CrossFit XL", type: "Athlete Builder", time: "5 hours ago" },
  { name: "Training Hoodie — Squat Physics Test", type: "DynamicVTO", time: "1 day ago" },
  { name: "Q3 Drop — 12 pieces batch processed", type: "CollectionForge", time: "2 days ago" },
];

const stats = [
  { label: "Generations This Month", value: "127", sub: "of 500" },
  { label: "Estimated Cost Saved", value: "€18,200", sub: "+42% vs last month" },
  { label: "Return Rate Reduction", value: "38%", sub: "Industry avg: 12%" },
  { label: "Physics Simulations", value: "94", sub: "18 collections tested" },
];

const DashboardHome = () => (
  <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-1 tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">Upload gear → Select athlete & motion → Simulate performance.</p>
    </motion.div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {quickActions.map((a, i) => (
        <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.5 }}>
          <Link to={a.path} className="glass-card-hover p-5 flex flex-col items-center gap-2.5 text-center group block">
            <div className="w-11 h-11 rounded-2xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500">
              <a.icon className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <span className="text-xs font-semibold block">{a.label}</span>
              <span className="text-[10px] text-muted-foreground">{a.desc}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.04, duration: 0.5 }}
          className="glass-card p-6">
          <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
          <p className="font-display text-2xl font-bold glow-text">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight">Recent Activity</h2>
        <Link to="/dashboard/library" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest font-bold">
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
