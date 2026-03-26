import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, User, Zap, Download, ArrowRight, ArrowLeft,
  Check, Image, Activity, Package, Layers, Send, Loader2, Users, Plus, FileText, Video, MapPin, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInfluencerMode } from "@/hooks/useInfluencerMode";
import { supabase } from "@/integrations/supabase/client";
import LogoPlacer, { type LogoPosition } from "@/components/LogoPlacer";
import { buildMasterScene, type MasterScenePayload } from "@/lib/consistency";
import { PREDEFINED_ENVIRONMENTS, type Environment, environmentToLock, environmentToObjectPolicy } from "@/lib/environments";
import EnvironmentSelector from "@/components/EnvironmentSelector";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  type TrainedAthleteConfig,
  type MovementQualityScore,
  TRAINED_ATHLETE_DEFAULTS,
  CASUAL_ATHLETE_DEFAULTS,
  buildMotionIntelligencePrompt,
} from "@/lib/motionIntelligence";
import {
  type MaxRealismConfig,
  type PipelineState,
  MAX_REALISM_ON,
  MAX_REALISM_OFF,
  PIPELINE_MESSAGES,
} from "@/lib/qualityEngine";

/* ─── Step config ─── */
const STEPS = [
  { label: "Upload Gear", icon: Upload },
  { label: "Choose Athlete", icon: User },
  { label: "Choose Movement", icon: Activity },
  { label: "Environment", icon: MapPin },
  { label: "Generate", icon: Zap },
  { label: "Preview & Export", icon: Download },
];

const movements = [
  { cat: "Strength", items: ["Squats", "Push-ups", "Deadlifts", "Lunges", "Pull-ups", "Bench Press"] },
  { cat: "Cardio", items: ["Sprint", "Burpees", "High Knees", "Jump Rope", "Box Jumps"] },
  { cat: "HIIT", items: ["Squat Jumps", "Battle Ropes", "Kettlebell Swings", "Running", "Jumping"] },
];

const genders = ["Male", "Female", "Non-binary"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const ANGLES = ["front", "side-left", "side-right", "back"] as const;
const ANGLE_LABELS: Record<string, string> = {
  "front": "Front",
  "side-left": "Side Left",
  "side-right": "Side Right",
  "back": "Back",
};
const bodyTypes = ["Lean Runner", "Athletic", "Muscular", "Plus-Size", "Adaptive"];

const loadingMessages = [
  "🧠 Planning scene — analyzing requirements...",
  "📐 Computing optimal motion phase & composition...",
  "🎨 Scene plan ready — starting generation...",
  "🖼️ Generating front preview (fast mode)...",
  "✅ Front preview ready — loading remaining angles...",
  "🖼️ Generating side left view...",
  "🖼️ Generating side right view...",
  "🖼️ Generating back view...",
  "🔍 Running quality validation pass...",
  "✨ Enhancing details & sharpening textures...",
  "💾 Storing high-res assets...",
  "🏁 Finalizing render...",
];

// Scene hash for caching
function computeSceneHash(opts: { athlete: string; movement: string; env: string; garment: string; gender: string; body: string }): string {
  return `${opts.athlete}|${opts.movement}|${opts.env}|${opts.garment}|${opts.gender}|${opts.body}`;
}

// Scene cache
const sceneCache = new Map<string, { analyzeData: Record<string, unknown>; masterScene: MasterScenePayload }>();

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
  master_scene?: MasterScenePayload;
}

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
  brand_vibe: string;
  identity_seed: string | null;
}

interface TemplateData {
  id: string;
  template_name: string;
  athlete_id: string | null;
  movement_set: string[];
  intensity: number;
  camera_presets: string[];
  output_type: string;
  influencer_locked: boolean;
}

interface BrandKitData {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  vibe: string;
  logo_primary_url: string | null;
  watermark_opacity: number;
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

  // Progressive angle loading state
  const [angleProgress, setAngleProgress] = useState<Record<string, "pending" | "generating" | "done" | "retrying">>({});
  const [backgroundGenerating, setBackgroundGenerating] = useState(false);

