import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, User, Package, Zap, Download, ArrowRight, ArrowLeft,
  Check, Activity, Loader2, FileText, BarChart3, AlertTriangle,
  Maximize2, Move, Layers, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";

/* ─── Types ─── */
interface AthleteProfile {
  id: string;
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
}

interface FitScore {
  overall: number;
  label: string;
  breakdown: {
    area: string;
    score: number;
    status: "good" | "tight" | "loose" | "risk";
    note: string;
  }[];
}

interface FitResult {
  size: string;
  imageUrl: string | null;
  fitScore: FitScore;
  issues: string[];
}

/* ─── Constants ─── */
const FIT_TEST_TYPES = [
  { id: "static", label: "Static Fit", icon: Target, desc: "Base fit & silhouette in neutral pose" },
  { id: "movement", label: "Movement Fit", icon: Move, desc: "Mobility, stretch & garment behavior" },
  { id: "multi-size", label: "Multi-Size Comparison", icon: Layers, desc: "Same athlete across sizes" },
  { id: "measurement", label: "Body Measurement", icon: Ruler, desc: "Fit based on body dimensions" },
  { id: "performance", label: "Performance Fit", icon: Zap, desc: "Full performance stress test" },
] as const;

const SIZES = ["XS", "S", "M", "L", "XL"] as const;

const MOVEMENTS = [
  "Standing Neutral", "Squat", "Deadlift", "Pull-up",
  "Push-up", "Lunge", "Sprint", "Jumping", "High Knees",
];

const FIT_AREAS = [
  "Shoulders", "Chest", "Torso Length", "Waist",
  "Hips", "Sleeves", "Leg Opening", "Overall Silhouette",
];

const STEPS = [
  { label: "Select Athlete", icon: User },
  { label: "Select Garment", icon: Package },
  { label: "Test Config", icon: Ruler },
  { label: "Results", icon: BarChart3 },
];

/* ─── Helpers ─── */
function generateFitScore(size: string, movement: string, testType: string): FitScore {
  const seed = size.charCodeAt(0) + movement.length + testType.length;
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed * 9301 + min * 49297) * 49297;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const areas = FIT_AREAS.map((area) => {
    const score = rand(55, 99);
    let status: "good" | "tight" | "loose" | "risk" = "good";
    let note = "Good fit";
    if (score < 65) { status = "risk"; note = "Potential restriction"; }
    else if (score < 75) { status = "tight"; note = "Slightly tight"; }
    else if (score > 95) { status = "loose"; note = "Slightly loose"; }
    return { area, score, status, note };
  });

  const overall = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);
  let label = "Standard Fit";
  if (overall >= 92) label = "Performance Fit";
  else if (overall >= 85) label = "Standard Fit";
  else if (overall >= 75) label = "Tight Fit";
  else if (overall >= 65) label = "Risk of Restriction";
  else label = "Relaxed Fit";

  return { overall, label, breakdown: areas };
}

