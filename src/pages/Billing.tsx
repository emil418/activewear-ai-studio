import { motion } from "framer-motion";
import "lucide-react";
import { Button } from "@/components/ui/button";

const Billing = () => (
  <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl font-bold mb-1">Billing & Usage</h1>
      <p className="text-sm text-muted-foreground">Manage your subscription and track usage.</p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="glass-card p-6 border-primary/30 glow-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-primary font-semibold mb-1">Current Plan</p>
          <h2 className="font-display text-2xl font-bold">Pro</h2>
        </div>
        <Button variant="outline">Upgrade</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Generations</p>
          <p className="font-display text-lg font-bold">127 <span className="text-sm text-muted-foreground font-normal">/ 300</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avatars</p>
          <p className="font-display text-lg font-bold">4 <span className="text-sm text-muted-foreground font-normal">/ 10</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Next Billing</p>
          <p className="font-display text-lg font-bold">Mar 22</p>
        </div>
      </div>
    </motion.div>
  </div>
);
export default Billing;
