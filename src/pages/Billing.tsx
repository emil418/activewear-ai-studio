import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Billing = () => (
  <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Billing & Usage</h1>
      <p className="text-sm text-muted-foreground">Manage your subscription and track usage.</p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
      className="glass-card p-7 border-primary/20 glow-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-primary/70 font-semibold mb-1 tracking-widest uppercase">Current Plan</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Pro</h2>
        </div>
        <Button variant="outline" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03]">Upgrade</Button>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Generations</p>
          <p className="font-display text-lg font-bold">127 <span className="text-sm text-muted-foreground font-normal">/ 400</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Avatars</p>
          <p className="font-display text-lg font-bold">4 <span className="text-sm text-muted-foreground font-normal">/ 10</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Next Billing</p>
          <p className="font-display text-lg font-bold">Mar 22</p>
        </div>
      </div>
    </motion.div>
  </div>
);
export default Billing;
