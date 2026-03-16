import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Trash2, Edit2, Lock, Unlock, Save, X, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MOVEMENTS = [
  "Squats", "Push-ups", "Deadlifts", "Lunges", "Pull-ups", "Bench Press",
  "Sprint", "Burpees", "High Knees", "Jump Rope", "Box Jumps",
  "Squat Jumps", "Battle Ropes", "Kettlebell Swings",
  "Running", "Jumping",
];

const OUTPUT_TYPES = [
  { id: "campaign", label: "Campaign Pack" },
  { id: "instagram", label: "Instagram" },
  { id: "reels", label: "Reels" },
  { id: "ecommerce", label: "E-Commerce" },
] as const;

const ANGLES = ["front", "side", "back"] as const;

interface Athlete {
  id: string;
  name: string;
  body_type: string;
  gender: string;
}

interface BrandKitRef {
  id: string;
  vibe: string;
  primary_color: string;
}

interface Template {
  id: string;
  brand_id: string;
  template_name: string;
  athlete_id: string | null;
  movement_set: string[];
  phase_set: string[];
  intensity: number;
  camera_presets: string[];
  brand_kit_id: string | null;
  output_type: string;
  influencer_locked: boolean;
}

const Templates = () => {
  const { user, authReady } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKitRef[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!authReady) return;
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);

      const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
      if (!mounted) return;
      if (!brand) {
        setLoading(false);
        return;
      }
      setBrandId(brand.id);

      const [templatesRes, athletesRes, kitsRes] = await Promise.all([
        supabase.from("templates").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false }),
        supabase.from("athlete_profiles").select("id, name, body_type, gender").eq("brand_id", brand.id),
        supabase.from("brand_kits").select("id, vibe, primary_color").eq("brand_id", brand.id),
      ]);

      if (!mounted) return;
      setTemplates((templatesRes.data as unknown as Template[]) || []);
      setAthletes((athletesRes.data as unknown as Athlete[]) || []);
      setBrandKits((kitsRes.data as unknown as BrandKitRef[]) || []);
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [authReady, user]);

  const createNew = () => {
    if (!brandId) return;
    setIsNew(true);
    setEditing({
      id: "",
      brand_id: brandId,
      template_name: "",
      athlete_id: null,
      movement_set: [],
      phase_set: [],
      intensity: 50,
      camera_presets: ["front", "side", "back"],
      brand_kit_id: brandKits[0]?.id || null,
      output_type: "campaign",
      influencer_locked: false,
    });
  };

  const handleSave = async () => {
    if (!editing || !brandId) return;
    if (!editing.template_name.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        brand_id: brandId,
        template_name: editing.template_name,
        athlete_id: editing.athlete_id || null,
        movement_set: editing.movement_set,
        phase_set: editing.phase_set,
        intensity: editing.intensity,
        camera_presets: editing.camera_presets,
        brand_kit_id: editing.brand_kit_id || null,
        output_type: editing.output_type,
        influencer_locked: editing.influencer_locked,
      };

      if (isNew) {
        const { data, error } = await supabase.from("templates").insert(payload as any).select("*").single();
        if (error) throw error;
        setTemplates(prev => [data as unknown as Template, ...prev]);
      } else {
        const { error } = await supabase.from("templates").update(payload as any).eq("id", editing.id);
        if (error) throw error;
        setTemplates(prev => prev.map(t => t.id === editing.id ? { ...t, ...payload } : t));
      }

      toast({ title: isNew ? "Template created" : "Template updated" });
      setEditing(null);
      setIsNew(false);
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: "Template deleted" });
  };

  const toggleMovement = (m: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      movement_set: editing.movement_set.includes(m)
        ? editing.movement_set.filter(x => x !== m)
        : [...editing.movement_set, m],
    });
  };

  const toggleAngle = (a: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      camera_presets: editing.camera_presets.includes(a)
        ? editing.camera_presets.filter(x => x !== a)
        : [...editing.camera_presets, a],
    });
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Templates</h1>
          <p className="text-sm text-muted-foreground">Pre-built campaign structures for repeatable, brand-controlled generation.</p>
        </div>
        <Button onClick={createNew} className="gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </motion.div>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass-card p-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{isNew ? "Create Template" : "Edit Template"}</h2>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Template Name</Label>
              <Input value={editing.template_name} onChange={e => setEditing({ ...editing, template_name: e.target.value })}
                placeholder='e.g. "HIIT Pack", "New Drop Campaign"' className="premium-input max-w-sm" />
            </div>

            {/* Athlete */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Athlete</Label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing({ ...editing, athlete_id: null })}
                  className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    !editing.athlete_id ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                  }`}>None</button>
                {athletes.map(a => (
                  <button key={a.id} onClick={() => setEditing({ ...editing, athlete_id: a.id })}
                    className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                      editing.athlete_id === a.id ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>
                    <Users className="w-3 h-3" /> {a.name}
                    <span className="text-[10px] opacity-60 capitalize">{a.body_type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Movements */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Movements ({editing.movement_set.length} selected)
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOVEMENTS.map(m => (
                  <button key={m} onClick={() => toggleMovement(m)}
                    className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      editing.movement_set.includes(m)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Intensity</Label>
                <span className="text-sm font-bold text-primary">{editing.intensity}%</span>
              </div>
              <Slider value={[editing.intensity]} onValueChange={v => setEditing({ ...editing, intensity: v[0] })} max={100} step={1} />
            </div>

            {/* Camera Angles */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Camera Angles</Label>
              <div className="flex gap-2">
                {ANGLES.map(a => (
                  <button key={a} onClick={() => toggleAngle(a)}
                    className={`text-sm px-5 py-2.5 rounded-xl font-semibold capitalize transition-all duration-300 ${
                      editing.camera_presets.includes(a)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>{a}</button>
                ))}
              </div>
            </div>

            {/* Output Type */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Output Type</Label>
              <div className="flex gap-2">
                {OUTPUT_TYPES.map(o => (
                  <button key={o.id} onClick={() => setEditing({ ...editing, output_type: o.id })}
                    className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      editing.output_type === o.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>{o.label}</button>
                ))}
              </div>
            </div>

            {/* Brand Kit */}
            {brandKits.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Brand Kit</Label>
                <div className="flex gap-2">
                  {brandKits.map(k => (
                    <button key={k.id} onClick={() => setEditing({ ...editing, brand_kit_id: k.id })}
                      className={`text-sm px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                        editing.brand_kit_id === k.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                      }`}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.primary_color }} />
                      {k.vibe}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Influencer Lock */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                {editing.influencer_locked ? <Lock className="w-4 h-4 text-secondary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-bold">Influencer Locked</p>
                  <p className="text-xs text-muted-foreground">Influencers can only generate using this template — no edits allowed.</p>
                </div>
              </div>
              <Switch checked={editing.influencer_locked} onCheckedChange={v => setEditing({ ...editing, influencer_locked: v })} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl font-bold px-8 glow-border">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : isNew ? "Create Template" : "Save Changes"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template List */}
      {templates.length === 0 && !editing ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <FileText className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="font-display text-lg font-bold mb-1">No templates yet</p>
          <p className="text-sm text-muted-foreground mb-6">Create templates to build repeatable, brand-controlled campaign structures.</p>
          <Button onClick={createNew} className="gap-2 rounded-xl font-bold">
            <Plus className="w-4 h-4" /> Create First Template
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {templates.map((t, i) => {
            const athlete = athletes.find(a => a.id === t.athlete_id);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex items-center justify-between group hover:border-primary/10 transition-all duration-300">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/[0.06] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary/60" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{t.template_name}</p>
                      {t.influencer_locked && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.movement_set.length} movements · {t.camera_presets.length} angles · {t.intensity}% intensity
                      {athlete && ` · ${athlete.name}`}
                      {` · ${t.output_type}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(t); setIsNew(false); }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Templates;
