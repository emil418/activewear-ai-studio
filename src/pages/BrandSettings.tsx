import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Upload, Save, Sparkles, Check, Loader2, Image, Type, Eye } from "lucide-react";
import AdminManagement from "@/components/AdminManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useInfluencerMode } from "@/hooks/useInfluencerMode";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VIBES = [
  { id: "hardcore", label: "Hardcore Gym", desc: "Dark tones, heavy contrast, raw energy" },
  { id: "aesthetic", label: "Aesthetic", desc: "Clean lines, balanced lighting, sculpted look" },
  { id: "minimal", label: "Minimal", desc: "Stripped back, muted palette, negative space" },
  { id: "luxury", label: "Performance Luxury", desc: "Rich textures, warm tones, premium feel" },
] as const;

const OVERLAY_STYLES = [
  { id: "subtle", label: "Subtle" },
  { id: "bold", label: "Bold" },
  { id: "none", label: "None" },
  { id: "gradient", label: "Gradient" },
] as const;

interface BrandKit {
  id: string;
  brand_id: string;
  logo_primary_url: string | null;
  logo_secondary_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  vibe: string;
  overlay_style: string;
  watermark_opacity: number;
  guidelines: string | null;
}

const BrandSettings = () => {
  const { influencerMode, setInfluencerMode } = useInfluencerMode();
  const { user, authReady } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [kitId, setKitId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");

  // Brand kit fields
  const [primaryColor, setPrimaryColor] = useState("#00FF85");
  const [secondaryColor, setSecondaryColor] = useState("#00E5FF");
  const [accentColor, setAccentColor] = useState("#FF3D6E");
  const [fontPrimary, setFontPrimary] = useState("Satoshi");
  const [fontSecondary, setFontSecondary] = useState("Inter");
  const [vibe, setVibe] = useState("aesthetic");
  const [overlayStyle, setOverlayStyle] = useState("subtle");
  const [watermarkOpacity, setWatermarkOpacity] = useState([30]);
  const [guidelines, setGuidelines] = useState("");
  const [logoPrimaryUrl, setLogoPrimaryUrl] = useState<string | null>(null);
  const [logoSecondaryUrl, setLogoSecondaryUrl] = useState<string | null>(null);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);

  // Load brand + brand kit
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!authReady) return;
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: brand } = await supabase.from("brands").select("id, name").eq("owner_id", user.id).limit(1).single();
      if (!mounted) return;
      if (!brand) {
        setLoading(false);
        return;
      }
      setBrandId(brand.id);
      setBrandName(brand.name);

      const { data: kit } = await supabase
        .from("brand_kits")
        .select("*")
        .eq("brand_id", brand.id)
        .limit(1)
        .single();

      if (!mounted) return;
      if (kit) {
        const k = kit as unknown as BrandKit;
        setKitId(k.id);
        setPrimaryColor(k.primary_color || "#00FF85");
        setSecondaryColor(k.secondary_color || "#00E5FF");
        setAccentColor(k.accent_color || "#FF3D6E");
        setFontPrimary(k.font_primary || "Satoshi");
        setFontSecondary(k.font_secondary || "Inter");
        setVibe(k.vibe || "aesthetic");
        setOverlayStyle(k.overlay_style || "subtle");
        setWatermarkOpacity([Math.round((k.watermark_opacity || 0.3) * 100)]);
        setGuidelines(k.guidelines || "");
        setLogoPrimaryUrl(k.logo_primary_url);
        setLogoSecondaryUrl(k.logo_secondary_url);
      }
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [authReady, user]);

  const uploadLogo = useCallback(async (file: File, type: "primary" | "secondary") => {
    if (!brandId) return;
    const setter = type === "primary" ? setUploadingPrimary : setUploadingSecondary;
    const urlSetter = type === "primary" ? setLogoPrimaryUrl : setLogoSecondaryUrl;
    setter(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${brandId}/${type}-logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("brand-assets").getPublicUrl(path);
      urlSetter(publicUrl);
      toast({ title: `${type === "primary" ? "Primary" : "Secondary"} logo uploaded` });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setter(false);
    }
  }, [brandId, toast]);

  const handleSave = async () => {
    if (!brandId) return;
    setSaving(true);
    try {
      // Update brand name
      await supabase.from("brands").update({ name: brandName }).eq("id", brandId);

      const kitData = {
        brand_id: brandId,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        font_primary: fontPrimary,
        font_secondary: fontSecondary,
        vibe,
        overlay_style: overlayStyle,
        watermark_opacity: watermarkOpacity[0] / 100,
        guidelines: guidelines || null,
        logo_primary_url: logoPrimaryUrl,
        logo_secondary_url: logoSecondaryUrl,
      };

      if (kitId) {
        await supabase.from("brand_kits").update(kitData as any).eq("id", kitId);
      } else {
        const { data } = await supabase.from("brand_kits").insert(kitData as any).select("id").single();
        if (data) setKitId(data.id);
      }

      toast({ title: "Brand Kit saved", description: "Your visual identity is locked and ready for use across all outputs." });
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">Brand Kit</h1>
        <p className="text-sm text-muted-foreground">Define your visual identity once — reuse across templates, campaigns, exports, and lookbooks.</p>
      </motion.div>

      {/* Brand Name */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-7 space-y-5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Brand Name</Label>
        <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your brand name" className="premium-input max-w-sm" />
      </motion.div>

      {/* Logo Uploads */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-7 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Image className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold">Brand Logos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Logo */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Primary Logo</Label>
            <div className="upload-zone min-h-[160px]" onClick={() => document.getElementById("logo-primary-input")?.click()}>
              {logoPrimaryUrl ? (
                <div className="relative">
                  <img src={logoPrimaryUrl} alt="Primary logo" className="max-h-[100px] object-contain" />
                  <p className="text-xs text-muted-foreground mt-2">Click to replace</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-primary/40 mb-2" />
                  <p className="text-xs font-semibold">Upload primary logo</p>
                  <p className="text-xs text-muted-foreground">PNG or SVG, transparent</p>
                </>
              )}
              {uploadingPrimary && <Loader2 className="w-4 h-4 animate-spin text-primary absolute top-3 right-3" />}
            </div>
            <input id="logo-primary-input" type="file" accept="image/png,image/svg+xml" className="hidden"
              onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0], "primary")} />
          </div>
          {/* Secondary Logo */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Secondary Logo</Label>
            <div className="upload-zone min-h-[160px]" onClick={() => document.getElementById("logo-secondary-input")?.click()}>
              {logoSecondaryUrl ? (
                <div className="relative">
                  <img src={logoSecondaryUrl} alt="Secondary logo" className="max-h-[100px] object-contain" />
                  <p className="text-xs text-muted-foreground mt-2">Click to replace</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold">Upload variation</p>
                  <p className="text-xs text-muted-foreground">Mono, icon-only, etc.</p>
                </>
              )}
              {uploadingSecondary && <Loader2 className="w-4 h-4 animate-spin text-primary absolute top-3 right-3" />}
            </div>
            <input id="logo-secondary-input" type="file" accept="image/png,image/svg+xml" className="hidden"
              onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0], "secondary")} />
          </div>
        </div>
      </motion.div>

      {/* Colors */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-7 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold">Brand Colors</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Primary", value: primaryColor, set: setPrimaryColor },
            { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
            { label: "Accent", value: accentColor, set: setAccentColor },
          ].map(c => (
            <div key={c.label} className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{c.label}</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-0" />
                </div>
                <Input value={c.value} onChange={e => c.set(e.target.value)}
                  className="premium-input font-mono text-xs uppercase w-28" maxLength={7} />
              </div>
            </div>
          ))}
        </div>
        {/* Color preview */}
        <div className="flex gap-2 pt-2">
          {[primaryColor, secondaryColor, accentColor].map((c, i) => (
            <div key={i} className="h-8 flex-1 rounded-lg" style={{ backgroundColor: c }} />
          ))}
        </div>
      </motion.div>

      {/* Typography */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-7 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Type className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold">Typography</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Display Font</Label>
            <Input value={fontPrimary} onChange={e => setFontPrimary(e.target.value)}
              placeholder="Satoshi" className="premium-input" />
            <p className="text-xs text-muted-foreground">Used for headings, campaign titles</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Body Font</Label>
            <Input value={fontSecondary} onChange={e => setFontSecondary(e.target.value)}
              placeholder="Inter" className="premium-input" />
            <p className="text-xs text-muted-foreground">Used for body text, labels</p>
          </div>
        </div>
      </motion.div>

      {/* Vibe Presets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-7 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold">Brand Vibe</p>
        </div>
        <p className="text-xs text-muted-foreground">Controls default lighting, overlay opacity, typography spacing, and campaign pack layout.</p>
        <div className="grid grid-cols-2 gap-3">
          {VIBES.map(v => (
            <button key={v.id} onClick={() => setVibe(v.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 border ${
                vibe === v.id
                  ? "bg-primary/[0.08] border-primary/20 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/10"
              }`}>
              <div className="flex items-center gap-2 mb-1">
                {vibe === v.id && <Check className="w-3.5 h-3.5" />}
                <span className="text-sm font-bold">{v.label}</span>
              </div>
              <p className="text-xs opacity-70">{v.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overlay & Watermark */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-7 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold">Overlay & Watermark</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Overlay Style</Label>
            <div className="flex gap-2">
              {OVERLAY_STYLES.map(o => (
                <button key={o.id} onClick={() => setOverlayStyle(o.id)}
                  className={`text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    overlayStyle === o.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Watermark Opacity</Label>
              <span className="text-sm font-bold text-primary">{watermarkOpacity[0]}%</span>
            </div>
            <Slider value={watermarkOpacity} onValueChange={setWatermarkOpacity} max={100} step={1} />
          </div>
        </div>
      </motion.div>

      {/* Guidelines */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-7 space-y-4">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Brand Guidelines (Optional)</Label>
        <textarea value={guidelines} onChange={e => setGuidelines(e.target.value)}
          placeholder="E.g. 'Never place logo below waistline. Always use dark background for campaign shoots.'"
          className="premium-input w-full min-h-[100px] p-3 rounded-xl resize-none text-sm" />
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl font-bold px-8 py-5 glow-border">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Brand Kit"}
        </Button>
      </motion.div>

      {/* Influencer Mode */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="glass-card p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold">Creator / Influencer Mode</p>
              <p className="text-xs text-muted-foreground">Simplified UI — influencers can only use approved templates.</p>
            </div>
          </div>
          <Switch checked={influencerMode} onCheckedChange={setInfluencerMode} />
        </div>
        {influencerMode && (
          <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10 text-xs text-secondary/80">
            Creator Mode active. Influencers see limited options, pre-set templates, and can only generate + download.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BrandSettings;
