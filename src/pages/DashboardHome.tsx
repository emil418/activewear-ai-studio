import { motion } from "framer-motion";
import { ArrowRight, Zap, Package, Target, Plus, Clock, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const recentItems = [
  { name: "Black Compression Shorts — Squats", time: "2 hours ago" },
  { name: "Running Tank — Sprint Test", time: "5 hours ago" },
  { name: "Training Hoodie — Push-ups", time: "1 day ago" },
];

const stats = [
  { label: "Credits Used", value: "3", sub: "of 5", icon: Zap },
  { label: "Generations", value: "3", sub: "this month", icon: Package },
  { label: "Avg. Fit Score", value: "92%", sub: "across all", icon: Target },
];

const DashboardHome = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload gear, pick a movement, and simulate performance.</p>
        </div>
        <Link to="/dashboard/create">
          <Button className="gap-2 rounded-xl font-bold glow-border">
            <Plus className="w-4 h-4" /> New Generation
          </Button>
        </Link>
      </motion.div>

      {/* Quick start CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}>
        <Link to="/dashboard/create" className="block">
          <div className="glass-card-hover p-8 flex items-center justify-between group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500">
                <Zap className="w-6 h-6 text-primary/80" />
              </div>
              <div>
                <p className="font-display text-lg font-bold tracking-tight">Start a new simulation</p>
                <p className="text-sm text-muted-foreground">Upload → Choose athlete & movement → Get realistic results</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04, duration: 0.5 }}
            className="glass-card p-6">
            <s.icon className="w-4 h-4 text-primary/50 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="font-display text-2xl font-bold glow-text">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold tracking-tight">Recent</h2>
          <Link to="/dashboard/library" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 uppercase tracking-widest font-bold">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentItems.map((item) => (
            <div key={item.name} className="glass-card-hover p-5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Image className="w-4 h-4 text-muted-foreground/30" />
                <p className="text-sm font-medium">{item.name}</p>
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
};

export default DashboardHome;
