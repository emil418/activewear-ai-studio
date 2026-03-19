import { motion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import { PREDEFINED_ENVIRONMENTS, type Environment } from "@/lib/environments";

interface EnvironmentSelectorProps {
  selected: Environment;
  onSelect: (env: Environment) => void;
}

const EnvironmentSelector = ({ selected, onSelect }: EnvironmentSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PREDEFINED_ENVIRONMENTS.map((env) => {
        const isActive = selected.id === env.id;
        return (
          <button
            key={env.id}
            onClick={() => onSelect(env)}
            className={`relative text-left p-5 rounded-2xl border transition-all duration-300 group ${
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
                <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                  {env.name}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {env.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[env.atmosphere.split(",")[0]].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EnvironmentSelector;
