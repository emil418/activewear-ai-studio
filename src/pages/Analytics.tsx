import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";

const cards = [
  { icon: BarChart3, label: "Total Generations", value: "1,247", change: "+18%" },
  { icon: DollarSign, label: "Cost Savings", value: "€48,200", change: "+34%" },
  { icon: TrendingUp, label: "Return Reduction", value: "38%", change: "+5%" },
  { icon: Package, label: "Active Collections", value: "12", change: "+2" },
];

const Analytics = () => (
  <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Analytics</h1>
      <p className="text-sm text-muted-foreground">Track your ROI and content performance.</p>
    </motion.div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6 }}
          className="glass-card p-6">
          <c.icon className="w-5 h-5 text-primary/60 mb-3" />
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="font-display text-2xl font-bold mt-1">{c.value}</p>
          <p className="text-xs text-primary/70 mt-1.5">{c.change}</p>
        </motion.div>
      ))}
    </div>

    <div className="glass-card p-10 flex items-center justify-center min-h-[300px]">
      <p className="text-muted-foreground/40 text-sm">Chart visualizations will appear here</p>
    </div>
  </div>
);
export default Analytics;
