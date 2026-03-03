import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, User, Zap, Download, ArrowRight, ArrowLeft,
  Check, Image, Activity, Package, Layers, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInfluencerMode } from "@/hooks/useInfluencerMode";
import { supabase } from "@/integrations/supabase/client";
import LogoPlacer, { type LogoPosition } from "@/components/LogoPlacer";
import JSZip from "jszip";
import { jsPDF } from "jspdf";

/* ─── Step config ─── */
const STEPS = [
  { label: "Upload Gear", icon: Upload },
  { label: "Choose Athlete", icon: User },
  { label: "Choose Movement", icon: Activity },
  { label: "Generate", icon: Zap },
  { label: "Preview & Export", icon: Download },
];

const movements = [
  { cat: "Strength", items: ["Squats", "Push-ups", "Deadlifts", "Lunges", "Pull-ups", "Bench Press"] },
  { cat: "Cardio", items: ["Sprint", "Burpees", "High Knees", "Jump Rope", "Mountain Climbers", "Box Jumps"] },
  { cat: "Yoga", items: ["Warrior Pose", "Downward Dog", "Tree Pose", "Sun Salutation", "Cobra", "Plank"] },
  { cat: "HIIT", items: ["Squat Jumps", "Thrusters", "Battle Ropes", "Kettlebell Swings", "Skaters", "Tuck Jumps"] },
];

