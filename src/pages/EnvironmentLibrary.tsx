import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Check, Sun, Zap, Trees, Dumbbell } from "lucide-react";

const ENVIRONMENT_PACKS = [
  {
    pack: "Strength",
    icon: Dumbbell,
    environments: [
      { id: "dark-performance-gym", name: "Dark Performance Gym", floor: "Black rubber", lighting: "Dramatic overhead spots", atmosphere: "Moody, high contrast", tone: "Dark" },
      { id: "minimal-black", name: "Minimal Black Studio", floor: "Matte black", lighting: "Even soft light", atmosphere: "Clean, editorial", tone: "Neutral" },
      { id: "industrial", name: "Industrial Gym", floor: "Concrete", lighting: "Warm overhead", atmosphere: "Raw, gritty", tone: "Warm" },
    ],
  },
  {
    pack: "Calisthenics",
    icon: Trees,
    environments: [
      { id: "park", name: "Outdoor Park", floor: "Grass / gravel", lighting: "Natural daylight", atmosphere: "Fresh, open", tone: "Natural" },
      { id: "urban", name: "Urban Calisthenics", floor: "Concrete", lighting: "Overcast diffuse", atmosphere: "Street, raw", tone: "Cool" },
      { id: "minimal-outdoor", name: "Minimal Outdoor", floor: "Sand / light ground", lighting: "Golden hour", atmosphere: "Warm, minimal", tone: "Warm" },
    ],
  },
  {
    pack: "Field Sports",
    icon: Zap,
    environments: [
      { id: "football-field", name: "Football Field", floor: "Natural grass", lighting: "Stadium lights", atmosphere: "Professional", tone: "Neutral" },
      { id: "track-field", name: "Track & Field", floor: "Synthetic track", lighting: "Bright daylight", atmosphere: "Athletic", tone: "Bright" },
      { id: "athletic-surface", name: "Athletic Surface", floor: "Turf", lighting: "Even stadium", atmosphere: "Competition", tone: "Neutral" },
    ],
  },
  {
    pack: "Lifestyle",
    icon: Sun,
    environments: [
      { id: "bright-studio", name: "Bright Studio", floor: "White / light wood", lighting: "Soft even studio", atmosphere: "Clean, premium", tone: "Bright" },
      { id: "lifestyle-outdoor", name: "Lifestyle Outdoor", floor: "Path / road", lighting: "Morning light", atmosphere: "Aspirational", tone: "Warm" },
      { id: "beach", name: "Beach", floor: "Sand", lighting: "Natural sun", atmosphere: "Open, fresh", tone: "Warm" },
    ],
  },
];

const EnvironmentLibrary = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" /> Environment Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Locked production environments for consistent, professional outputs across all views and videos.
        </p>
      </motion.div>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex items-center gap-3">
          <Check className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Active environment: <span className="text-primary font-bold">{ENVIRONMENT_PACKS.flatMap(p => p.environments).find(e => e.id === selected)?.name}</span></span>
        </motion.div>
      )}

      <div className="space-y-10">
        {ENVIRONMENT_PACKS.map((pack, pi) => (
          <motion.div key={pack.pack} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.08, duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-4">
              <pack.icon className="w-4 h-4 text-primary/60" />
              <h2 className="font-display text-base font-bold tracking-tight uppercase text-muted-foreground">{pack.pack} Pack</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pack.environments.map(env => {
                const isActive = selected === env.id;
                return (
                  <button key={env.id} onClick={() => setSelected(env.id)}
                    className={`glass-card-hover p-5 text-left space-y-3 relative transition-all duration-300 ${
                      isActive ? "border-primary/30 glow-border" : ""
                    }`}>
                    {isActive && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <p className="font-display text-sm font-bold">{env.name}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p><span className="text-foreground/50">Floor:</span> {env.floor}</p>
                      <p><span className="text-foreground/50">Lighting:</span> {env.lighting}</p>
                      <p><span className="text-foreground/50">Atmosphere:</span> {env.atmosphere}</p>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      env.tone === "Dark" ? "bg-muted text-muted-foreground" :
                      env.tone === "Warm" ? "bg-orange-500/10 text-orange-400" :
                      env.tone === "Cool" ? "bg-blue-500/10 text-blue-400" :
                      env.tone === "Bright" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{env.tone}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentLibrary;
