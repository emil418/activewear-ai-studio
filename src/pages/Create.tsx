import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, User, Zap, Download, ArrowRight, ArrowLeft,
  Check, Image, Activity, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

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
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
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
  const { toast } = useToast();

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

  const handleGenerate = () => {
    setGenerating(true);
    setLoadingMsg(0);
    const interval = setInterval(() => {
      setLoadingMsg(prev => {
        if (prev >= loadingMessages.length - 1) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          setStep(4);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
  };

  const canProceed = () => {
    if (step === 0) return !!garmentFile;
    if (step === 1) return !!selectedGender && !!selectedSize && !!selectedBody;
    if (step === 2) return !!selectedMovement;
    return true;
  };

  const next = () => {
    if (step === 3) {
      handleGenerate();
      return;
    }
    if (canProceed() && step < 4) setStep(step + 1);
  };

  const back = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                i === step
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : i < step
                  ? "text-primary/60 hover:text-primary cursor-pointer"
                  : "text-muted-foreground/40"
              }`}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${i < step ? "bg-primary/30" : "bg-white/[0.06]"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0 — Upload */}
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Upload your garment</h2>
              <p className="text-sm text-muted-foreground">Photo, tech flat, or sketch — AI will detect fabric and details.</p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("garment-input")?.click()}
              className="upload-zone min-h-[300px] relative"
            >
              {garmentPreview ? (
                <div className="relative">
                  <img src={garmentPreview} alt="Garment preview" className="max-h-[250px] rounded-xl object-contain" />
                  <p className="text-xs text-muted-foreground mt-4">{garmentFile?.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setGarmentFile(null); setGarmentPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                  >✕</button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="font-display text-base font-bold mb-1">Drop your garment here</p>
                  <p className="text-xs text-muted-foreground mb-4">PNG, JPG, SVG, PSD — Max 25MB</p>
                  <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03]">
                    Choose File
                  </Button>
                </>
              )}
              <input id="garment-input" type="file" accept="image/*,.psd,.svg" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>

            {/* Optional logo */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">Logo (optional)</p>
                  <p className="text-xs text-muted-foreground">Upload to auto-place on garment</p>
                </div>
                {logoFile && <span className="text-xs text-primary/70">{logoFile.name}</span>}
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03]"
                onClick={() => document.getElementById("logo-input")?.click()}>
                {logoFile ? "Change Logo" : "Upload Logo"}
              </Button>
              <input id="logo-input" type="file" accept="image/*,.svg" className="hidden"
                onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])} />
            </div>
          </motion.div>
        )}

        {/* STEP 1 — Athlete */}
        {step === 1 && (
          <motion.div key="athlete" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
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
                        selectedGender === g
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1]"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Size</p>
                <div className="flex gap-2">
                  {sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        selectedSize === s
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1]"
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
                        selectedBody === b
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1]"
                      }`}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Movement */}
        {step === 2 && (
          <motion.div key="movement" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
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
                          selectedMovement === m
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:border-white/[0.1] hover:text-foreground"
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

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
          </motion.div>
        )}

        {/* STEP 3 — Generate */}
        {step === 3 && (
          <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Ready to generate</h2>
              <p className="text-sm text-muted-foreground">Review your selections and hit generate.</p>
            </div>

            {/* Summary */}
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
                    <p className="text-sm font-medium">{logoFile.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Physics info */}
            <div className="glass-card p-6">
              <p className="text-sm font-semibold mb-3">Physics simulation will include:</p>
              <div className="flex flex-wrap gap-2">
                {["Fabric Stretch", "Compression Zones", "Sweat Simulation", "Breathability Map", "Seam Stress"].map(f => (
                  <span key={f} className="feature-badge">{f}</span>
                ))}
              </div>
            </div>

            {generating ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                <p className="font-display text-lg font-bold mb-2 tracking-tight">Generating realistic motion...</p>
                <p className="text-sm text-muted-foreground animate-energy-pulse">{loadingMessages[loadingMsg]}</p>
                <p className="text-xs text-muted-foreground/50 mt-4">This usually takes 30-45 seconds</p>
              </div>
            ) : (
              <Button onClick={handleGenerate} size="lg"
                className="w-full rounded-xl font-bold gap-2 py-6 text-base glow-border">
                <Zap className="w-5 h-5" /> Generate Performance Simulation
              </Button>
            )}
          </motion.div>
        )}

        {/* STEP 4 — Preview & Export */}
        {step === 4 && generated && (
          <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your results</h2>
                <p className="text-sm text-muted-foreground">Multi-angle preview with performance physics.</p>
              </div>
              <Button onClick={() => { setStep(0); setGenerated(false); setGarmentFile(null); setGarmentPreview(null); setSelectedMovement(""); }}
                variant="outline" size="sm" className="rounded-xl border-white/[0.08]">
                New Generation
              </Button>
            </div>

            {/* Multi-angle preview grid */}
            <div className="grid grid-cols-3 gap-4">
              {["Front", "Side", "Back"].map((angle) => (
                <div key={angle} className="glass-card aspect-[3/4] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-white/[0.08] transition-all duration-500">
                  <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{angle}</span>
                  <Image className="w-10 h-10 text-muted-foreground/15 group-hover:text-muted-foreground/30 transition-colors duration-500" />
                  <p className="text-xs text-muted-foreground/30 mt-2">Preview</p>
                  <div className="absolute bottom-3 right-3 flex flex-col items-end gap-0.5">
                    <span className="text-[8px] text-primary/30 font-bold">COMPRESSION: HIGH</span>
                    <span className="text-[8px] text-secondary/30 font-bold">STRETCH: 4×</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Video preview placeholder */}
            <div className="glass-card aspect-video rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/[0.06] flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-primary/60" />
                </div>
                <p className="text-sm font-semibold mb-1">Motion Video</p>
                <p className="text-xs text-muted-foreground">{selectedMovement} — {intensity[0]}% intensity</p>
              </div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                {["Stretch Map", "Compression", "Sweat"].map(overlay => (
                  <span key={overlay} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-primary/60 font-semibold">{overlay}</span>
                ))}
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Stretch Factor", value: "4×" },
                { label: "Compression", value: "85%" },
                { label: "Sweat Absorption", value: "92%" },
                { label: "Breathability", value: "78%" },
              ].map(m => (
                <div key={m.label} className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="font-display text-lg font-bold glow-text">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Export */}
            <div className="flex gap-3">
              <Button className="flex-1 rounded-xl font-bold gap-2 py-5 glow-border"
                onClick={() => toast({ title: "Campaign Pack", description: "Preparing your export pack: video, images, Reels clip, and PDF lookbook..." })}>
                <Package className="w-4 h-4" /> Create Campaign Pack
              </Button>
              <Button variant="outline" className="rounded-xl border-white/[0.08] hover:bg-white/[0.03] gap-2 px-6"
                onClick={() => toast({ title: "Downloaded", description: "High-res images saved." })}>
                <Download className="w-4 h-4" /> Images
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 4 && !generating && (
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canProceed()} className="gap-2 rounded-xl font-bold px-8">
            {step === 3 ? "Generate" : "Continue"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Create;
