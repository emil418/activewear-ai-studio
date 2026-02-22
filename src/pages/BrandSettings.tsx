import { motion } from "framer-motion";
import { Settings, Palette, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BrandSettings = () => (
  <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl font-bold mb-1">Brand Settings</h1>
      <p className="text-sm text-muted-foreground">Customize your brand identity for AI generations.</p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="glass-card p-6 space-y-6">
      <div>
        <Label className="text-sm font-medium mb-2 block">Brand Name</Label>
        <Input placeholder="Your brand name" className="bg-muted/50 max-w-sm" />
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Brand Colors</Label>
        <div className="flex gap-3">
          {["#00FF9F", "#00E0FF", "#0A0A0A", "#FFFFFF"].map(c => (
            <div key={c} className="w-10 h-10 rounded-lg border border-border cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: c }} />
          ))}
          <button className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Logo</Label>
        <div className="glass-card p-8 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, SVG – Max 5MB</p>
        </div>
      </div>

      <Button>Save Settings</Button>
    </motion.div>
  </div>
);
export default BrandSettings;