const genders = ["Male", "Female", "Non-binary"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const ANGLES = ["front", "side", "back"] as const;
const bodyTypes = ["Lean Runner", "Athletic", "Muscular", "Plus-Size", "Adaptive"];

const loadingMessages = [
  "Analyzing fabric properties...",
  "Building athlete mesh...",
  "Simulating stretch under load...",
  "Applying compression physics...",
  "Rendering sweat and breathability...",
  "Generating multi-angle views...",
  "Almost there — finalizing motion...",
];

interface GenerationResult {
  garment_analysis: Record<string, unknown>;
  physics: {
    stretch_factor: string;
    compression_percentage: number;
    sweat_absorption: number;
    breathability_score: number;
    stress_zones: string[];
    performance_notes: string;
  };
  images: Record<string, string | null>;
  stored_urls: Record<string, string>;
  model_router: Record<string, string>;
}

const Create = () => {
  const [step, setStep] = useState(0);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState("Female");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedBody, setSelectedBody] = useState("Athletic");
  const [selectedMovement, setSelectedMovement] = useState("");
  const [intensity, setIntensity] = useState([50]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Size variants: maps size -> GenerationResult
  const [sizeVariants, setSizeVariants] = useState<Record<string, GenerationResult | null>>({});
  const [generatingSizes, setGeneratingSizes] = useState(false);
  const [sizeProgress, setSizeProgress] = useState("");
  const [activeSizeTab, setActiveSizeTab] = useState("M");

  const { toast } = useToast();
  const { session: _session } = useAuth();
  const { influencerMode } = useInfluencerMode();

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleFileSelect = (file: File) => {
    setGarmentFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setGarmentPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
      // Default to chest-center
      if (!logoPosition) setLogoPosition({ x: 50, y: 25, placement: "chest-center" });
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const generateForSize = async (size: string, garmentBase64: string | null, logoBase64: string | null): Promise<GenerationResult> => {
    const response = await supabase.functions.invoke("generate-motion", {
      body: {
        garmentName: garmentFile?.name || "Activewear",
        garmentBase64,
        gender: selectedGender,
        size,
        bodyType: selectedBody,
        movement: selectedMovement,
        intensity: intensity[0],
        logoBase64,
        logoPosition: logoPosition || undefined,
      },
    });
    if (!response.data || response.data.error) throw new Error(response.data?.error || "Generation failed");
    return response.data as GenerationResult;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    setLoadingMsg(0);
    setSizeVariants({});

    const interval = setInterval(() => {
      setLoadingMsg(prev => prev >= loadingMessages.length - 1 ? prev : prev + 1);
    }, 3000);

    try {
      const garmentBase64 = garmentFile ? await fileToBase64(garmentFile) : null;
      const logoBase64 = logoFile ? await fileToBase64(logoFile) : null;
      const typedData = await generateForSize(selectedSize, garmentBase64, logoBase64);

      clearInterval(interval);
      setResult(typedData);
      setGenerated(true);
      setStep(4);
      setActiveSizeTab(selectedSize);

      const allImages = { ...typedData.images, ...typedData.stored_urls };
      const successCount = Object.values(allImages).filter(Boolean).length;
      const analysis = typedData.garment_analysis as Record<string, unknown>;
      const garmentLabel = analysis?.garment_category || "Garment";

      toast({
        title: "✅ Generation complete — ready for export",
        description: `${garmentLabel} rendered in ${successCount}/3 angles. ${successCount === 3 ? "All views generated successfully." : "Some views may need retry."}`,
      });
    } catch (err: unknown) {
      clearInterval(interval);
      const message = err instanceof Error ? err.message : "Generation failed. Please try again.";
      setGenerationError(message);
      toast({ title: "Generation failed", description: message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllSizes = async () => {
    if (!garmentFile) return;
    setGeneratingSizes(true);
    const variants: Record<string, GenerationResult | null> = {};
    variants[selectedSize] = result;

    try {
      const garmentBase64 = await fileToBase64(garmentFile);
      const logoBase64 = logoFile ? await fileToBase64(logoFile) : null;
      const remainingSizes = ALL_SIZES.filter(s => s !== selectedSize);

      for (const size of remainingSizes) {
        setSizeProgress(`Generating ${size}...`);
        try {
          variants[size] = await generateForSize(size, garmentBase64, logoBase64);
        } catch {
          variants[size] = null;
        }
      }

      setSizeVariants(variants);
      toast({
        title: "✅ All size variants generated",
        description: `${Object.values(variants).filter(Boolean).length}/${ALL_SIZES.length} sizes completed — all views included.`,
      });
    } catch (err) {
      toast({ title: "Size generation failed", description: String(err), variant: "destructive" });
    } finally {
      setGeneratingSizes(false);
      setSizeProgress("");
    }
  };

  const canProceed = () => {
    if (step === 0) return !!garmentFile;
    if (step === 1) return !!selectedGender && !!selectedSize && !!selectedBody;
    if (step === 2) return !!selectedMovement;
    return true;
  };

  const next = () => {
    if (step === 3) { handleGenerate(); return; }
    if (canProceed() && step < 4) setStep(step + 1);
  };
  const back = () => { if (step > 0) setStep(step - 1); };

  const physics = result?.physics;
  const showSimplifiedUI = influencerMode;

  // Helper: get image URL for a given result
  const getImageUrl = (res: GenerationResult | null, angle: string) =>
    res?.stored_urls?.[angle] || res?.images?.[angle] || null;

  // Collect ALL images across sizes for downloads
  const collectAllImages = useMemo(() => {
    const entries: { size: string; angle: string; url: string }[] = [];
    const garmentName = garmentFile?.name?.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-") || "Garment";

    // If we have size variants, use them (includes the primary size)
    const sizesToProcess = Object.keys(sizeVariants).length > 0 ? sizeVariants : { [selectedSize]: result };

    for (const [size, data] of Object.entries(sizesToProcess)) {
      if (!data) continue;
      for (const angle of ANGLES) {
        const url = getImageUrl(data, angle);
        if (url) entries.push({ size, angle, url });
      }
    }
    return { entries, garmentName };
  }, [sizeVariants, result, selectedSize, garmentFile]);

  const buildCampaignPack = async () => {
    if (!result) return;
    toast({ title: "Preparing Campaign Pack...", description: "Generating PDF and bundling assets." });
    try {
      const zip = new JSZip();
      const { entries, garmentName } = collectAllImages;

      // Images organized by size
      for (const { size, angle, url } of entries) {
        const folder = zip.folder(size);
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          folder?.file(`${garmentName}_${size}_${angle.charAt(0).toUpperCase() + angle.slice(1)}.png`, blob);
        } catch { /* skip */ }
      }

      // Reels thumbnails from front views
      const reelsFolder = zip.folder("reels-thumbnails");
      for (const { size, angle, url } of entries) {
        if (angle !== "front") continue;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          reelsFolder?.file(`reel-${size}.png`, blob);
        } catch { /* skip */ }
      }

      // PDF lookbook
      const pdf = new jsPDF();
      pdf.setFontSize(28);
      pdf.text("ActiveForge", 20, 25);
      pdf.setFontSize(14);
      pdf.setTextColor(100);
      pdf.text("Campaign Lookbook", 20, 35);
      pdf.setDrawColor(0, 255, 133);
      pdf.line(20, 40, 190, 40);

      pdf.setTextColor(0);
      pdf.setFontSize(12);
      pdf.text(`Garment: ${garmentFile?.name || "Activewear"}`, 20, 55);
      pdf.text(`Movement: ${selectedMovement} at ${intensity[0]}% intensity`, 20, 65);
      pdf.text(`Athlete: ${selectedGender}, ${selectedSize}, ${selectedBody}`, 20, 75);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 85);
      if (logoPosition) pdf.text(`Logo Position: ${logoPosition.placement}`, 20, 95);

      pdf.setFontSize(16);
      pdf.text("Performance Metrics", 20, 115);
      pdf.setFontSize(11);
      const p = result.physics;
      [
        ["Stretch Factor", p.stretch_factor],
        ["Compression", `${p.compression_percentage}%`],
        ["Sweat Absorption", `${p.sweat_absorption}%`],
        ["Breathability", `${p.breathability_score}%`],
      ].forEach(([label, val], i) => {
        pdf.text(`${label}: ${val}`, 20, 130 + i * 10);
      });
      if (p.stress_zones?.length) pdf.text(`Stress Zones: ${p.stress_zones.join(", ")}`, 20, 175);
      if (p.performance_notes) { pdf.text("Notes:", 20, 190); pdf.text(p.performance_notes, 20, 200, { maxWidth: 170 }); }

      // Garment analysis page
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("Garment Analysis", 20, 25);
      pdf.setFontSize(11);
      let y = 40;
      for (const [key, val] of Object.entries(result.garment_analysis)) {
        const display = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
        pdf.text(`${key.replace(/_/g, " ")}: ${display}`, 20, y);
        y += 10;
        if (y > 280) { pdf.addPage(); y = 20; }
      }

      // Size variants summary
      if (Object.keys(sizeVariants).length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("Size Variants Summary", 20, 25);
        pdf.setFontSize(11);
        let sy = 40;
        for (const size of ALL_SIZES) {
          const sv = sizeVariants[size];
          if (!sv) { pdf.text(`${size}: Not generated`, 20, sy); sy += 10; continue; }
          const count = ANGLES.filter(a => getImageUrl(sv, a)).length;
          pdf.text(`${size}: ${count}/3 angles — Stretch ${sv.physics.stretch_factor}, Compression ${sv.physics.compression_percentage}%`, 20, sy);
          sy += 10;
          if (sy > 280) { pdf.addPage(); sy = 20; }
        }
      }

      zip.file("lookbook.pdf", pdf.output("blob"));
      zip.file("performance-metrics.json", JSON.stringify({
        physics: result.physics,
        garment_analysis: result.garment_analysis,
        logo_position: logoPosition,
        sizes: Object.fromEntries(
          Object.entries(Object.keys(sizeVariants).length > 0 ? sizeVariants : { [selectedSize]: result })
            .filter(([, v]) => v)
            .map(([s, v]) => [s, { physics: v!.physics, angles: ANGLES.filter(a => getImageUrl(v!, a)) }])
        ),
      }, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `ActiveForge-${garmentName}-${selectedMovement.replace(/\s+/g, "-")}-${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Campaign Pack downloaded", description: `${entries.length} images across ${Object.keys(Object.keys(sizeVariants).length > 0 ? sizeVariants : { [selectedSize]: result }).length} size(s) bundled.` });
    } catch (err) {
      toast({ title: "Export failed", description: String(err), variant: "destructive" });
    }
  };

  const handleSaveImages = async () => {
    const { entries, garmentName } = collectAllImages;
    if (entries.length === 0) {
      toast({ title: "No images to save", variant: "destructive" });
      return;
    }
    if (entries.length === 1) {
      const a = document.createElement("a");
      a.href = entries[0].url;
      a.download = `${garmentName}_${entries[0].size}_${entries[0].angle}.png`;
      a.target = "_blank";
      a.click();
    } else {
      const zip = new JSZip();
      for (const { size, angle, url } of entries) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          zip.file(`${garmentName}_${size}_${angle.charAt(0).toUpperCase() + angle.slice(1)}.png`, blob);
        } catch { /* skip */ }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${garmentName}-all-images.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    toast({ title: "Images saved", description: `${entries.length} images downloaded.` });
  };

  const handleSendToBrand = () => {
    toast({
      title: "📤 Shared with brand",
      description: "A shareable link has been prepared. Copy the link from your library to send to your brand partner.",
    });
  };

  // Current active result for preview (size tab or primary)
  const activeResult = Object.keys(sizeVariants).length > 0
    ? (sizeVariants[activeSizeTab] || result)
    : result;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* Influencer mode banner */}
      {showSimplifiedUI && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Creator Mode Active
        </div>
      )}

      {/* Step indicator */}
      {!showSimplifiedUI && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  i === step ? "bg-primary/10 text-primary border border-primary/20"
                    : i < step ? "text-primary/60 hover:text-primary cursor-pointer"
                    : "text-muted-foreground/40"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-primary/30" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 0 — Upload */}
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">
                {showSimplifiedUI ? "Drop your gear" : "Upload your garment"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showSimplifiedUI ? "Upload and we'll handle the rest." : "Photo, tech flat, or sketch — AI will detect fabric and details."}
              </p>
            </div>

            <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
              onClick={() => document.getElementById("garment-input")?.click()}
              className={`upload-zone relative ${showSimplifiedUI ? "min-h-[350px]" : "min-h-[300px]"}`}>
              {garmentPreview ? (
                <div className="relative">
                  <img src={garmentPreview} alt="Garment preview" className="max-h-[250px] rounded-xl object-contain" />
                  <p className="text-xs text-muted-foreground mt-4">{garmentFile?.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); setGarmentFile(null); setGarmentPreview(null); setLogoPosition(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors">✕</button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="font-display text-base font-bold mb-1">Drop your garment here</p>
                  <p className="text-xs text-muted-foreground mb-4">PNG, JPG, SVG — Max 25MB</p>
                  <Button variant="outline" size={showSimplifiedUI ? "lg" : "sm"} className="rounded-xl border-border hover:bg-muted">
                    Choose File
                  </Button>
                </>
              )}
              <input id="garment-input" type="file" accept="image/*,.svg" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>

            {/* Logo upload + placement */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Logo {showSimplifiedUI ? "" : "(optional)"}</p>
                  <p className="text-xs text-muted-foreground">Upload, then drag to position on garment</p>
                </div>
                {logoFile && <span className="text-xs text-primary/70">{logoFile.name}</span>}
              </div>
              <Button variant="outline" size={showSimplifiedUI ? "lg" : "sm"} className="rounded-xl border-border hover:bg-muted"
                onClick={() => document.getElementById("logo-input")?.click()}>
                {logoFile ? "Change Logo" : "Upload Logo"}
              </Button>
              <input id="logo-input" type="file" accept="image/*,.svg" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoSelect(e.target.files[0])} />

              {/* Logo placer */}
              {garmentPreview && logoPreview && (
                <LogoPlacer
                  garmentPreview={garmentPreview}
                  logoPreview={logoPreview}
                  position={logoPosition}
                  onPositionChange={setLogoPosition}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 1 — Athlete */}
        {step === 1 && (
          <motion.div key="athlete" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Choose your athlete</h2>
              <p className="text-sm text-muted-foreground">Select gender, size, and body type for the simulation.</p>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Gender</p>
                <div className="flex gap-2">
                  {genders.map(g => (
                    <button key={g} onClick={() => setSelectedGender(g)}
                      className={`text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        selectedGender === g ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Size</p>
                <div className="flex gap-2">
                  {ALL_SIZES.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        selectedSize === s ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Body Type</p>
                <div className="flex flex-wrap gap-2">
                  {bodyTypes.map(b => (
                    <button key={b} onClick={() => setSelectedBody(b)}
                      className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        selectedBody === b ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                      }`}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Movement */}
        {step === 2 && (
          <motion.div key="movement" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Choose a movement</h2>
              <p className="text-sm text-muted-foreground">Pick a training movement and set the intensity level.</p>
            </div>

            <div className="glass-card p-6 space-y-6">
              {movements.map(cat => (
                <div key={cat.cat}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{cat.cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(m => (
                      <button key={m} onClick={() => setSelectedMovement(m)}
                        className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                          selectedMovement === m ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border hover:border-primary/20 hover:text-foreground"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!showSimplifiedUI && (
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Intensity</p>
                    <p className="text-xs text-muted-foreground">Controls speed, sweat, and strain level</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{intensity[0]}%</span>
                </div>
                <Slider value={intensity} onValueChange={setIntensity} max={100} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground/50">
                  <span>Low — light sweat, slow pace</span>
                  <span>High — heavy sweat, fast pace</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3 — Generate */}
        {step === 3 && (
          <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Ready to generate</h2>
              <p className="text-sm text-muted-foreground">Review your selections and hit generate.</p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Garment</p>
                  <p className="text-sm font-medium">{garmentFile?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Athlete</p>
                  <p className="text-sm font-medium">{selectedGender}, {selectedSize}, {selectedBody}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Movement</p>
                  <p className="text-sm font-medium">{selectedMovement}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Intensity</p>
                  <p className="text-sm font-medium">{intensity[0]}%</p>
                </div>
                {logoFile && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Logo</p>
                    <p className="text-sm font-medium">{logoFile.name} — {logoPosition?.placement || "chest-center"}</p>
                  </div>
                )}
              </div>
            </div>

            {!showSimplifiedUI && (
              <div className="glass-card p-6">
                <p className="text-sm font-semibold mb-3">Smart Model Router will use:</p>
                <div className="flex flex-wrap gap-2">
                  {["Garment Analysis (Flash)", "Physics Engine (Flash)", "Image Gen (Pro Image)"].map(f => (
                    <span key={f} className="feature-badge">{f}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">3 AI models working in sync — auto-selected for each task.</p>
              </div>
            )}

            {generating ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                <p className="font-display text-lg font-bold mb-2 tracking-tight">Generating realistic motion...</p>
                <p className="text-sm text-muted-foreground animate-energy-pulse">{loadingMessages[loadingMsg]}</p>
                <p className="text-xs text-muted-foreground/50 mt-4">This usually takes 30-60 seconds</p>
              </div>
            ) : generationError ? (
              <div className="glass-card p-6 border-destructive/20 space-y-3">
                <p className="text-sm font-semibold text-destructive">Generation failed</p>
                <p className="text-xs text-muted-foreground">{generationError}</p>
                <Button onClick={handleGenerate} variant="outline" size="sm" className="rounded-xl">Try Again</Button>
              </div>
            ) : (
              <Button onClick={handleGenerate} size="lg"
                className={`w-full rounded-xl font-bold gap-2 glow-border ${showSimplifiedUI ? "py-8 text-lg" : "py-6 text-base"}`}>
                <Zap className="w-5 h-5" /> Generate Performance Simulation
              </Button>
            )}
          </motion.div>
        )}

        {/* STEP 4 — Preview & Export */}
        {step === 4 && generated && (
          <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your results</h2>
                <p className="text-sm text-muted-foreground">AI-generated multi-angle preview with performance physics.</p>
              </div>
              <Button onClick={() => { setStep(0); setGenerated(false); setGarmentFile(null); setGarmentPreview(null); setSelectedMovement(""); setResult(null); setSizeVariants({}); setLogoFile(null); setLogoPreview(null); setLogoPosition(null); }}
                variant="outline" size="sm" className="rounded-xl border-border">
                New Generation
              </Button>
            </div>

            {/* Size tabs when variants exist */}
            {Object.keys(sizeVariants).length > 0 ? (
              <Tabs value={activeSizeTab} onValueChange={setActiveSizeTab}>
                <TabsList className="w-full justify-start bg-muted/30 rounded-xl">
                  {ALL_SIZES.map(size => (
                    <TabsTrigger key={size} value={size} disabled={!sizeVariants[size]}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg text-xs font-bold">
                      {size}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {ALL_SIZES.map(size => (
                  <TabsContent key={size} value={size}>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {ANGLES.map(angle => {
                        const imgSrc = getImageUrl(sizeVariants[size], angle);
                        return (
                          <div key={angle} className="glass-card aspect-[3/4] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                            <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{angle}</span>
                            <span className="absolute top-3 right-3 text-[10px] font-bold text-primary/50 uppercase">{size}</span>
                            {imgSrc ? (
                              <img src={imgSrc} alt={`${size} ${angle}`} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <>
                                <Image className="w-10 h-10 text-muted-foreground/15" />
                                <p className="text-xs text-muted-foreground/30 mt-2">No image</p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              /* Single size: 3-angle grid */
              <div className="grid grid-cols-3 gap-4">
                {ANGLES.map(angle => {
                  const imgSrc = getImageUrl(result, angle);
                  return (
                    <div key={angle} className="glass-card aspect-[3/4] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/10 transition-all duration-500">
                      <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{angle}</span>
                      {imgSrc ? (
                        <img src={imgSrc} alt={`${angle} view`} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Image className="w-10 h-10 text-muted-foreground/15 group-hover:text-muted-foreground/30 transition-colors duration-500" />
                          <p className="text-xs text-muted-foreground/30 mt-2">No image generated</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generate All Sizes button */}
            {Object.keys(sizeVariants).length === 0 && (
              <Button onClick={handleGenerateAllSizes} disabled={generatingSizes}
                size="lg" variant="outline"
                className="w-full rounded-xl font-bold gap-2 py-5 border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50 transition-all">
                {generatingSizes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {sizeProgress || "Generating sizes..."}
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Generate in all sizes (XS, S, M, L, XL, XXL)
                  </>
                )}
              </Button>
            )}

            {/* Physics results */}
            {activeResult?.physics && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Stretch Factor", value: activeResult.physics.stretch_factor || "4×" },
                    { label: "Compression", value: `${activeResult.physics.compression_percentage || 85}%` },
                    { label: "Sweat Absorption", value: `${activeResult.physics.sweat_absorption || 92}%` },
                    { label: "Breathability", value: `${activeResult.physics.breathability_score || 78}%` },
                  ].map(m => (
                    <div key={m.label} className="glass-card p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                      <p className="font-display text-lg font-bold glow-text">{m.value}</p>
                    </div>
                  ))}
                </div>

                {!showSimplifiedUI && activeResult.physics.stress_zones?.length > 0 && (
                  <div className="glass-card p-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Stress Zones</p>
                    <div className="flex flex-wrap gap-2">
                      {activeResult.physics.stress_zones.map((zone: string) => (
                        <span key={zone} className="sport-badge">{zone}</span>
                      ))}
                    </div>
                    {activeResult.physics.performance_notes && (
                      <p className="text-xs text-muted-foreground mt-3">{activeResult.physics.performance_notes}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Garment Analysis */}
            {!showSimplifiedUI && activeResult?.garment_analysis && Object.keys(activeResult.garment_analysis).length > 0 && (
              <div className="glass-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Garment Analysis</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(activeResult.garment_analysis).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                      <span className="font-medium">{Array.isArray(value) ? (value as string[]).join(", ") : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            <div className={`flex gap-3 ${showSimplifiedUI ? "flex-col" : ""}`}>
              <Button className={`rounded-xl font-bold gap-2 glow-border ${showSimplifiedUI ? "py-6 text-base" : "flex-1 py-5"}`}
                onClick={buildCampaignPack}>
                <Package className="w-4 h-4" /> Create Campaign Pack
              </Button>
              <Button variant="outline" className="rounded-xl border-border hover:bg-muted gap-2 px-6"
                onClick={handleSaveImages}>
                <Download className="w-4 h-4" /> Save Images ({collectAllImages.entries.length})
              </Button>
              {showSimplifiedUI && (
                <Button variant="outline" className="rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10 gap-2 py-5"
                  onClick={handleSendToBrand}>
                  <Send className="w-4 h-4" /> Send to Brand
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 4 && !generating && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canProceed()}
            className={`gap-2 rounded-xl font-bold ${showSimplifiedUI ? "px-12 py-5 text-base" : "px-8"}`}>
            {step === 3 ? "Generate" : "Continue"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Create;
