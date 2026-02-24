import { motion } from "framer-motion";
import { LucideIcon, Upload, Image, Zap, RotateCcw, Activity, ChevronDown, Leaf, GitCompare, Lightbulb, Search, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
  { label: "Strength", movements: ["Push-ups", "Squats", "Deadlifts", "Bench Press", "Lunges", "Pull-ups", "Overhead Press", "Rows"] },
  { label: "Cardio", movements: ["Sprint", "High Knees", "Burpees", "Jump Rope", "Mountain Climbers", "Box Jumps", "Cycling", "Rowing"] },
  { label: "Yoga & Flexibility", movements: ["Warrior Pose", "Downward Dog", "Tree Pose", "Cobra", "Pigeon", "Sun Salutation", "Chair Pose", "Plank"] },
  { label: "HIIT", movements: ["Squat Jumps", "Plank Jacks", "Tuck Jumps", "Skaters", "Battle Ropes", "Thrusters", "Kettlebell Swings", "Sled Push"] },
];

const outputFormats = [
  { id: "single", label: "Single Video", icon: "🎬" },
  { id: "multi-angle", label: "Multi-Angle Grid", icon: "📐" },
  { id: "360", label: "360° Spin", icon: "🔄" },
  { id: "ar-vr", label: "AR/VR Export (GLB)", icon: "🥽" },
  { id: "pdf", label: "PDF Tech Pack", icon: "📄" },
];

const viewAngles = ["Front", "Left 45°", "Side Left", "Back", "Side Right", "Right 45°", "Overhead", "Low Angle"];

const athletePresets = [
  { label: "Elite Runner", build: "Lean, long limbs" },
  { label: "Bodybuilder", build: "High muscle mass" },
  { label: "Yogi", build: "Flexible, toned" },
  { label: "CrossFit", build: "Athletic, balanced" },
  { label: "Adaptive", build: "Prosthesis options" },
  { label: "Plus-Size Athlete", build: "Inclusive sizing" },
];

