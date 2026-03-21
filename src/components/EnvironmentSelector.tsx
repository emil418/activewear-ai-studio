import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  PREDEFINED_ENVIRONMENTS,
  PACK_META,
  type Environment,
  type EnvironmentPack,
} from "@/lib/environments";

interface EnvironmentSelectorProps {
  selected: Environment;
  onSelect: (env: Environment) => void;
}

const PACKS: EnvironmentPack[] = ["strength", "calisthenics", "field-sports", "lifestyle"];

const EnvironmentSelector = ({ selected, onSelect }: EnvironmentSelectorProps) => {
  const [activePack, setActivePack] = useState<EnvironmentPack | "all">("all");

  const filtered =
    activePack === "all"
      ? PREDEFINED_ENVIRONMENTS
      : PREDEFINED_ENVIRONMENTS.filter((e) => e.pack === activePack);

  return (
    <div className="space-y-4">
      {/* Pack filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActivePack("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            activePack === "all"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-muted/40 border-border text-muted-foreground hover:border-primary/20"
          }`}
        >
          All
        </button>
        {PACKS.map((p) => {
          const meta = PACK_META[p];
          return (
            <button
              key={p}
              onClick={() => setActivePack(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activePack === p
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted/40 border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Environment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((env) => {
          const isActive = selected.id === env.id;
          const packMeta = PACK_META[env.pack];
          return (
            <button
              key={env.id}
              onClick={() => onSelect(env)}
              className={`relative text-left p-4 rounded-2xl border transition-all duration-300 group ${
                isActive
                  ? "bg-primary/[0.08] border-primary/30 shadow-sm"
                  : "bg-muted/30 border-border hover:border-primary/20 hover:bg-muted/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="env-indicator"
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary" />
                </motion.div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{env.thumbnail}</span>
                <div className="space-y-1.5 min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                    {env.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {env.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                      {packMeta.emoji} {packMeta.label}
                    </span>
                    {env.sport.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnvironmentSelector;
