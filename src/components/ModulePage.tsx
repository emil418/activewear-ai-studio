import { motion } from "framer-motion";
import { LucideIcon, Upload, Image, Zap, RotateCcw, Grid3X3, Activity, Eye, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

const movementCategories = [
  { label: "Strength", movements: ["Push-ups", "Squats", "Deadlifts", "Bench Press", "Lunges", "Pull-ups"] },
  { label: "Cardio", movements: ["Sprint", "High Knees", "Burpees", "Jump Rope", "Mountain Climbers", "Box Jumps"] },
  { label: "Yoga & Flex", movements: ["Warrior Pose", "Downward Dog", "Tree Pose", "Cobra", "Pigeon", "Sun Salutation"] },
  { label: "HIIT", movements: ["Squat Jumps", "Plank Jacks", "Tuck Jumps", "Skaters", "Battle Ropes", "Thrusters"] },
];

const outputFormats = [
  { id: "single", label: "Single Video", icon: "🎬" },
  { id: "multi-angle", label: "Multi-Angle Grid", icon: "📐" },
  { id: "360", label: "360° Spin", icon: "🔄" },
  { id: "pdf", label: "PDF Tech Pack", icon: "📄" },
];

const viewAngles = ["Front", "Left 45°", "Side Left", "Back", "Side Right", "Right 45°", "Overhead", "Low Angle"];

const ModulePage = ({ icon: Icon, title, subtitle, description, promptPlaceholder, features, showGarmentUpload }: ModulePageProps) => {
  const [prompt, setPrompt] = useState("");
  const [physicsMode, setPhysicsMode] = useState(true);
  const [multiView, setMultiView] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("single");
  const [showMovements, setShowMovements] = useState(false);
  const [selectedAngles, setSelectedAngles] = useState<string[]>(["Front", "Back", "Side Left", "Side Right"]);

  const toggleAngle = (angle: string) => {
    setSelectedAngles(prev =>
      prev.includes(angle) ? prev.filter(a => a !== angle) : [...prev, angle]
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5 }}>
          <div className="upload-zone group">
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-all duration-500">
              <Upload className="w-7 h-7 text-primary/60" />
            </div>
            <p className="font-display text-base font-bold mb-1 uppercase tracking-wide">Drop your product here</p>
            <p className="text-xs text-muted-foreground mb-5">Product photos, tech flats, sketches — PNG, JPG, PSD, SVG</p>
            <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03] font-semibold">
              Choose File
            </Button>
          </div>
        </motion.div>
      )}

      {/* Physics & View Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Physics Mode Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary/80" />
              </div>
              <div>
                <p className="text-sm font-semibold">Physics Mode</p>
                <p className="text-[11px] text-muted-foreground">Fabric stretch, compression, sweat</p>
              </div>
            </div>
            <Switch checked={physicsMode} onCheckedChange={setPhysicsMode} />
          </div>
          {physicsMode && (
            <div className="flex flex-wrap gap-1.5">
              {["Stretch Map", "Compression Zones", "Sweat Sim", "Wind Effects", "Breathability"].map(f => (
                <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/[0.06] text-primary/80 font-semibold uppercase tracking-wider">{f}</span>
              ))}
            </div>
          )}
        </div>

        {/* Multi-View Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/[0.08] flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Multi-View / 360°</p>
                <p className="text-[11px] text-muted-foreground">4–8 angles, interactive spin</p>
              </div>
            </div>
            <Switch checked={multiView} onCheckedChange={setMultiView} />
          </div>
          {multiView && (
            <div className="flex flex-wrap gap-1.5">
              {viewAngles.map(angle => (
                <button key={angle} onClick={() => toggleAngle(angle)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider transition-all duration-300 ${
                    selectedAngles.includes(angle) 
                      ? "bg-secondary/15 text-secondary border border-secondary/20" 
                      : "bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:border-white/[0.08]"
                  }`}>{angle}</button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Movement Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}>
        <div className="glass-card p-5">
          <button onClick={() => setShowMovements(!showMovements)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/[0.06] flex items-center justify-center">
                <Zap className="w-4 h-4 text-destructive/80" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{selectedMovement || "Select Movement"}</p>
                <p className="text-[11px] text-muted-foreground">500+ sport movements • Strength, Cardio, Yoga, HIIT</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showMovements ? "rotate-180" : ""}`} />
          </button>

          {showMovements && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-4">
              {movementCategories.map(cat => (
                <div key={cat.label}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.movements.map(m => (
                      <button key={m} onClick={() => { setSelectedMovement(m); setShowMovements(false); }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 ${
                          selectedMovement === m
                            ? "bg-primary/15 text-primary border border-primary/20"
                            : "bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:border-white/[0.08] hover:text-foreground"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Output Format Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5 }}
        className="flex gap-2 flex-wrap">
        {outputFormats.map(f => (
          <button key={f.id} onClick={() => setSelectedOutput(f.id)}
            className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              selectedOutput === f.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "glass-card hover:border-white/[0.08] text-muted-foreground"
            }`}>
            <span>{f.icon}</span> {f.label}
          </button>
        ))}
      </motion.div>

      {/* Prompt & Generate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }}
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
          <Button disabled={!prompt.trim()} className="gap-2 rounded-xl px-6 font-bold">
            <Zap className="w-4 h-4" /> Generate
          </Button>
        </div>

        {/* Active config summary */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
          {physicsMode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-primary/70 font-semibold">⚡ Physics ON</span>}
          {multiView && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/[0.08] text-secondary/70 font-semibold">🔄 Multi-View ({selectedAngles.length} angles)</span>}
          {selectedMovement && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/[0.06] text-destructive/70 font-semibold">🏋️ {selectedMovement}</span>}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground font-semibold">📦 {outputFormats.find(f => f.id === selectedOutput)?.label}</span>
        </div>
      </motion.div>

      {/* Preview Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
        className={`grid gap-4 ${multiView ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
        {Array.from({ length: multiView ? 8 : 3 }).map((_, i) => (
          <div key={i} className="glass-card aspect-square rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden">
            {multiView && (
              <span className="absolute top-2 left-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                {viewAngles[i] || `Angle ${i + 1}`}
              </span>
            )}
            <Image className="w-8 h-8 text-muted-foreground/15 group-hover:text-muted-foreground/30 transition-colors duration-500" />
            {physicsMode && (
              <span className="absolute bottom-2 right-2 text-[8px] text-primary/30 font-bold">PHYSICS</span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ModulePage;