const ModulePage = ({ icon: Icon, title, subtitle, description, promptPlaceholder, features, showGarmentUpload }: ModulePageProps) => {
  const [prompt, setPrompt] = useState("");
  const [physicsMode, setPhysicsMode] = useState(true);
  const [multiView, setMultiView] = useState(false);
  const [ecoMode, setEcoMode] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("single");
  const [showMovements, setShowMovements] = useState(false);
  const [selectedAngles, setSelectedAngles] = useState<string[]>(["Front", "Back", "Side Left", "Side Right"]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [intensity, setIntensity] = useState([50]);
  const [sweatLevel, setSweatLevel] = useState([60]);
  const [movementSearch, setMovementSearch] = useState("");
  const [showAthleteBuilder, setShowAthleteBuilder] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const toggleAngle = (angle: string) => {
    setSelectedAngles(prev =>
      prev.includes(angle) ? prev.filter(a => a !== angle) : [...prev, angle]
    );
  };

  const filteredCategories = movementCategories.map(cat => ({
    ...cat,
    movements: cat.movements.filter(m => m.toLowerCase().includes(movementSearch.toLowerCase()))
  })).filter(cat => cat.movements.length > 0);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-5">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}>
          <div className="upload-zone group">
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-all duration-500">
              <Upload className="w-7 h-7 text-primary/60" />
            </div>
            <p className="font-display text-base font-bold mb-1 uppercase tracking-wide">Drop your gear here</p>
            <p className="text-xs text-muted-foreground mb-1">Product photos, tech flats, sketches — PNG, JPG, PSD, SVG</p>
            <p className="text-[10px] text-muted-foreground/60 mb-5">Or upload ZIP/CSV for batch processing</p>
            <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03] font-semibold">
              Choose File
            </Button>
          </div>
        </motion.div>
      )}

      {/* Athlete Builder */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.5 }}>
        <div className="glass-card p-5">
          <button onClick={() => setShowAthleteBuilder(!showAthleteBuilder)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/[0.08] flex items-center justify-center">
                <Gauge className="w-4 h-4 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{selectedPreset || "Athlete Builder"}</p>
                <p className="text-[11px] text-muted-foreground">Sport presets • XS–XXL • Fitness metrics • Inclusive</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showAthleteBuilder ? "rotate-180" : ""}`} />
          </button>
          {showAthleteBuilder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {athletePresets.map(p => (
                  <button key={p.label} onClick={() => setSelectedPreset(p.label)}
                    className={`text-xs px-3 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      selectedPreset === p.label
                        ? "bg-secondary/15 text-secondary border border-secondary/20"
                        : "bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:border-white/[0.08]"
                    }`}>
                    <span className="block">{p.label}</span>
                    <span className="block text-[9px] opacity-60 mt-0.5">{p.build}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Size</p>
                  <div className="flex gap-1">
                    {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                      <button key={s} className="text-[10px] px-2 py-1 rounded bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:border-white/[0.08] font-semibold">{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Gender</p>
                  <div className="flex gap-1">
                    {["Male", "Female", "Non-binary"].map(g => (
                      <button key={g} className="text-[10px] px-2.5 py-1 rounded bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:border-white/[0.08] font-semibold">{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Physics & View Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary/80" />
              </div>
              <div>
                <p className="text-sm font-semibold">Physics Mode</p>
                <p className="text-[11px] text-muted-foreground">Stretch, compression, sweat</p>
              </div>
            </div>
            <Switch checked={physicsMode} onCheckedChange={setPhysicsMode} />
          </div>
          {physicsMode && (
            <div className="flex flex-wrap gap-1.5">
              {["Stretch Map", "Compression", "Sweat Sim", "Wind", "Breathability"].map(f => (
                <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-primary/80 font-semibold uppercase tracking-wider">{f}</span>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/[0.08] flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Multi-View / 360°</p>
                <p className="text-[11px] text-muted-foreground">4–8 angles, spin</p>
              </div>
            </div>
            <Switch checked={multiView} onCheckedChange={setMultiView} />
          </div>
          {multiView && (
            <div className="flex flex-wrap gap-1">
              {viewAngles.map(angle => (
                <button key={angle} onClick={() => toggleAngle(angle)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-300 ${
                    selectedAngles.includes(angle)
                      ? "bg-secondary/15 text-secondary border border-secondary/20"
                      : "bg-white/[0.03] text-muted-foreground border border-white/[0.04]"
                  }`}>{angle}</button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/[0.08] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Eco Simulator</p>
                <p className="text-[11px] text-muted-foreground">Sustainable materials</p>
              </div>
            </div>
            <Switch checked={ecoMode} onCheckedChange={setEcoMode} />
          </div>
          {ecoMode && (
            <div className="flex flex-wrap gap-1.5">
              {["Recycled Poly", "Organic Cotton", "Eco Badge", "Durability"].map(f => (
                <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/[0.06] text-green-400/80 font-semibold uppercase tracking-wider">{f}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Performance Movement Library */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11, duration: 0.5 }}>
        <div className="glass-card p-5">
          <button onClick={() => setShowMovements(!showMovements)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/[0.06] flex items-center justify-center">
                <Zap className="w-4 h-4 text-destructive/80" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{selectedMovement || "Performance Movement Library"}</p>
                <p className="text-[11px] text-muted-foreground">500+ training movements • Search & intensity control</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showMovements ? "rotate-180" : ""}`} />
          </button>

          {showMovements && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input value={movementSearch} onChange={e => setMovementSearch(e.target.value)}
                  placeholder="Search movements..." className="premium-input pl-9 text-sm h-9" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Intensity / Pace</p>
                  <Slider value={intensity} onValueChange={setIntensity} max={100} step={1} className="w-full" />
                  <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
                    <span>Low / Slow</span><span>High / Fast</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sweat Level</p>
                  <Slider value={sweatLevel} onValueChange={setSweatLevel} max={100} step={1} className="w-full" />
                  <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
                    <span>Dry</span><span>Intense</span>
                  </div>
                </div>
              </div>

              {filteredCategories.map(cat => (
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

      {/* Output Format + A/B Testing */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.5 }}
        className="flex gap-2 flex-wrap items-center">
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
        <button onClick={() => setShowAISuggestions(!showAISuggestions)}
          className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ml-auto ${
            showAISuggestions ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "glass-card hover:border-white/[0.08] text-muted-foreground"
          }`}>
          <GitCompare className="w-3.5 h-3.5" /> A/B Test
        </button>
      </motion.div>

      {/* Prompt & Generate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-card p-7 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptPlaceholder}
          className="min-h-[100px] premium-input resize-none text-sm"
        />

        {/* Tech-spec inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Compression Rating</p>
            <Input placeholder="e.g. High – 85%" className="premium-input text-xs h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Material Type</p>
            <Input placeholder="e.g. 78% Nylon 22% Spandex" className="premium-input text-xs h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Stretch Factor</p>
            <Input placeholder="e.g. 4× four-way" className="premium-input text-xs h-8" />
          </div>
        </div>

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
          {multiView && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/[0.08] text-secondary/70 font-semibold">🔄 {selectedAngles.length} angles</span>}
          {ecoMode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/[0.06] text-green-400/70 font-semibold">🌱 Eco ON</span>}
          {selectedMovement && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/[0.06] text-destructive/70 font-semibold">🏋️ {selectedMovement}</span>}
          {selectedPreset && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/[0.06] text-secondary/70 font-semibold">👤 {selectedPreset}</span>}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground font-semibold">📦 {outputFormats.find(f => f.id === selectedOutput)?.label}</span>
          {showAISuggestions && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/[0.06] text-amber-400/70 font-semibold">🔀 A/B Testing</span>}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground font-semibold">💧 Sweat: {sweatLevel[0]}%</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground font-semibold">🔥 Intensity: {intensity[0]}%</span>
        </div>
      </motion.div>

      {/* AI Optimization Suggestions (shown after "generate") */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18, duration: 0.5 }}
        className="glass-card p-5 border-l-2 border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400/70" />
          <p className="text-sm font-semibold">AI Optimization Suggestions</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">💡 Increase thigh compression for better squat performance visualization</p>
          <p className="text-xs text-muted-foreground leading-relaxed">💡 Add sweat effect at intensity 75%+ for authentic HIIT content</p>
          <p className="text-xs text-muted-foreground leading-relaxed">💡 Enable multi-angle to show back compression zones during deadlifts</p>
        </div>
      </motion.div>

      {/* Preview Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
        className={`grid gap-4 ${multiView ? "grid-cols-2 md:grid-cols-4" : showAISuggestions ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3"}`}>
        {Array.from({ length: multiView ? 8 : showAISuggestions ? 3 : 3 }).map((_, i) => (
          <div key={i} className="glass-card aspect-square rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden">
            {multiView && (
              <span className="absolute top-2 left-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                {viewAngles[i] || `Angle ${i + 1}`}
              </span>
            )}
            {showAISuggestions && !multiView && (
              <span className="absolute top-2 left-2 text-[9px] font-bold text-amber-400/40 uppercase tracking-wider">
                Variant {String.fromCharCode(65 + i)}
              </span>
            )}
            <Image className="w-8 h-8 text-muted-foreground/15 group-hover:text-muted-foreground/30 transition-colors duration-500" />
            {physicsMode && (
              <div className="absolute bottom-2 right-2 flex flex-col items-end gap-0.5">
                <span className="text-[7px] text-primary/30 font-bold">COMPRESSION: HIGH</span>
                <span className="text-[7px] text-secondary/30 font-bold">STRETCH: 4×</span>
              </div>
            )}
            {showAISuggestions && !multiView && (
              <span className="absolute bottom-2 left-2 text-[8px] text-amber-400/30 font-bold">Return risk: {["Low", "Medium", "Low"][i]}</span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ModulePage;
