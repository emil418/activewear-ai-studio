import { motion } from "framer-motion";
import { LucideIcon, Upload, Image } from "lucide-react";
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
  showGarmentUpload?: boolean;
}

const ModulePage = ({ icon: Icon, title, subtitle, description, promptPlaceholder, features, showGarmentUpload }: ModulePageProps) => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-4 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-primary/[0.06] flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary/80" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </motion.div>

      {showGarmentUpload && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}>
          <div className="upload-zone">
            <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-sm font-medium mb-1">Upload your garment</p>
            <p className="text-xs text-muted-foreground mb-4">Product photos, sketches, technical drawings — PNG, JPG, PSD, SVG</p>
            <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03]">
              Choose File
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showGarmentUpload ? 0.16 : 0.1, duration: 0.6 }}
        className="glass-card p-7 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptPlaceholder}
          className="min-h-[120px] premium-input resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {features.map(f => (
              <span key={f} className="feature-badge">{f}</span>
            ))}
          </div>
          <Button disabled={!prompt.trim()} className="gap-2 rounded-xl px-6">
            Generate <Icon className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card aspect-square rounded-2xl flex items-center justify-center group cursor-pointer hover:border-white/[0.08] transition-all duration-500">
            <Image className="w-8 h-8 text-muted-foreground/20 group-hover:text-muted-foreground/35 transition-colors duration-500" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ModulePage;
