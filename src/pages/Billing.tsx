import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, CreditCard, ArrowRight } from "lucide-react";

const plans = [
  { name: "Free", price: "€0", credits: 5, current: false },
  { name: "Pro", price: "€99/mo", credits: 400, current: true },
  { name: "Business", price: "€299/mo", credits: -1, current: false },
  { name: "Enterprise", price: "Custom", credits: -1, current: false },
];

const creditCosts = [
  { action: "Image generation", cost: 1 },
  { action: "Video (30s)", cost: 4 },
  { action: "Video + Physics (60s)", cost: 8 },
  { action: "Batch item", cost: 2 },
  { action: "AR/VR Export (GLB)", cost: 5 },
  { action: "Quick Test (3s preview)", cost: 0.5 },
];

const Billing = () => (
  <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Billing & Usage</h1>
      <p className="text-sm text-muted-foreground">Manage your subscription and track credit usage.</p>
    </motion.div>

    {/* Current plan */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
      className="glass-card p-7 border-primary/20 glow-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-primary/70 font-semibold mb-1 tracking-widest uppercase">Current Plan</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Pro</h2>
        </div>
        <Button variant="outline" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03] gap-2">
          <CreditCard className="w-4 h-4" /> Manage Subscription
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Credits Used</p>
          <p className="font-display text-lg font-bold">127 <span className="text-sm text-muted-foreground font-normal">/ 400</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Team Members</p>
          <p className="font-display text-lg font-bold">3 <span className="text-sm text-muted-foreground font-normal">/ 5</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Avatars</p>
          <p className="font-display text-lg font-bold">4 <span className="text-sm text-muted-foreground font-normal">/ 15</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Next Billing</p>
          <p className="font-display text-lg font-bold">Mar 22</p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Credit usage this period</p>
          <p className="text-xs font-semibold text-primary/70">31.8%</p>
        </div>
        <Progress value={31.8} className="h-2 bg-muted" />
      </div>
    </motion.div>

    {/* Credit costs */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
      className="glass-card p-7">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-4 h-4 text-primary/70" />
        <h3 className="font-display text-base font-bold tracking-tight">Credit Costs</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {creditCosts.map(c => (
          <div key={c.action} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-xs text-muted-foreground">{c.action}</span>
            <span className="text-xs font-bold text-primary/80">{c.cost} cr</span>
          </div>
        ))}
      </div>
    </motion.div>

    {/* All plans */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
      <h3 className="font-display text-base font-bold tracking-tight mb-4">All Plans</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {plans.map(p => (
          <div key={p.name} className={`glass-card p-5 text-center ${p.current ? "border-primary/20 glow-border" : ""}`}>
            <p className="font-display text-sm font-bold mb-1">{p.name}</p>
            <p className="font-display text-xl font-black mb-3">{p.price}</p>
            <p className="text-[10px] text-muted-foreground mb-3">
              {p.credits === -1 ? "Unlimited" : `${p.credits} credits/mo`}
            </p>
            {p.current ? (
              <span className="text-[10px] px-3 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-widest">Current</span>
            ) : (
              <Button variant="outline" size="sm" className="rounded-xl border-white/[0.06] text-xs w-full">
                {p.name === "Enterprise" ? "Contact" : "Upgrade"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default Billing;
