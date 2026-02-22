import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const members = [
  { name: "Alex Chen", email: "alex@brand.com", role: "Owner" },
  { name: "Sarah Kim", email: "sarah@brand.com", role: "Editor" },
  { name: "Marcus Lee", email: "marcus@brand.com", role: "Viewer" },
];

const Team = () => (
  <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Team & Permissions</h1>
        <p className="text-sm text-muted-foreground">Manage who has access to your workspace.</p>
      </div>
      <Button className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Invite</Button>
    </motion.div>

    <div className="space-y-2">
      {members.map((m, i) => (
        <motion.div key={m.email} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5 }}
          className="glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center text-primary/80 font-semibold text-sm">
              {m.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] text-muted-foreground border border-white/[0.06]">{m.role}</span>
        </motion.div>
      ))}
    </div>
  </div>
);
export default Team;
