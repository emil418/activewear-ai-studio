import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, Move, RotateCw, Maximize2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const placements = [
  { label: "Chest Left" },
  { label: "Chest Center" },
  { label: "Sleeve Left" },
  { label: "Back Center" },
  { label: "Waistband" },
  { label: "Leg Left" },
];

const renderStyles = [
  { label: "Screen Print" },
  { label: "Embroidery" },
  { label: "Reflective" },
  { label: "Sublimation" },
];

const LogoPlacement = () => {
  const [activeRender, setActiveRender] = useState(0);
  const [activePlacement, setActivePlacement] = useState(0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-4 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-primary/[0.06] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary/80" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">LogoPlacement</h1>
            <p className="text-sm text-muted-foreground">Sport-optimized logo integration — follows fabric in motion</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
          className="space-y-6">
          <div className="upload-zone">
            <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-sm font-medium mb-1">Upload your logo</p>
            <p className="text-xs text-muted-foreground mb-4">PNG or SVG with transparency recommended</p>
            <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03]">
              Choose File
            </Button>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary/60" />
              <p className="text-sm font-medium">Sport-Optimized Placements</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {placements.map((p, i) => (
                <button key={p.label} onClick={() => setActivePlacement(i)}
                  className={`text-xs px-3.5 py-2 rounded-xl transition-all duration-300 ${
                    activePlacement === i
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1]"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <p className="text-sm font-medium">Adjustments</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-12">Size</span>
                <Slider defaultValue={[50]} max={100} step={1} className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-12">Rotate</span>
                <Slider defaultValue={[0]} max={360} step={1} className="flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-12">Opacity</span>
                <Slider defaultValue={[100]} max={100} step={1} className="flex-1" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }}
          className="space-y-6">
          <div className="glass-card aspect-[3/4] rounded-2xl flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent" />
            <div className="text-center z-10">
              <Move className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/50">Garment preview with logo</p>
              <p className="text-xs text-muted-foreground/30 mt-1">Logo follows fabric stretch in motion</p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <p className="text-sm font-medium">Rendering Style</p>
            <div className="flex flex-wrap gap-2">
              {renderStyles.map((r, i) => (
                <button key={r.label} onClick={() => setActiveRender(i)}
                  className={`text-xs px-3.5 py-2 rounded-xl transition-all duration-300 ${
                    activeRender === i
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1]"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 rounded-xl gap-2">
              <Sparkles className="w-4 h-4" /> Auto-Place Logo
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl border-white/[0.08] hover:bg-white/[0.03]">
              Apply to Collection
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LogoPlacement;
