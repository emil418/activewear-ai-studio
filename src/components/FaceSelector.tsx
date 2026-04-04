import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, RefreshCw, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FaceSelectorProps {
  athleteTraits: {
    gender: string;
    skin_tone: string;
    face_structure: string;
    hair_style: string;
    hair_color: string;
    body_type: string;
    brand_vibe: string;
    appearance_preset?: string;
    face_style?: string;
    age_feel?: string;
    expression_style?: string;
    hair_type?: string;
    hair_length?: string;
  };
  selectedFace: string | null;
  onSelectFace: (url: string) => void;
  locked?: boolean;
}

const FaceSelector = ({ athleteTraits, selectedFace, onSelectFace, locked = false }: FaceSelectorProps) => {
  const [faces, setFaces] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateFaces = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-athlete-face", {
        body: { ...athleteTraits, count: 4 },
      });

      if (error) throw error;
      if (data?.faces?.length) {
        setFaces(data.faces);
      } else {
        toast({ title: "No faces generated", description: "Please try again.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (locked && selectedFace) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Face Identity (Locked)
        </p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/30 flex-shrink-0">
            <img src={selectedFace} alt="Athlete face" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground">
            This face is locked to this athlete's identity and will be used across all generations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Face Identity
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateFaces}
          disabled={generating}
          className="rounded-lg gap-1.5 text-xs h-7"
        >
          {generating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : faces.length > 0 ? (
            <RefreshCw className="w-3 h-3" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {generating ? "Generating..." : faces.length > 0 ? "Regenerate" : "Generate Faces"}
        </Button>
      </div>

      {generating && faces.length === 0 && (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Generating face options based on appearance traits...</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {faces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {faces.map((url, i) => {
              const isSelected = selectedFace === url;
              return (
                <motion.button
                  key={url}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onSelectFace(url)}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-[3/4] ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img src={url} alt={`Face option ${i + 1}`} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[10px] text-white font-medium">
                      {["Confident", "Warm", "Intense", "Relaxed"][i] || `Option ${i + 1}`}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!generating && faces.length === 0 && !selectedFace && (
        <div className="glass-card p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">
            Generate face options based on appearance traits, then select one to lock as the visual identity.
          </p>
        </div>
      )}

      {selectedFace && faces.length === 0 && (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/20 flex-shrink-0">
            <img src={selectedFace} alt="Selected face" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary flex items-center gap-1">
              <Check className="w-3 h-3" /> Face selected
            </p>
            <p className="text-[10px] text-muted-foreground">This face will be locked on save.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceSelector;