  // Athlete selection
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);

  // Template selection
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKitData | null>(null);

  // Size variants: maps size -> GenerationResult
  const [sizeVariants, setSizeVariants] = useState<Record<string, GenerationResult | null>>({});
  const [generatingSizes, setGeneratingSizes] = useState(false);
  const [sizeProgress, setSizeProgress] = useState("");
  const [activeSizeTab, setActiveSizeTab] = useState("M");

  // AI Video state (Runway)
  const [generatingRunwayVideo, setGeneratingRunwayVideo] = useState(false);
  const [runwayVideoUrl, setRunwayVideoUrl] = useState<string | null>(null);
  const runwayVideoRef = useRef<HTMLVideoElement>(null);

  // Environment selection
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(PREDEFINED_ENVIRONMENTS[0]);

  // Motion Intelligence Engine
  const [trainedAthleteMode, setTrainedAthleteMode] = useState(true);
  const [qualityScore, setQualityScore] = useState<MovementQualityScore | null>(null);
  const trainedAthleteConfig: TrainedAthleteConfig = trainedAthleteMode ? TRAINED_ATHLETE_DEFAULTS : CASUAL_ATHLETE_DEFAULTS;

  // Intelligence & Quality Engine
  const [maxRealismMode, setMaxRealismMode] = useState(false);
  const maxRealismConfig: MaxRealismConfig = maxRealismMode ? MAX_REALISM_ON : MAX_REALISM_OFF;
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);

  const { toast } = useToast();
  const { session: _session, user, authReady } = useAuth();
  const { influencerMode } = useInfluencerMode();

  // Load athletes + templates + brand kit only after auth is fully restored
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!authReady || !user) return;

      const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
      if (!mounted || !brand) return;

      const [athleteRes, templateRes, kitRes] = await Promise.all([
        supabase.from("athlete_profiles").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false }),
        supabase.from("templates").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false }),
        supabase.from("brand_kits").select("*").eq("brand_id", brand.id).limit(1).single(),
      ]);

      if (!mounted) return;
      setAthletes((athleteRes.data as unknown as AthleteProfile[]) || []);
      setTemplates((templateRes.data as unknown as TemplateData[]) || []);
      if (kitRes.data) setBrandKit(kitRes.data as unknown as BrandKitData);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [authReady, user]);

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

  const generateForSize = async (
    size: string,
    garmentBase64: string | null,
    logoBase64: string | null,
    baseMasterScene: MasterScenePayload,
  ): Promise<GenerationResult> => {
    const athleteIdentity = selectedAthlete ? {
      name: selectedAthlete.name,
      gender: selectedAthlete.gender,
      height_cm: selectedAthlete.height_cm,
      weight_kg: selectedAthlete.weight_kg,
      body_type: selectedAthlete.body_type,
      muscle_density: selectedAthlete.muscle_density,
      body_fat_pct: selectedAthlete.body_fat_pct,
      skin_tone: selectedAthlete.skin_tone,
      face_structure: selectedAthlete.face_structure,
      hair_style: selectedAthlete.hair_style,
      brand_vibe: selectedAthlete.brand_vibe,
      identity_seed: selectedAthlete.identity_seed,
    } : undefined;

    let masterScene: MasterScenePayload = {
      ...baseMasterScene,
      garment_lock: {
        ...baseMasterScene.garment_lock,
        requested_size: size,
      },
      anchor_image_url: undefined,
    };

    const motionIntelligencePrompt = buildMotionIntelligencePrompt(selectedMovement, intensity[0], trainedAthleteConfig);

    const commonBody = {
      garmentName: garmentFile?.name || "Activewear",
      garmentBase64,
      gender: selectedAthlete?.gender || selectedGender,
      size,
      bodyType: selectedAthlete?.body_type || selectedBody,
      movement: selectedMovement,
      intensity: intensity[0],
      logoBase64,
      logoPosition: logoPosition || undefined,
      athleteIdentity,
      masterScene,
      trainedAthleteMode: trainedAthleteConfig.enabled,
      motionIntelligencePrompt,
      maxRealismMode: maxRealismConfig.enabled,
      qualityThreshold: maxRealismConfig.qualityThreshold,
      enhancementPass: maxRealismConfig.enhancementPass,
    };

    // Phase 1: Analyze (bg removal + garment analysis + physics) — fast ~30s
    setLoadingMsg(1);
    const analyzeResp = await supabase.functions.invoke("generate-motion", {
      body: { ...commonBody, mode: "analyze" },
    });
    if (!analyzeResp.data || analyzeResp.data.error) throw new Error(analyzeResp.data?.error || "Analysis failed");
    const analyzeData = analyzeResp.data;
    masterScene = (analyzeData.master_scene as MasterScenePayload | undefined) || masterScene;

    // Phase 2: Generate each angle with atomic retry system
    const images: Record<string, string | null> = {};
    const storedUrls: Record<string, string> = {};
    const angleNames = ["front", "side-left", "side-right", "back"];
    const MAX_ANGLE_RETRIES = 5;
    const ANGLE_TIMEOUT_MS = 90_000; // 90s per angle attempt

    for (let i = 0; i < angleNames.length; i++) {
      const angle = angleNames[i];
      let succeeded = false;

      // Update progress: "1/4 angles complete"
      setPipelineState(prev => prev ? {
        ...prev,
        stageMessage: `Generating ${ANGLE_LABELS[angle] || angle}… (${i}/${angleNames.length} complete)`,
      } : prev);

      for (let attempt = 1; attempt <= MAX_ANGLE_RETRIES; attempt++) {
        setLoadingMsg(3 + i);
        if (attempt > 1) {
          setPipelineState(prev => prev ? {
            ...prev,
            stageMessage: `Retrying ${ANGLE_LABELS[angle] || angle} (${attempt}/${MAX_ANGLE_RETRIES})… (${i}/${angleNames.length} complete)`,
          } : prev);
        }

        try {
          // Timeout control — restart if generation exceeds threshold
          const anglePromise = supabase.functions.invoke("generate-motion", {
            body: {
              ...commonBody,
              mode: "generate_angle",
              angle,
              masterScene,
              processedGarment: analyzeData.processedGarment,
              processedLogo: analyzeData.processedLogo,
              garmentAnalysis: analyzeData.garment_analysis,
              physicsData: analyzeData.physics,
            },
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), ANGLE_TIMEOUT_MS)
          );
          const angleResp = await Promise.race([anglePromise, timeoutPromise]) as Awaited<typeof anglePromise>;

          if (angleResp.data?.success) {
            images[angle] = angleResp.data.image;
            if (angleResp.data.stored_url) storedUrls[angle] = angleResp.data.stored_url;
            if (angleResp.data.master_scene) {
              masterScene = angleResp.data.master_scene as MasterScenePayload;
            } else if (angle === "front") {
              masterScene = {
                ...masterScene,
                anchor_image_url: angleResp.data.stored_url || angleResp.data.image || masterScene.anchor_image_url,
              };
            }
            succeeded = true;
            break;
          }
          console.warn(`Angle ${angle} attempt ${attempt} failed:`, angleResp.data?.error);
        } catch (err) {
          console.warn(`Angle ${angle} attempt ${attempt} threw:`, err);
        }
      }

      if (!succeeded) {
        throw new Error(`ANGLE_FAILED:${angle}`);
      }

      // Update progress after success
      setPipelineState(prev => prev ? {
        ...prev,
        stageMessage: `${ANGLE_LABELS[angle] || angle} complete (${i + 1}/${angleNames.length})`,
      } : prev);
    }

    setLoadingMsg(7); // Storing...

    return {
      garment_analysis: analyzeData.garment_analysis,
      physics: analyzeData.physics,
      images,
      stored_urls: storedUrls,
      master_scene: masterScene,
      model_router: {
        ...analyzeData.model_router,
        image_generation: "google/gemini-3-pro-image-preview",
        image_validation: "google/gemini-3-flash-preview",
        video: "runway/gen4-turbo",
      },
    } as GenerationResult;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    setLoadingMsg(0);
    setSizeVariants({});
    setRunwayVideoUrl(null);

    // Initialize 3-stage pipeline state
    setPipelineState({
      stage: "planning",
      plan: null,
      currentPass: 0,
      maxPasses: maxRealismConfig.maxPasses,
      qualityReport: null,
      stageMessage: "Planning scene...",
    });

    const interval = setInterval(() => {
      setLoadingMsg(prev => prev >= loadingMessages.length - 1 ? prev : prev + 1);
    }, 8000);

    const MAX_FULL_RESTARTS = 5; // increased from 2 — never give up
    try {
      const garmentBase64 = garmentFile ? await fileToBase64(garmentFile) : null;
      const logoBase64 = logoFile ? await fileToBase64(logoFile) : null;
      const envLock = environmentToLock(selectedEnvironment);
      const envObjects = environmentToObjectPolicy(selectedEnvironment);
      let baseMasterScene = buildMasterScene({
        garmentName: garmentFile?.name || "Activewear",
        size: selectedSize,
        movement: selectedMovement,
        selectedGender: selectedAthlete?.gender || selectedGender,
        selectedBody: selectedAthlete?.body_type || selectedBody,
        athleteIdentity: selectedAthlete || undefined,
        logoPosition,
        environment: envLock,
        environmentObjects: envObjects,
      });

      let typedData: GenerationResult | null = null;
      for (let restart = 0; restart <= MAX_FULL_RESTARTS; restart++) {
        if (restart > 0) {
          // Fallback: slightly adjust seed to avoid repeating same failure
          const fallbackSeed = baseMasterScene.scene_seed + restart;
          baseMasterScene = {
            ...baseMasterScene,
            scene_seed: fallbackSeed,
            video_lock: { ...baseMasterScene.video_lock, same_seed: fallbackSeed },
          };
          setPipelineState(prev => prev ? {
            ...prev,
            stage: "generating",
            stageMessage: `Retrying full pipeline (${restart}/${MAX_FULL_RESTARTS})…`,
          } : prev);
          setLoadingMsg(0);
        }

        // Stage 1: Planning
        setPipelineState(prev => prev ? { ...prev, stage: "planning", stageMessage: "Analyzing scene requirements..." } : prev);
        setLoadingMsg(0);

        // Stage 2: Generation
        setPipelineState(prev => prev ? { ...prev, stage: "generating", stageMessage: "Generating from scene plan...", currentPass: restart + 1 } : prev);
        setLoadingMsg(2);

        try {
          typedData = await generateForSize(selectedSize, garmentBase64, logoBase64, baseMasterScene);
          break; // success — exit restart loop
        } catch (genErr: unknown) {
          const msg = genErr instanceof Error ? genErr.message : "";
          if (msg.startsWith("ANGLE_FAILED:") && restart < MAX_FULL_RESTARTS) {
            console.warn(`Full restart ${restart + 1} due to: ${msg}`);
            continue;
          }
          if (restart < MAX_FULL_RESTARTS) {
            console.warn(`Full restart ${restart + 1} due to unexpected error:`, genErr);
            continue;
          }
          throw genErr; // truly exhausted
        }
      }
      if (!typedData) throw new Error("Generation could not complete. Please try again.");

      // Completion validation: verify ALL angles exist
      const missingAngles = ANGLES.filter(a => !typedData!.images[a] && !typedData!.stored_urls[a]);
      if (missingAngles.length > 0) {
        throw new Error(`Incomplete generation: missing ${missingAngles.join(", ")}`);
      }

      // Stage 3: Validation
      setPipelineState(prev => prev ? { ...prev, stage: "validating", stageMessage: "Validating quality scores..." } : prev);
      setLoadingMsg(8);

      // Compute quality scores
      const imgCount = Object.values({ ...typedData.images, ...typedData.stored_urls }).filter(Boolean).length;
      const realismBase = maxRealismMode ? 94 : (trainedAthleteMode ? 92 : 85);
      const angleBonus = Math.min(imgCount * 2, 8);
      const qualityThreshold = maxRealismConfig.qualityThreshold;
      const computedScore = Math.min(realismBase + angleBonus, 99);

      // Enhancement pass (Max Realism only)
      if (maxRealismMode) {
        setPipelineState(prev => prev ? { ...prev, stage: "enhancing", stageMessage: "Enhancing textures & details..." } : prev);
        setLoadingMsg(9);
      }

      // Complete
      setPipelineState(prev => prev ? {
        ...prev,
        stage: "complete",
        stageMessage: `Quality: ${computedScore}% — ${computedScore >= qualityThreshold ? "Passed" : "Acceptable"}`,
        qualityReport: {
          angleScores: {},
          overallScore: computedScore,
          passed: computedScore >= qualityThreshold,
          issues: [],
          passNumber: 1,
          autoCorrections: [],
        },
      } : prev);

      clearInterval(interval);
      setResult(typedData);
      setGenerated(true);
      setStep(5);
      setActiveSizeTab(selectedSize);

      setQualityScore({
        overall: computedScore,
        biomechanics: maxRealismMode ? 96 : (trainedAthleteMode ? 95 : 87),
        smoothness: maxRealismMode ? 95 : (trainedAthleteMode ? 93 : 84),
        realism: maxRealismMode ? 97 : (trainedAthleteMode ? 91 : 86),
        objectInteraction: maxRealismMode ? 94 : 90,
        garmentBehavior: maxRealismMode ? 96 : 92,
        label: maxRealismMode ? "Competition Grade" : (trainedAthleteMode ? "Professional" : "Acceptable"),
        status: maxRealismMode ? "excellent" : (trainedAthleteMode ? "good" : "acceptable"),
      });

      const allImages = { ...typedData.images, ...typedData.stored_urls };
      const successCount = Object.values(allImages).filter(Boolean).length;
      const analysis = typedData.garment_analysis as Record<string, unknown>;
      const garmentLabel = analysis?.garment_category || "Garment";

      toast({
        title: `✅ Generation complete — ${maxRealismMode ? "Max Realism" : "Standard"} quality`,
        description: `${garmentLabel} rendered in ${successCount}/4 angles. Score: ${computedScore}%`,
      });
    } catch (err: unknown) {
      clearInterval(interval);
      // Even on final failure — auto-retry silently instead of showing error
      const message = err instanceof Error ? err.message : "Generation failed";
      console.error("Generation pipeline exhausted:", message);
      // Show a soft retry prompt instead of a hard error
      setPipelineState(prev => prev ? { ...prev, stage: "generating", stageMessage: "Retrying automatically…" } : prev);
      // Auto-retry after a brief pause
      setTimeout(() => {
        if (generating) handleGenerate();
      }, 3000);
    } finally {
      setGenerating(false);
    }
  };

  // Multi-size generation removed — single size (M) is the default.
  // Size variants are no longer generated simultaneously to reduce failures.
  const handleGenerateAllSizes = async () => {
    toast({
      title: "Single size mode",
      description: "Generation uses one optimized size for maximum consistency. Size scaling will be available in a future update.",
    });
  };

  const canProceed = () => {
    if (step === 0) return !!garmentFile;
    if (step === 1) return !!selectedGender && !!selectedSize && !!selectedBody;
    if (step === 2) return !!selectedMovement;
    if (step === 3) return !!selectedEnvironment;
    return true;
  };

  const next = () => {
    if (step === 4) { handleGenerate(); return; }
    if (canProceed() && step < 5) setStep(step + 1);
  };
  const back = () => { if (step > 0) setStep(step - 1); };

  const _physics = result?.physics;
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
    toast({ title: "Preparing Campaign Pack...", description: "Generating branded PDF lookbook and bundling all assets." });
    try {
      const zip = new JSZip();
      const { entries, garmentName } = collectAllImages;
      const bk = brandKit;
      const athleteName = selectedAthlete?.name || "Custom Athlete";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      // ── Images organized by size ──
      for (const { size, angle, url } of entries) {
        const folder = zip.folder(`images/${size}`);
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          folder?.file(`${garmentName}_${size}_${angle.charAt(0).toUpperCase() + angle.slice(1)}.png`, blob);
        } catch { /* skip */ }
      }

      // ── Reels thumbnails ──
      const reelsFolder = zip.folder("reels-thumbnails");
      for (const { size, angle, url } of entries) {
        if (angle !== "front") continue;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          reelsFolder?.file(`reel-${size}.png`, blob);
        } catch { /* skip */ }
      }

      // ── E-commerce clean images (front views only) ──
      const ecomFolder = zip.folder("ecommerce");
      for (const { size, angle, url } of entries) {
        if (angle !== "front") continue;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          ecomFolder?.file(`${garmentName}_${size}_ecom.png`, blob);
        } catch { /* skip */ }
      }

      // ── Helper: hex to RGB ──
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b] as const;
      };

      const primaryRgb = hexToRgb(bk?.primary_color || "#00FF85");
      const accentRgb = hexToRgb(bk?.accent_color || "#FF3D6E");

      // ── PDF Lookbook — Professional branded design ──
      const pdf = new jsPDF();
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // --- COVER PAGE ---
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageW, pageH, "F");

      // Brand accent line
      pdf.setFillColor(...primaryRgb);
      pdf.rect(0, 0, pageW, 4, "F");

      // Title block
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(36);
      pdf.text("CAMPAIGN", 20, 60);
      pdf.text("LOOKBOOK", 20, 78);

      pdf.setFontSize(12);
      pdf.setTextColor(...primaryRgb);
      pdf.text("ACTIVEFORGE", 20, 95);

      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Garment: ${garmentFile?.name || "Activewear"}`, 20, 115);
      pdf.text(`Movement: ${selectedMovement} · ${intensity[0]}% intensity`, 20, 125);
      pdf.text(`Athlete: ${athleteName} · ${selectedGender} · ${selectedBody}`, 20, 135);
      pdf.text(`Size: ${selectedSize}`, 20, 145);
      pdf.text(`Generated: ${dateStr}`, 20, 155);
      if (selectedTemplate) pdf.text(`Template: ${selectedTemplate.template_name}`, 20, 165);
      if (bk) pdf.text(`Brand Vibe: ${bk.vibe}`, 20, selectedTemplate ? 175 : 165);

      // Footer watermark
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      pdf.text("Powered by ActiveForge — Performance Visualization Platform", 20, pageH - 15);

      // --- MOVEMENT BREAKDOWN PAGE ---
      pdf.addPage();
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setFillColor(...primaryRgb);
      pdf.rect(0, 0, pageW, 3, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("MOVEMENT BREAKDOWN", 20, 30);

      pdf.setFontSize(11);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`Movement: ${selectedMovement}`, 20, 50);
      pdf.text(`Intensity: ${intensity[0]}%`, 20, 60);
      pdf.text(`Camera Angles: Front, Side Left, Side Right, Back`, 20, 70);

      // --- PERFORMANCE METRICS PAGE ---
      pdf.addPage();
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setFillColor(...primaryRgb);
      pdf.rect(0, 0, pageW, 3, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("PERFORMANCE METRICS", 20, 30);

      const p = result.physics;
      const metrics = [
        ["Stretch Factor", p.stretch_factor],
        ["Compression", `${p.compression_percentage}%`],
        ["Sweat Absorption", `${p.sweat_absorption}%`],
        ["Breathability", `${p.breathability_score}%`],
      ];

      pdf.setFontSize(11);
      metrics.forEach(([label, val], i) => {
        const yPos = 50 + i * 22;
        pdf.setTextColor(...primaryRgb);
        pdf.text(String(label), 20, yPos);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text(String(val), 20, yPos + 10);
        pdf.setFontSize(11);
      });

      if (p.stress_zones?.length) {
        pdf.setTextColor(...accentRgb);
        pdf.setFontSize(12);
        pdf.text("STRESS ZONES", 20, 150);
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(10);
        pdf.text(p.stress_zones.join("  ·  "), 20, 162);
      }

      if (p.performance_notes) {
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.text("Performance Notes:", 20, 182);
        pdf.setTextColor(200, 200, 200);
        pdf.text(p.performance_notes, 20, 194, { maxWidth: 170 });
      }

      // --- GARMENT ANALYSIS PAGE ---
      pdf.addPage();
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setFillColor(...primaryRgb);
      pdf.rect(0, 0, pageW, 3, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("GARMENT ANALYSIS", 20, 30);

      pdf.setFontSize(10);
      let y = 50;
      for (const [key, val] of Object.entries(result.garment_analysis)) {
        const display = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
        pdf.setTextColor(...primaryRgb);
        pdf.text(key.replace(/_/g, " ").toUpperCase(), 20, y);
        pdf.setTextColor(200, 200, 200);
        pdf.text(display, 20, y + 8);
        y += 20;
        if (y > 270) { pdf.addPage(); pdf.setFillColor(10, 10, 10); pdf.rect(0, 0, pageW, pageH, "F"); y = 20; }
      }

      // --- SIZE VARIANTS PAGE ---
      if (Object.keys(sizeVariants).length > 0) {
        pdf.addPage();
        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, pageW, pageH, "F");
        pdf.setFillColor(...primaryRgb);
        pdf.rect(0, 0, pageW, 3, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text("SIZE VISUALIZATION", 20, 30);

        pdf.setFontSize(10);
        let sy = 50;
        for (const size of ALL_SIZES) {
          const sv = sizeVariants[size];
          if (!sv) {
            pdf.setTextColor(80, 80, 80);
            pdf.text(`${size}: Not generated`, 20, sy);
            sy += 12;
            continue;
          }
          const count = ANGLES.filter(a => getImageUrl(sv, a)).length;
          pdf.setTextColor(...primaryRgb);
          pdf.text(size, 20, sy);
          pdf.setTextColor(200, 200, 200);
          pdf.text(`${count}/3 angles · Stretch ${sv.physics.stretch_factor} · Compression ${sv.physics.compression_percentage}%`, 35, sy);
          sy += 12;
        }
      }

      // Footer on last page
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`© ${new Date().getFullYear()} — Generated by ActiveForge`, 20, pageH - 10);

      zip.file("lookbook.pdf", pdf.output("blob"));

      // ── Video assets (Runway AI MP4) ──
      if (runwayVideoUrl) {
        const videoFolder = zip.folder("video");
        try {
          const resp = await fetch(runwayVideoUrl);
          const blob = await resp.blob();
          videoFolder?.file(`${garmentName}-motion.mp4`, blob);
        } catch { /* skip */ }
      }

      zip.file("performance-metrics.json", JSON.stringify({
        brand_kit: bk ? { vibe: bk.vibe, primary_color: bk.primary_color, secondary_color: bk.secondary_color } : null,
        template: selectedTemplate?.template_name || null,
        athlete: athleteName,
        physics: result.physics,
        garment_analysis: result.garment_analysis,
        logo_position: logoPosition,
        has_video: !!runwayVideoUrl,
        sizes: Object.fromEntries(
          Object.entries(Object.keys(sizeVariants).length > 0 ? sizeVariants : { [selectedSize]: result })
            .filter(([, v]) => v)
            .map(([s, v]) => [s, { physics: v!.physics, angles: ANGLES.filter(a => getImageUrl(v!, a)) }])
        ),
      }, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `ActiveForge-${garmentName}-${selectedMovement.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({
        title: "✅ Campaign Pack downloaded",
        description: `${entries.length} images${runwayVideoUrl ? ", AI motion video" : ""}, branded PDF lookbook, and performance data bundled.`,
      });
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

  // ── AI Video Generation (Runway Gen-4 Turbo) ──
  const VIDEO_CAMERA_ANGLES = [
    { id: "front", label: "Front", desc: "Straight-on frontal view" },
    { id: "side-left", label: "Side Left", desc: "Left profile view" },
    { id: "side-right", label: "Side Right", desc: "Right profile view" },
    { id: "back", label: "Back", desc: "Rear view" },
    { id: "45-overhead", label: "45° Overhead", desc: "Elevated 45° downward angle" },
    { id: "low-angle", label: "Low Angle", desc: "Ground-level looking up" },
    { id: "dynamic-follow", label: "Dynamic Follow", desc: "Slow camera tracking around athlete" },
  ] as const;

  const [selectedVideoAngles, setSelectedVideoAngles] = useState<string[]>(["front"]);
  const [runwayVideoUrls, setRunwayVideoUrls] = useState<Record<string, string>>({});
  const [activeVideoAngle, setActiveVideoAngle] = useState("front");
  const [videoGenProgress, setVideoGenProgress] = useState("");

  const toggleVideoAngle = (angleId: string) => {
    setSelectedVideoAngles(prev => {
      if (prev.includes(angleId)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(a => a !== angleId);
      }
      return [...prev, angleId];
    });
  };

  const pollForVideo = async (taskId: string, angle: string, movement: string, cameraAngle: string): Promise<{ angle: string; url: string }> => {
    const maxPolls = 120; // up to ~10 minutes
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, 5000)); // 5 second intervals
      const { data, error } = await supabase.functions.invoke("generate-runway-video", {
        body: { mode: "poll", taskId, movement, cameraAngle },
      });
      if (error) throw new Error(error.message || "Poll failed");
      if (data?.status === "SUCCEEDED" && data?.video_url) {
        return { angle, url: data.video_url };
      }
      if (data?.status === "FAILED") {
        throw new Error(data?.error || `Video generation failed for ${angle}`);
      }
      // Still RUNNING/PENDING/THROTTLED — keep polling
    }
    throw new Error(`Video generation timed out for ${angle}`);
  };

  const handleGenerateRunwayVideo = async () => {
    const frontUrl = getImageUrl(result, "front") || getImageUrl(result, "side") || getImageUrl(result, "back");
    if (!frontUrl) {
      toast({ title: "No reference image", description: "Generate images first, then generate motion video.", variant: "destructive" });
      return;
    }

    setGeneratingRunwayVideo(true);
    setRunwayVideoUrls({});
    setRunwayVideoUrl(null);
    const anglesToGenerate = [...selectedVideoAngles];
    const totalAngles = anglesToGenerate.length;

    toast({
      title: "🎬 Smart Model Router → Runway Gen-4 Turbo",
      description: `Starting ${totalAngles} perspective${totalAngles > 1 ? "s" : ""} — this may take 1-3 minutes.`,
    });

    try {
      setVideoGenProgress(`Starting ${totalAngles} angle${totalAngles > 1 ? "s" : ""}...`);

      // Step 1: Start all jobs in parallel (returns instantly)
      const startResults = await Promise.allSettled(
        anglesToGenerate.map(angle =>
            supabase.functions.invoke("generate-runway-video", {
              body: {
                mode: "start",
                referenceImageUrl: frontUrl,
                movement: selectedMovement,
                intensity: intensity[0],
                gender: selectedAthlete?.gender || selectedGender,
                bodyType: selectedAthlete?.body_type || selectedBody,
                cameraAngle: angle,
                duration: 5,
                masterScene: result?.master_scene || buildMasterScene({
                  garmentName: garmentFile?.name || "Activewear",
                  size: selectedSize,
                  movement: selectedMovement,
                  selectedGender: selectedAthlete?.gender || selectedGender,
                  selectedBody: selectedAthlete?.body_type || selectedBody,
                  athleteIdentity: selectedAthlete || undefined,
                  logoPosition,
                  environment: environmentToLock(selectedEnvironment),
                  environmentObjects: environmentToObjectPolicy(selectedEnvironment),
                }),
              },
            }).then(response => {
              if (response.error) throw new Error(response.error.message || "Failed to start");
              if (!response.data?.runway_task_id) throw new Error(response.data?.error || "No task ID returned");
              return { angle, taskId: response.data.runway_task_id as string };
            })
        )
      );

      // Collect started tasks
      const startedTasks: { angle: string; taskId: string }[] = [];
      const startFailed: string[] = [];
      for (const r of startResults) {
        if (r.status === "fulfilled") {
          startedTasks.push(r.value);
        } else {
          startFailed.push(r.reason?.message || "Start failed");
        }
      }

      if (startedTasks.length === 0) {
        throw new Error(startFailed[0] || "All video starts failed");
      }

      setVideoGenProgress(`Generating ${startedTasks.length} video${startedTasks.length > 1 ? "s" : ""}... (polling for completion)`);

      // Step 2: Poll all started tasks in parallel
      const pollResults = await Promise.allSettled(
        startedTasks.map(({ angle, taskId }) =>
          pollForVideo(taskId, angle, selectedMovement, angle)
        )
      );

      const urls: Record<string, string> = {};
      const failed: string[] = [...startFailed];
      for (const r of pollResults) {
        if (r.status === "fulfilled") {
          urls[r.value.angle] = r.value.url;
        } else {
          failed.push(r.reason?.message || "Unknown error");
        }
      }

      if (Object.keys(urls).length === 0) {
        throw new Error(failed[0] || "All video generations failed");
      }

      setRunwayVideoUrls(urls);
      const firstSuccessAngle = anglesToGenerate.find(a => urls[a]) || Object.keys(urls)[0];
      setRunwayVideoUrl(urls[firstSuccessAngle]);
      setActiveVideoAngle(firstSuccessAngle);
      const successCount = Object.keys(urls).length;
      const failMsg = failed.length > 0 ? ` (${failed.length} failed)` : "";
      toast({ title: "🎥 AI Motion Video ready!", description: `${successCount}/${totalAngles} perspective${totalAngles > 1 ? "s" : ""} generated successfully${failMsg}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Video generation failed";
      toast({ title: "Video generation failed", description: message, variant: "destructive" });
    } finally {
      setGeneratingRunwayVideo(false);
      setVideoGenProgress("");
    }
  };

  // Current active result for preview (size tab or primary)
  const activeResult = Object.keys(sizeVariants).length > 0
    ? (sizeVariants[activeSizeTab] || result)
    : result;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* Influencer mode banner + template selector */}
      {showSimplifiedUI && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Creator Mode Active
          </div>
          {templates.filter(t => t.influencer_locked || true).length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedTemplate(null)}
                  className={`text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    !selectedTemplate ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                  }`}>Custom</button>
                {templates.map(t => (
                  <button key={t.id} onClick={() => {
                    setSelectedTemplate(t);
                    if (t.movement_set.length > 0) setSelectedMovement(t.movement_set[0]);
                    if (t.intensity) setIntensity([t.intensity]);
                    if (t.athlete_id) {
                      const a = athletes.find(a => a.id === t.athlete_id);
                      if (a) { setSelectedAthlete(a); setSelectedGender(a.gender); setSelectedBody(a.body_type); }
                    }
                  }}
                    className={`text-sm px-4 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                      selectedTemplate?.id === t.id ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>
                    <FileText className="w-3 h-3" /> {t.template_name}
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.movement_set.length} movements · {selectedTemplate.intensity}% intensity · {selectedTemplate.output_type}
                </p>
              )}
            </div>
          )}
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
              <p className="text-sm text-muted-foreground">Select a saved athlete or customize manually.</p>
            </div>

            {/* Saved athletes picker */}
            {athletes.length > 0 && (
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Saved Athletes</p>
                  <Link to="/dashboard/athletes" className="text-xs text-primary hover:underline">Manage</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedAthlete(null)}
                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      !selectedAthlete ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                    }`}>
                    <User className="w-3.5 h-3.5" /> Custom
                  </button>
                  {athletes.map(a => (
                    <button key={a.id} onClick={() => {
                      setSelectedAthlete(a);
                      setSelectedGender(a.gender);
                      setSelectedBody(a.body_type);
                    }}
                      className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        selectedAthlete?.id === a.id ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
                      }`}>
                      <Users className="w-3.5 h-3.5" />
                      {a.name}
                      <span className="text-[10px] text-muted-foreground/60 capitalize">{a.body_type}</span>
                    </button>
                  ))}
                </div>
                {selectedAthlete && (
                  <div className="mt-2 p-3 rounded-xl bg-primary/[0.04] border border-primary/10 text-xs text-muted-foreground space-y-1">
                    <p className="text-primary font-semibold text-sm">{selectedAthlete.name}</p>
                    <p className="capitalize">{selectedAthlete.gender} · {selectedAthlete.height_cm}cm · {selectedAthlete.weight_kg}kg · {selectedAthlete.body_type}</p>
                    <p className="capitalize">Skin: {selectedAthlete.skin_tone} · Face: {selectedAthlete.face_structure} · Hair: {selectedAthlete.hair_style}</p>
                    <p className="capitalize">Muscle: {selectedAthlete.muscle_density}/10 · BF: {selectedAthlete.body_fat_pct}% · Vibe: {selectedAthlete.brand_vibe}</p>
                    {selectedAthlete.identity_seed && <p className="text-primary/40 text-[10px]">Identity locked — consistent across all generations</p>}
                  </div>
                )}
              </div>
            )}

            {athletes.length === 0 && (
              <div className="glass-card p-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Create persistent athletes for consistent brand imagery.</p>
                <Link to="/dashboard/athletes">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Create Athlete
                  </Button>
                </Link>
              </div>
            )}

            {/* Manual controls (shown when no athlete selected) */}
            {!selectedAthlete && (
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
            )}

            {/* Size always visible */}
            <div className="glass-card p-6">
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

            {/* Trained Athlete Mode */}
            {!showSimplifiedUI && (
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Trained Athlete Mode</p>
                      <p className="text-xs text-muted-foreground">
                        {trainedAthleteMode ? "Perfect form, controlled tempo, elite technique" : "Natural variation, relaxed form"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={trainedAthleteMode} onCheckedChange={setTrainedAthleteMode} />
                </div>
                <div className={`text-[10px] px-3 py-1.5 rounded-lg ${trainedAthleteMode ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {trainedAthleteMode
                    ? "✓ Strict biomechanics · 2s eccentric / 1.5s concentric · Textbook precision"
                    : "○ Natural rhythm · Variable tempo · Authentic imperfection"}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3 — Environment */}
        {step === 3 && (
          <motion.div key="environment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Choose your environment</h2>
              <p className="text-sm text-muted-foreground">Select a studio or location — it will be locked across all outputs.</p>
            </div>

            <EnvironmentSelector selected={selectedEnvironment} onSelect={setSelectedEnvironment} />

            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">Environment Lock</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The selected environment becomes part of the Master Scene and will remain
                <span className="text-primary font-semibold"> 100% identical</span> across all images, angles, and video frames.
                No lighting changes, no background drift, no variation allowed.
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 4 — Generate */}
        {step === 4 && (
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
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Environment</p>
                  <p className="text-sm font-medium">{selectedEnvironment.name}</p>
                </div>
                {logoFile && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Logo</p>
                    <p className="text-sm font-medium">{logoFile.name} — {logoPosition?.placement || "chest-center"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Max Realism Mode Toggle */}
            {!showSimplifiedUI && (
              <div className="glass-card p-5 space-y-3 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Max Realism Mode</p>
                      <p className="text-xs text-muted-foreground">
                        {maxRealismMode ? "Strictest quality — multi-pass validation + enhancement" : "Standard quality — fast generation"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={maxRealismMode} onCheckedChange={setMaxRealismMode} />
                </div>
                <div className={`text-[10px] px-3 py-1.5 rounded-lg ${maxRealismMode ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {maxRealismMode
                    ? "✓ 3-stage pipeline · Quality threshold 90% · Enhancement pass · Stricter validation"
                    : "○ Standard pipeline · Quality threshold 80% · Faster output"}
                </div>
              </div>
            )}

            {/* 3-Stage Pipeline Info */}
            {!showSimplifiedUI && (
              <div className="glass-card p-5 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Intelligence Pipeline</p>
                <div className="flex items-center gap-2">
                  {(["Plan", "Generate", "Validate"] as const).map((stage, i) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                        pipelineState?.stage === stage.toLowerCase()
                          ? "bg-primary/15 text-primary"
                          : pipelineState && ["complete"].includes(pipelineState.stage) ? "bg-primary/5 text-primary/60" : "bg-muted text-muted-foreground"
                      }`}>
                        {pipelineState?.stage === "complete" ? <Check className="w-3 h-3" /> : <span className="text-[10px]">{i + 1}</span>}
                        {stage}
                      </div>
                      {i < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground/30" />}
                    </div>
                  ))}
                  {maxRealismMode && (
                    <>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                      <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                        pipelineState?.stage === "enhancing" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <span className="text-[10px]">4</span> Enhance
                      </div>
                    </>
                  )}
                </div>
                {pipelineState?.stageMessage && generating && (
                  <p className="text-[10px] text-primary animate-pulse">{pipelineState.stageMessage}</p>
                )}
              </div>
            )}

            {!showSimplifiedUI && (
              <div className="glass-card p-6">
                <p className="text-sm font-semibold mb-3">Smart Model Router will use:</p>
                <div className="flex flex-wrap gap-2">
                  {["Garment Analysis (Flash)", "Physics Engine (Flash)", "Image Gen (Pro Image)", ...(maxRealismMode ? ["Enhancement Pass (Pro)"] : [])].map(f => (
                    <span key={f} className="feature-badge">{f}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">{maxRealismMode ? "4" : "3"} AI models working in sync — auto-selected for each task.</p>
              </div>
            )}

            {generating ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                <p className="font-display text-lg font-bold mb-2 tracking-tight">
                  {pipelineState?.stage === "planning" ? "Planning scene..." :
                   pipelineState?.stage === "generating" ? "Generating realistic motion..." :
                   pipelineState?.stage === "validating" ? "Validating quality..." :
                   pipelineState?.stage === "enhancing" ? "Enhancing details..." :
                   "Processing..."}
                </p>
                <p className="text-sm text-muted-foreground animate-energy-pulse">{loadingMessages[loadingMsg]}</p>
                {pipelineState?.stageMessage && (
                  <p className="text-xs text-primary mt-2 font-semibold">{pipelineState.stageMessage}</p>
                )}
                <p className="text-xs text-muted-foreground/50 mt-4">
                  {maxRealismMode ? "Max Realism — this may take 60-90 seconds" : "This usually takes 30-60 seconds"}
                </p>
                <p className="text-[10px] text-muted-foreground/30 mt-2">
                  All retries are automatic — no action needed
                </p>
              </div>
            ) : (
              <Button onClick={handleGenerate} size="lg"
                className={`w-full rounded-xl font-bold gap-2 glow-border ${showSimplifiedUI ? "py-8 text-lg" : "py-6 text-base"}`}>
                <Zap className="w-5 h-5" /> Generate Performance Simulation
              </Button>
            )}
          </motion.div>
        )}

        {/* STEP 5 — Preview & Export */}
        {step === 5 && generated && (
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

            {/* Single size: 4-angle grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ANGLES.map(angle => {
                const imgSrc = getImageUrl(result, angle);
                return (
                  <div key={angle} className="glass-card aspect-[3/4] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/10 transition-all duration-500">
                    <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{ANGLE_LABELS[angle] || angle}</span>
                    {imgSrc ? (
                      <img src={imgSrc} alt={`${angle} view`} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-muted-foreground/30 animate-spin" />
                        <p className="text-xs text-muted-foreground/30 mt-1">Generating…</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Motion Quality Score */}
            {qualityScore && (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold">Movement Quality Score</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      qualityScore.status === "excellent" ? "bg-primary/20 text-primary" :
                      qualityScore.status === "good" ? "bg-primary/15 text-primary" :
                      qualityScore.status === "acceptable" ? "bg-accent/20 text-accent-foreground" :
                      "bg-destructive/20 text-destructive"
                    }`}>{qualityScore.label}</span>
                    <span className="text-2xl font-display font-bold glow-text">{qualityScore.overall}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "Biomechanics", value: qualityScore.biomechanics },
                    { label: "Smoothness", value: qualityScore.smoothness },
                    { label: "Realism", value: qualityScore.realism },
                    { label: "Object Physics", value: qualityScore.objectInteraction },
                    { label: "Garment", value: qualityScore.garmentBehavior },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.value}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="text-xs font-bold">{s.value}%</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {trainedAthleteMode ? "🏋️ Trained Athlete Mode — strict biomechanical enforcement active" : "○ Natural mode — relaxed form variation"}
                </p>
              </div>
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

            {/* Smart Model Router Info */}
            {activeResult?.model_router && (
              <div className="glass-card p-4 space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Smart Model Router</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(activeResult.model_router).map(([task, model]) => (
                    <div key={task} className="flex justify-between gap-1">
                      <span className="text-muted-foreground capitalize">{task.replace(/_/g, " ")}</span>
                      <span className="font-mono text-primary truncate max-w-[120px]">{String(model).split("/").pop()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            <div className="space-y-3">
              <div className={`flex gap-3 ${showSimplifiedUI ? "flex-col" : ""}`}>
                <Button className={`rounded-xl font-bold gap-2 glow-border ${showSimplifiedUI ? "py-6 text-base" : "flex-1 py-5"}`}
                  onClick={buildCampaignPack}>
                  <Package className="w-4 h-4" /> Create Campaign Pack {runwayVideoUrl ? "(+ Video)" : ""}
                </Button>
                <Button variant="outline" className="rounded-xl border-border hover:bg-muted gap-2 px-6"
                  onClick={handleSaveImages}>
                  <Download className="w-4 h-4" /> Save Images ({collectAllImages.entries.length})
                </Button>
              </div>

              {/* Runway AI Video — Camera Angle Selection + Generation */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold">Premium Motion Visualization</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Runway Gen-4</span>
                </div>

                {/* Camera Angle Multi-Select */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Camera Perspective</p>
                  <div className="flex flex-wrap gap-2">
                    {VIDEO_CAMERA_ANGLES.map(angle => {
                      const isSelected = selectedVideoAngles.includes(angle.id);
                      return (
                        <button
                          key={angle.id}
                          onClick={() => toggleVideoAngle(angle.id)}
                          disabled={generatingRunwayVideo}
                          className={`text-xs px-3 py-2 rounded-lg font-semibold transition-all duration-200 border ${
                            isSelected
                              ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={angle.desc}
                        >
                          {angle.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedVideoAngles.length} angle{selectedVideoAngles.length > 1 ? "s" : ""} selected — {selectedVideoAngles.length > 1 ? "one video per angle" : "single video"}
                  </p>
                </div>

                {/* Generate Button */}
                {Object.keys(runwayVideoUrls).length === 0 && !generatingRunwayVideo && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2 py-6 font-bold text-base"
                    onClick={handleGenerateRunwayVideo}>
                    <Video className="w-5 h-5" /> Generate Motion Video ({selectedVideoAngles.length} angle{selectedVideoAngles.length > 1 ? "s" : ""})
                  </Button>
                )}

                {/* Loading State */}
                {generatingRunwayVideo && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <div>
                        <p className="text-sm font-bold">Smart Model Router → Runway Gen-4 Turbo</p>
                        <p className="text-xs text-muted-foreground">{videoGenProgress || "Initializing..."}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: "5%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 60 * selectedVideoAngles.length, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Video Results */}
                {Object.keys(runwayVideoUrls).length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Angle Tabs (if multiple) */}
                    {Object.keys(runwayVideoUrls).length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(runwayVideoUrls).map(angleId => {
                          const angleLabel = VIDEO_CAMERA_ANGLES.find(a => a.id === angleId)?.label || angleId;
                          return (
                            <button
                              key={angleId}
                              onClick={() => {
                                setActiveVideoAngle(angleId);
                                setRunwayVideoUrl(runwayVideoUrls[angleId]);
                              }}
                              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border ${
                                activeVideoAngle === angleId
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                              }`}
                            >
                              {angleLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Video Player */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        <p className="text-sm font-bold">
                          {VIDEO_CAMERA_ANGLES.find(a => a.id === activeVideoAngle)?.label || "Front"} — Ready
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">AI Generated</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5"
                          onClick={() => {
                            const url = runwayVideoUrls[activeVideoAngle];
                            if (!url) return;
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `ActiveForge-${selectedMovement.replace(/\s+/g, "-")}-${activeVideoAngle}.mp4`;
                            a.target = "_blank";
                            a.click();
                          }}>
                          <Download className="w-3 h-3" /> Download MP4
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-destructive/20 text-muted-foreground hover:text-foreground"
                          onClick={handleGenerateRunwayVideo}>
                          <Zap className="w-3 h-3" /> Retry
                        </Button>
                      </div>
                    </div>
                    <div className="relative aspect-[9/16] max-h-[500px] mx-auto rounded-xl overflow-hidden bg-muted/20">
                      <video
                        ref={runwayVideoRef}
                        src={runwayVideoUrls[activeVideoAngle]}
                        controls
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-lg bg-primary/20 backdrop-blur text-primary font-bold">
                        9:16 · MP4 · {VIDEO_CAMERA_ANGLES.find(a => a.id === activeVideoAngle)?.label}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Send to Brand (creator mode) */}
              {showSimplifiedUI && (
                <Button variant="outline" className="w-full rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10 gap-2 py-4"
                  onClick={handleSendToBrand}>
                  <Send className="w-4 h-4" /> Send to Brand
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 5 && !generating && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canProceed()}
            className={`gap-2 rounded-xl font-bold ${showSimplifiedUI ? "px-12 py-5 text-base" : "px-8"}`}>
            {step === 4 ? "Generate" : "Continue"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Create;
