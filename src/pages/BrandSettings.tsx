import { motion } from "framer-motion";
import { Palette, Upload, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useInfluencerMode } from "@/hooks/useInfluencerMode";

const BrandSettings = () => {
  const { influencerMode, setInfluencerMode } = useInfluencerMode();

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Brand Settings</h1>
        <p className="text-sm text-muted-foreground">Your brand kit for consistent AI generations.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}
        className="glass-card p-7 space-y-7">
        <div>
          <Label className="text-sm font-semibold mb-2.5 block">Brand Name</Label>
          <Input placeholder="Your brand name" className="premium-input max-w-sm" />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2.5 block">Brand Colors</Label>
          <div className="flex gap-3">
            {["#00FF85", "#00E5FF", "#000000", "#FFFFFF"].map(c => (
              <div key={c} className="w-10 h-10 rounded-xl border border-white/[0.06] cursor-pointer hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: c }} />
            ))}
            <button className="w-10 h-10 rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/[0.2] transition-all duration-300">
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2.5 block">Brand Logo</Label>
          <div className="upload-zone">
            <Upload className="w-6 h-6 text-primary/40 mb-3" />
            <p className="font-display text-sm font-bold mb-1 uppercase tracking-wide">Upload your logo</p>
            <p className="text-xs text-muted-foreground mb-4">PNG or SVG with transparency — Max 5MB</p>
            <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03] font-semibold">
              Choose File
            </Button>
          </div>
        </div>

        <Button className="gap-2 rounded-xl font-bold">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </motion.div>

      {/* Influencer Mode */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }}
        className="glass-card p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold">Creator / Influencer Mode</p>
              <p className="text-xs text-muted-foreground">Simplified UI with bigger buttons, fewer options, and a "Send to Brand" action.</p>
            </div>
          </div>
          <Switch checked={influencerMode} onCheckedChange={setInfluencerMode} />
        </div>
        {influencerMode && (
          <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10 text-xs text-secondary/80">
            Creator Mode is active. The Create page will show a streamlined interface with auto-applied brand kit and sharing options.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BrandSettings;
