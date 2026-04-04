import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Edit2, Trash2, Check, X, Users, Lock, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import FaceSelector from "@/components/FaceSelector";

const GENDERS = ["Male", "Female", "Non-binary"];
const BODY_TYPES = ["lean", "aesthetic", "muscular", "bulky"];
const SKIN_TONES = ["fair", "light", "medium", "olive", "brown", "dark"];
const FACE_STRUCTURES = ["angular", "soft", "strong jaw", "oval", "square", "diamond"];
const HAIR_STYLES = ["short fade", "buzz cut", "long tied", "braids", "afro", "bald", "medium wavy", "ponytail", "cropped", "bun"];
const HAIR_COLORS = ["black", "dark brown", "brown", "light brown", "blonde", "red", "auburn", "gray", "white"];
const HAIR_TYPES = ["straight", "wavy", "curly", "coily", "kinky"];
const HAIR_LENGTHS = ["short", "medium", "long"];
const BRAND_VIBES = ["hardcore", "minimalist", "aesthetic", "luxury gym"];

const APPEARANCE_PRESETS = ["Nordic / Scandinavian", "East Asian", "South Asian", "Black / African diaspora", "Middle Eastern", "Latin American", "Mixed", "Custom"];
const FACE_STYLES = ["Soft", "Sharp", "Strong", "Athletic", "Editorial", "Rugged", "Clean", "Minimal", "Premium", "Lifestyle"];
const AGE_FEELS = ["young adult", "mature adult", "athletic adult", "editorial adult", "premium commercial model"];
const EXPRESSION_STYLES = ["neutral", "focused", "intense", "calm", "confident", "performance-focused", "editorial neutral"];

interface AthleteProfile {
  id: string;
  brand_id: string;
  name: string;
  gender: string;
  height_cm: number;
  weight_kg: number;
  body_type: string;
  muscle_density: number;
  body_fat_pct: number;
  skin_tone: string;
  face_structure: string;
  hair_style: string;
  hair_color: string;
  brand_vibe: string;
  identity_seed: string | null;
  reference_portrait_url: string | null;
  appearance_preset: string;
  face_style: string;
  age_feel: string;
  expression_style: string;
  hair_type: string;
  hair_length: string;
  created_at: string;
}

const defaultAthlete = {
  name: "",
  gender: "Male",
  height_cm: 175,
  weight_kg: 75,
  body_type: "aesthetic",
  muscle_density: 5,
  body_fat_pct: 15,
  skin_tone: "medium",
  face_structure: "angular",
  hair_style: "short fade",
  hair_color: "black",
  hair_type: "straight",
  hair_length: "short",
  brand_vibe: "aesthetic",
  appearance_preset: "Custom",
  face_style: "Athletic",
  age_feel: "athletic adult",
  expression_style: "neutral",
};

