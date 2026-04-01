import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shirt, Upload, Trash2, X, Check, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const GARMENT_TYPES = ["Compression T-Shirt", "Tank Top", "Sports Bra", "Hoodie", "Shorts", "Leggings", "Joggers", "Jacket"];
const FABRIC_TYPES = ["Polyester", "Nylon", "Spandex Blend", "Cotton Blend", "Mesh", "Compression Fabric"];

interface Garment {
  id: string;
  name: string;
  type: string;
  fabric: string;
  color: string;
  image_url: string | null;
  brand_id: string;
  created_at: string;
}

const GarmentLibrary = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", type: GARMENT_TYPES[0], fabric: FABRIC_TYPES[0], color: "#000000" });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, authReady } = useAuth();

  const fetchGarments = async () => {
    if (!authReady || !user) { setLoading(false); return; }
    setLoading(true);
    const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
    if (!brand) { setLoading(false); return; }

    const { data } = await supabase.from("assets").select("*").eq("brand_id", brand.id).eq("type", "garment").order("created_at", { ascending: false });
    const mapped: Garment[] = (data || []).map((a: any) => ({
      id: a.id, name: a.name, brand_id: a.brand_id, created_at: a.created_at,
      type: (a.metadata as any)?.garment_type || "Unknown",
      fabric: (a.metadata as any)?.fabric || "Unknown",
      color: (a.metadata as any)?.color || "#000",
      image_url: a.thumbnail_url || a.file_url,
    }));
    setGarments(mapped);
    setLoading(false);
  };

  useEffect(() => { void fetchGarments(); }, [authReady, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
      if (!brand) {
        const { data: nb } = await supabase.from("brands").insert({ owner_id: user.id, name: "My Brand" }).select("id").single();
        brand = nb;
      }
      if (!brand) throw new Error("Could not create brand");

      let { data: project } = await supabase.from("projects").select("id").eq("brand_id", brand.id).limit(1).single();
      if (!project) {
        const { data: np } = await supabase.from("projects").insert({ brand_id: brand.id, name: "Default Project" }).select("id").single();
        project = np;
      }
      if (!project) throw new Error("Could not create project");

      let fileUrl: string | null = null;
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const path = `${brand.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("garments").upload(path, selectedFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from("garments").getPublicUrl(path);
          fileUrl = pub.publicUrl;
        }
      }

      await supabase.from("assets").insert({
        brand_id: brand.id, project_id: project.id, name: form.name, type: "garment",
        thumbnail_url: fileUrl, file_url: fileUrl,
        metadata: { garment_type: form.type, fabric: form.fabric, color: form.color },
      });

      toast({ title: "Garment added", description: `${form.name} saved to your library.` });
      setShowForm(false);
      setForm({ name: "", type: GARMENT_TYPES[0], fabric: FABRIC_TYPES[0], color: "#000000" });
      setSelectedFile(null);
      setPreview(null);
      fetchGarments();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("assets").delete().eq("id", id);
    toast({ title: "Garment removed" });
    fetchGarments();
  };

  const filtered = garments.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shirt className="w-6 h-6 text-primary" /> Garment Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your performance apparel assets.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Garment
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Add New Garment</h2>
              <button onClick={() => { setShowForm(false); setPreview(null); setSelectedFile(null); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Garment Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Black Compression Shorts" className="premium-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm">
                  {GARMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fabric</Label>
                <select value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm">
                  {FABRIC_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Product Image</Label>
              {preview ? (
                <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-muted/30">
                  <img src={preview} alt="preview" className="w-full h-full object-contain" />
                  <button onClick={() => { setPreview(null); setSelectedFile(null); }} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Click to upload</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Garment
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setPreview(null); setSelectedFile(null); }} className="rounded-xl">Cancel</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {garments.length > 0 && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search garments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 premium-input" />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center"><Shirt className="w-7 h-7 text-primary/60" /></div>
                <div>
                  <p className="font-display font-bold text-lg">No garments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload your first performance garment to start generating visualizations.</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add First Garment</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(g => (
                  <motion.div key={g.id} layout className="glass-card-hover rounded-2xl overflow-hidden">
                    <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
                      {g.image_url ? (
                        <img src={g.image_url} alt={g.name} className="w-full h-full object-contain p-4" />
                      ) : (
                        <Shirt className="w-12 h-12 text-muted-foreground/15" />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: g.color }} />
                        <span className="text-xs text-muted-foreground">{g.type}</span>
                        <span className="text-xs text-muted-foreground">· {g.fabric}</span>
                      </div>
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

export default GarmentLibrary;
