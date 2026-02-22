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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Team & Permissions</h1>
        <p className="text-sm text-muted-foreground">Manage who has access to your workspace.</p>
      </div>
      <Button className="gap-2"><Plus className="w-4 h-4" /> Invite</Button>
    </motion.div>

    <div className="space-y-2">
      {members.map((m, i) => (
        <motion.div key={m.email} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {m.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">{m.role}</span>
        </motion.div>
      ))}
    </div>
  </div>
);
export default Team;