function getStatusColor(status: string) {
  switch (status) {
    case "good": return "text-primary";
    case "tight": return "text-yellow-400";
    case "loose": return "text-secondary";
    case "risk": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function getScoreColor(score: number) {
  if (score >= 90) return "bg-primary/20 text-primary";
  if (score >= 75) return "bg-yellow-500/20 text-yellow-400";
  if (score >= 65) return "bg-orange-500/20 text-orange-400";
  return "bg-destructive/20 text-destructive";
}

/* ─── Component ─── */
const FitTesting = () => {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Step 1 – Athlete
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);

  // Step 2 – Garment (simplified: use existing uploaded garment)
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [garmentName, setGarmentName] = useState("");

  // Step 3 – Config
  const [testType, setTestType] = useState<string>("static");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M"]);
  const [selectedMovement, setSelectedMovement] = useState("Standing Neutral");
  const [bodyMeasurements, setBodyMeasurements] = useState({
    shoulder_width: 46,
    chest_width: 100,
    waist_size: 82,
    hip_width: 98,
    torso_length: 48,
    arm_length: 62,
    leg_length: 82,
  });

  // Step 4 – Results
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<FitResult[]>([]);
  const [activeResultTab, setActiveResultTab] = useState("0");

  // Load athletes
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: brands } = await supabase
        .from("brands")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      if (!brands?.length) return;
      const { data } = await supabase
        .from("athlete_profiles")
        .select("*")
        .eq("brand_id", brands[0].id);
      if (data) setAthletes(data as unknown as AthleteProfile[]);
    })();
  }, [user]);

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGarmentFile(file);
    setGarmentPreview(URL.createObjectURL(file));
    setGarmentName(file.name.replace(/\.[^/.]+$/, ""));
  };

  const canAdvance = useCallback(() => {
    if (step === 0) return !!selectedAthlete;
    if (step === 1) return !!garmentFile;
    if (step === 2) return selectedSizes.length > 0;
    return true;
  }, [step, selectedAthlete, garmentFile, selectedSizes]);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate fit analysis generation
    await new Promise((r) => setTimeout(r, 2000));

    const fitResults: FitResult[] = selectedSizes.map((size) => {
      const fitScore = generateFitScore(size, selectedMovement, testType);
      const issues: string[] = [];
      fitScore.breakdown.forEach((b) => {
        if (b.status === "risk") issues.push(`${b.area}: ${b.note}`);
        if (b.status === "tight") issues.push(`${b.area}: ${b.note}`);
      });
      return {
        size,
        imageUrl: garmentPreview,
        fitScore,
        issues,
      };
    });

    setResults(fitResults);
    setActiveResultTab("0");
    setGenerating(false);
    setStep(3);
    toast({ title: "Fit Analysis Complete", description: `${fitResults.length} size(s) analyzed.` });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("ActiveForge Fit Report", 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 33);

    let y = 45;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Athlete: ${selectedAthlete?.name || "—"}`, 20, y); y += 8;
    doc.text(`Garment: ${garmentName || "—"}`, 20, y); y += 8;
    doc.text(`Test Type: ${FIT_TEST_TYPES.find(t => t.id === testType)?.label || testType}`, 20, y); y += 8;
    doc.text(`Movement: ${selectedMovement}`, 20, y); y += 12;

    results.forEach((r) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text(`Size ${r.size} — ${r.fitScore.overall}% ${r.fitScore.label}`, 20, y); y += 8;

      doc.setFontSize(9);
      r.fitScore.breakdown.forEach((b) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(`${b.area}: ${b.score}% (${b.note})`, 25, y); y += 6;
      });

      if (r.issues.length) {
        y += 3;
        doc.setTextColor(200, 0, 0);
        doc.text("Issues:", 25, y); y += 6;
        r.issues.forEach((issue) => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(`• ${issue}`, 30, y); y += 6;
        });
        doc.setTextColor(0);
      }
      y += 10;
    });

    doc.save(`fit-report-${garmentName || "garment"}.pdf`);
    toast({ title: "PDF Exported", description: "Fit report downloaded." });
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Fit Testing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-production fit validation & analysis</p>
          </div>
          {/* Step indicator */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all ${
                  i === step ? "bg-primary text-primary-foreground" :
                  i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ─── STEP 0: Select Athlete ─── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-foreground mb-1">Select Athlete</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose a digital athlete for fit analysis.</p>

              {athletes.length === 0 ? (
                <Card className="border-dashed border-border">
                  <CardContent className="py-12 text-center">
                    <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No athletes found. Create one in the Athlete Library.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {athletes.map((a) => (
                    <Card
                      key={a.id}
                      className={`cursor-pointer transition-all hover:border-primary/40 ${
                        selectedAthlete?.id === a.id ? "border-primary ring-1 ring-primary/30" : "border-border"
                      }`}
                      onClick={() => setSelectedAthlete(a)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.gender} · {a.body_type}</p>
                          </div>
                          {selectedAthlete?.id === a.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <span>Height: {a.height_cm} cm</span>
                          <span>Weight: {a.weight_kg} kg</span>
                          <span>Muscle: {a.muscle_density}/10</span>
                          <span>Body fat: {a.body_fat_pct}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── STEP 1: Select Garment ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-foreground mb-1">Select Garment</h2>
              <p className="text-sm text-muted-foreground mb-6">Upload the garment to evaluate.</p>

              <Card className="border-dashed border-border">
                <CardContent className="py-12 text-center">
                  {garmentPreview ? (
                    <div className="space-y-4">
                      <img src={garmentPreview} alt="Garment" className="w-40 h-40 object-contain mx-auto rounded-xl bg-muted/30 p-2" />
                      <div>
                        <Label className="text-xs text-muted-foreground">Garment Name</Label>
                        <Input
                          value={garmentName}
                          onChange={(e) => setGarmentName(e.target.value)}
                          className="max-w-xs mx-auto mt-1 text-sm"
                          placeholder="e.g. Compression Shorts V2"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setGarmentFile(null); setGarmentPreview(null); }}>
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">Drop garment image or click to upload</p>
                      <input type="file" accept="image/*" className="hidden" onChange={handleGarmentUpload} />
                      <Button variant="outline" size="sm" asChild><span>Browse Files</span></Button>
                    </label>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── STEP 2: Test Configuration ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-foreground mb-1">Test Configuration</h2>
              <p className="text-sm text-muted-foreground mb-6">Configure the fit analysis parameters.</p>

              <div className="space-y-8">
                {/* Test Type */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Fit Test Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FIT_TEST_TYPES.map((t) => (
                      <Card
                        key={t.id}
                        className={`cursor-pointer transition-all hover:border-primary/40 ${
                          testType === t.id ? "border-primary ring-1 ring-primary/30" : "border-border"
                        }`}
                        onClick={() => setTestType(t.id)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            testType === t.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            <t.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Sizes to Test</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                      <Button
                        key={s}
                        variant={selectedSizes.includes(s) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSize(s)}
                        className="min-w-[56px]"
                      >
                        {s}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setSelectedSizes([...SIZES])}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                {/* Movement */}
                {(testType === "movement" || testType === "performance") && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Movement / Pose</Label>
                    <div className="flex flex-wrap gap-2">
                      {MOVEMENTS.map((m) => (
                        <Button
                          key={m}
                          variant={selectedMovement === m ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMovement(m)}
                        >
                          {m}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Measurements */}
                {testType === "measurement" && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Body Measurements (cm)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(bodyMeasurements).map(([key, val]) => (
                        <div key={key}>
                          <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</Label>
                          <Input
                            type="number"
                            value={val}
                            onChange={(e) => setBodyMeasurements((p) => ({ ...p, [key]: Number(e.target.value) }))}
                            className="mt-1 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || selectedSizes.length === 0}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing Fit...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> Run Fit Analysis</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Results ─── */}
          {step === 3 && results.length > 0 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Fit Analysis Results</h2>
                  <p className="text-sm text-muted-foreground">{results.length} size(s) · {selectedMovement} · {FIT_TEST_TYPES.find(t => t.id === testType)?.label}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Export PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setStep(2); setResults([]); }}>
                    New Test
                  </Button>
                </div>
              </div>

              {/* Multi-size comparison view */}
              {results.length > 1 && (
                <div className="mb-8">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Size Comparison Overview</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {results.map((r, i) => (
                      <Card
                        key={r.size}
                        className={`cursor-pointer transition-all hover:border-primary/40 ${
                          activeResultTab === String(i) ? "border-primary ring-1 ring-primary/30" : "border-border"
                        }`}
                        onClick={() => setActiveResultTab(String(i))}
                      >
                        <CardContent className="p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{r.size}</p>
                          <div className={`text-2xl font-black mt-1 ${r.fitScore.overall >= 85 ? "text-primary" : r.fitScore.overall >= 70 ? "text-yellow-400" : "text-destructive"}`}>
                            {r.fitScore.overall}%
                          </div>
                          <Badge variant="outline" className="mt-2 text-[10px]">{r.fitScore.label}</Badge>
                          {r.issues.length > 0 && (
                            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-destructive">
                              <AlertTriangle className="w-3 h-3" /> {r.issues.length} issue{r.issues.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed view */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                {results.length > 1 && (
                  <TabsList className="mb-4">
                    {results.map((r, i) => (
                      <TabsTrigger key={i} value={String(i)}>Size {r.size}</TabsTrigger>
                    ))}
                  </TabsList>
                )}

                {results.map((r, i) => (
                  <TabsContent key={i} value={String(i)}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Fit Score Card */}
                      <Card className="lg:col-span-1">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" /> Fit Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center py-4">
                            <div className={`text-5xl font-black ${r.fitScore.overall >= 85 ? "text-primary" : r.fitScore.overall >= 70 ? "text-yellow-400" : "text-destructive"}`}>
                              {r.fitScore.overall}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{r.fitScore.label}</p>
                            <Badge variant="outline" className="mt-2">Size {r.size}</Badge>
                          </div>

                          <div className="space-y-3">
                            {r.fitScore.breakdown.map((b) => (
                              <div key={b.area}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">{b.area}</span>
                                  <span className={getStatusColor(b.status)}>{b.score}%</span>
                                </div>
                                <Progress value={b.score} className="h-1.5" />
                                {b.status !== "good" && (
                                  <p className={`text-[10px] mt-0.5 ${getStatusColor(b.status)}`}>{b.note}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Issues & Recommendations */}
                      <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Fit Issues & Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {r.issues.length === 0 ? (
                            <div className="py-8 text-center">
                              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No fit issues detected for size {r.size}.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {r.issues.map((issue, j) => (
                                <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-foreground">{issue}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      Consider adjusting pattern for this area in size {r.size}.
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Area detail grid */}
                          <div className="mt-6">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Area Breakdown</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {r.fitScore.breakdown.map((b) => (
                                <div key={b.area} className={`rounded-lg p-3 text-center ${getScoreColor(b.score)}`}>
                                  <p className="text-lg font-bold">{b.score}%</p>
                                  <p className="text-[10px] font-medium mt-0.5">{b.area}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 2 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default FitTesting;