const ChipSelector = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 capitalize ${
            value === o
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
          }`}>{o}</button>
      ))}
    </div>
  </div>
);

const DropdownField = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="premium-input capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const AthleteLibrary = () => {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultAthlete);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user, authReady } = useAuth();
  const { isAdmin } = useAdmin();

  const fetchAthletes = async () => {
    if (!authReady || !user) { setLoading(false); return; }
    setLoading(true);
    const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
    if (!brand) { setLoading(false); return; }
    const { data } = await supabase.from("athlete_profiles").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false });
    setAthletes((data as unknown as AthleteProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { void fetchAthletes(); }, [authReady, user]);

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
      if (!brand) {
        const { data: newBrand } = await supabase.from("brands").insert({ owner_id: user.id, name: "My Brand" }).select("id").single();
        brand = newBrand;
      }
      if (!brand) throw new Error("Could not create brand");
      const seed = `${form.name}-${form.gender}-${form.height_cm}-${form.weight_kg}-${form.body_type}-${form.face_structure}-${form.skin_tone}-${Date.now()}`;
      if (editingId) {
        const updatePayload: Record<string, unknown> = { ...form, identity_seed: seed };
        if (isAdmin && selectedFace) {
          updatePayload.reference_portrait_url = selectedFace;
        }
        await supabase.from("athlete_profiles").update(updatePayload).eq("id", editingId);
        toast({ title: "Athlete updated" });
      } else {
        await supabase.from("athlete_profiles").insert({
          ...form,
          brand_id: brand.id,
          identity_seed: seed,
          reference_portrait_url: selectedFace,
        });
        toast({ title: "Athlete created", description: `${form.name} added to your library.` });
      }
      setShowForm(false); setEditingId(null); setForm(defaultAthlete); setSelectedFace(null); fetchAthletes();
    } catch (err) {
      toast({ title: "Error saving athlete", description: String(err), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = (a: AthleteProfile) => {
    setForm({
      name: a.name, gender: a.gender, height_cm: a.height_cm, weight_kg: a.weight_kg,
      body_type: a.body_type, muscle_density: a.muscle_density, body_fat_pct: a.body_fat_pct,
      skin_tone: a.skin_tone, face_structure: a.face_structure, hair_style: a.hair_style,
      hair_color: a.hair_color || "black", hair_type: a.hair_type || "straight",
      hair_length: a.hair_length || "short", brand_vibe: a.brand_vibe,
      appearance_preset: a.appearance_preset || "Custom", face_style: a.face_style || "Athletic",
      age_feel: a.age_feel || "athletic adult", expression_style: a.expression_style || "neutral",
    });
    setSelectedFace(a.reference_portrait_url || null);
    setEditingId(a.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("athlete_profiles").delete().eq("id", id);
    toast({ title: "Athlete removed" }); fetchAthletes();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Athlete Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Premium digital athletes with locked face identities.</p>
        </div>
        {!showForm && (
          <Button onClick={() => { setForm(defaultAthlete); setEditingId(null); setSelectedFace(null); setShowForm(true); }} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Athlete
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{editingId ? "Edit Athlete" : "Create New Athlete"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setSelectedFace(null); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Step 1: Basic Info */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Athlete Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marcus, Zara, Kai..." className="premium-input" />
            </div>
            <ChipSelector label="Gender" options={GENDERS} value={form.gender} onChange={v => setForm({ ...form, gender: v })} />

            {/* Step 2: Body */}
            <ChipSelector label="Body Type" options={BODY_TYPES} value={form.body_type} onChange={v => setForm({ ...form, body_type: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Height (cm)</Label>
                <div className="flex items-center gap-3">
                  <Slider value={[form.height_cm]} onValueChange={v => setForm({ ...form, height_cm: v[0] })} min={150} max={210} step={1} className="flex-1" />
                  <span className="text-sm font-bold text-primary w-12 text-right">{form.height_cm}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Weight (kg)</Label>
                <div className="flex items-center gap-3">
                  <Slider value={[form.weight_kg]} onValueChange={v => setForm({ ...form, weight_kg: v[0] })} min={45} max={140} step={1} className="flex-1" />
                  <span className="text-sm font-bold text-primary w-12 text-right">{form.weight_kg}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Muscle Density</Label>
                  <span className="text-sm font-bold text-primary">{form.muscle_density}/10</span>
                </div>
                <Slider value={[form.muscle_density]} onValueChange={v => setForm({ ...form, muscle_density: v[0] })} min={1} max={10} step={1} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Body Fat %</Label>
                  <span className="text-sm font-bold text-primary">{form.body_fat_pct}%</span>
                </div>
                <Slider value={[form.body_fat_pct]} onValueChange={v => setForm({ ...form, body_fat_pct: v[0] })} min={5} max={35} step={1} />
              </div>
            </div>

            {/* Step 3: Appearance Identity */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Appearance Identity</p>
              <div className="grid grid-cols-2 gap-4">
                <DropdownField label="Appearance Preset" options={APPEARANCE_PRESETS} value={form.appearance_preset} onChange={v => setForm({ ...form, appearance_preset: v })} />
                <DropdownField label="Face Style" options={FACE_STYLES} value={form.face_style} onChange={v => setForm({ ...form, face_style: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DropdownField label="Age Feel" options={AGE_FEELS} value={form.age_feel} onChange={v => setForm({ ...form, age_feel: v })} />
                <DropdownField label="Expression Style" options={EXPRESSION_STYLES} value={form.expression_style} onChange={v => setForm({ ...form, expression_style: v })} />
              </div>
              <ChipSelector label="Skin Tone" options={SKIN_TONES} value={form.skin_tone} onChange={v => setForm({ ...form, skin_tone: v })} />
              <ChipSelector label="Face Structure" options={FACE_STRUCTURES} value={form.face_structure} onChange={v => setForm({ ...form, face_structure: v })} />
            </div>

            {/* Step 4: Hair */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Hair Identity</p>
              <div className="grid grid-cols-3 gap-4">
                <DropdownField label="Hair Type" options={HAIR_TYPES} value={form.hair_type} onChange={v => setForm({ ...form, hair_type: v })} />
                <DropdownField label="Hair Length" options={HAIR_LENGTHS} value={form.hair_length} onChange={v => setForm({ ...form, hair_length: v })} />
                <DropdownField label="Hair Color" options={HAIR_COLORS} value={form.hair_color} onChange={v => setForm({ ...form, hair_color: v })} />
              </div>
              <ChipSelector label="Hair Style" options={HAIR_STYLES} value={form.hair_style} onChange={v => setForm({ ...form, hair_style: v })} />
            </div>

            <ChipSelector label="Brand Vibe" options={BRAND_VIBES} value={form.brand_vibe} onChange={v => setForm({ ...form, brand_vibe: v })} />

            {/* Face Generation */}
            <div className="border-t border-border pt-5">
              <FaceSelector
                athleteTraits={{
                  gender: form.gender,
                  skin_tone: form.skin_tone,
                  face_structure: form.face_structure,
                  hair_style: form.hair_style,
                  hair_color: form.hair_color,
                  body_type: form.body_type,
                  brand_vibe: form.brand_vibe,
                  appearance_preset: form.appearance_preset,
                  face_style: form.face_style,
                  age_feel: form.age_feel,
                  expression_style: form.expression_style,
                  hair_type: form.hair_type,
                  hair_length: form.hair_length,
                }}
                selectedFace={selectedFace}
                onSelectFace={setSelectedFace}
                locked={!!editingId && !isAdmin}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 flex-1">
                {saving ? <span className="animate-spin">⏳</span> : <Check className="w-4 h-4" />}
                {editingId ? "Update Athlete" : "Create Athlete"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setSelectedFace(null); }} className="rounded-xl">Cancel</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loading ? (
              <div className="glass-card p-12 flex items-center justify-center text-muted-foreground">Loading athletes...</div>
            ) : athletes.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center">
                  <User className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">No athletes yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first premium digital athlete.</p>
                </div>
                <Button onClick={() => { setForm(defaultAthlete); setSelectedFace(null); setShowForm(true); }} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Create First Athlete
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {athletes.map(a => (
                  <motion.div key={a.id} layout className="glass-card-hover p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      {a.reference_portrait_url ? (
                        <div className="w-16 h-20 rounded-xl flex-shrink-0 overflow-hidden border border-primary/10">
                          <img src={a.reference_portrait_url} alt={a.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-xl flex-shrink-0 flex items-center justify-center bg-muted border border-border">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-display font-bold text-sm truncate">{a.name}</p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{a.gender} · {a.body_type} · {a.age_feel || "adult"}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {a.reference_portrait_url && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium">
                              <Lock className="w-2.5 h-2.5" /> Face locked
                            </span>
                          )}
                          {a.identity_seed && !a.reference_portrait_url && (
                            <span className="text-[10px] text-primary/40">ID locked</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{a.height_cm}cm · {a.weight_kg}kg</span>
                      <span>BF {a.body_fat_pct}%</span>
                      <span className="capitalize">Skin: {a.skin_tone}</span>
                      <span>Muscle: {a.muscle_density}/10</span>
                      <span className="capitalize">Face: {a.face_style || a.face_structure}</span>
                      <span className="capitalize">Hair: {a.hair_style}</span>
                      <span className="capitalize">Color: {a.hair_color || "black"}</span>
                      <span className="capitalize">Expr: {a.expression_style || "neutral"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="feature-badge">{a.brand_vibe}</span>
                      {a.appearance_preset && a.appearance_preset !== "Custom" && (
                        <span className="feature-badge">{a.appearance_preset}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AthleteLibrary;
