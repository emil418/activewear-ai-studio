import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ModulePageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  promptPlaceholder: string;
  features: string[];
}

const ModulePage = ({ icon: Icon, title, subtitle, description, promptPlaceholder, features }: ModulePageProps) => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptPlaceholder}
          className="min-h-[120px] bg-muted/50 border-border resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {features.slice(0, 3).map(f => (
              <span key={f} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">{f}</span>
            ))}
          </div>
          <Button disabled={!prompt.trim()} className="gap-2">
            Generate <Icon className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card aspect-square rounded-xl flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Generated results appear here</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ModulePage;
