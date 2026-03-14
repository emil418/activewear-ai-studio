import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

/**
 * Dedicated video frame generation edge function.
 * Generates 10 micro-pose keyframes for smooth motion synthesis.
 * Each frame represents a ~10% increment in the movement cycle.
 */

function extractImageFromResponse(choice: Record<string, unknown>): string | null {
  if (choice?.images && Array.isArray(choice.images)) {
    for (const img of choice.images) {
      if (img?.image_url?.url) return img.image_url.url;
    }
  }
  if (choice?.content && Array.isArray(choice.content)) {
    for (const part of (choice.content as Array<Record<string, unknown>>)) {
      if (part.type === "image_url" && (part.image_url as Record<string, string>)?.url) {
        return (part.image_url as Record<string, string>).url;
      }
    }
  }
  return null;
}

interface MovementPhase {
  pct: number;
  pose: string;
  muscleState: string;
  fabricState: string;
  jointAngles: string;
  weightShift: string;
}

// Biomechanical phase definitions for exercises
interface MotionPhaseDef {
  position: string;
  joints: string;
  weight: string;
}

interface ExerciseMotionDef {
  start: MotionPhaseDef;
  mid: MotionPhaseDef;
  peak: MotionPhaseDef;
  sceneRules: string[];
  fabricCue: string;
}

const EXERCISE_DEFS: Record<string, ExerciseMotionDef> = {
  "squats": {
    start: { position: "Standing upright, feet shoulder-width, arms at sides", joints: "Knees straight 180°, hips neutral", weight: "Centered on both feet" },
    mid: { position: "Bending knees and hips, lowering body, torso slightly forward", joints: "Knees 120°, hips 110°", weight: "Shifting to heels" },
    peak: { position: "Deep squat, thighs parallel, upright torso", joints: "Knees 75°, hips 70°", weight: "Deep into heels" },
    sceneRules: ["No equipment", "Full body visible", "Both feet on ground"],
    fabricCue: "Leggings stretch at quads and glutes, compression at knee crease",
  },
  "pull-ups": {
    start: { position: "Hanging from horizontal bar above, arms fully extended, body vertical, feet behind body", joints: "Shoulders extended, elbows straight 180°", weight: "Hanging from hands, suspended" },
    mid: { position: "Pulling body upward, elbows bending, chest approaching bar, body vertical", joints: "Elbows 110°, shoulders adducting", weight: "Pulling upward through grip" },
    peak: { position: "Chin above bar, elbows bent, shoulders engaged, body controlled", joints: "Elbows 45°, shoulders contracted", weight: "Suspended at top" },
    sceneRules: ["Bar ABOVE athlete", "Athlete hangs BELOW bar", "Bar NEVER behind neck", "Body NEVER standing on floor", "Full body visible including hanging feet"],
    fabricCue: "Back shirt stretches showing lat engagement, sleeves compress around biceps at top",
  },
  "push-ups": {
    start: { position: "High plank, arms extended, body straight line head to heels", joints: "Elbows straight, wrists under shoulders", weight: "Hands and toes" },
    mid: { position: "Lowering chest toward ground, elbows bending, core tight", joints: "Elbows 90°, shoulders engaged", weight: "Shifting forward" },
    peak: { position: "Chest near floor, body rigid and straight", joints: "Elbows 45-60°, shoulders loaded", weight: "On hands and toes" },
    sceneRules: ["On floor level", "No bench", "Full body visible in profile", "Straight body line"],
    fabricCue: "Shirt stretches across upper back, compresses at chest",
  },
  "deadlifts": {
    start: { position: "Hinging forward at hips, flat back, hands toward shins", joints: "Hips 80°, knees 130°", weight: "Mid-foot" },
    mid: { position: "Torso at 45°, back flat, arms hanging", joints: "Hips 100°, knees 140°", weight: "Mid-foot to heels" },
    peak: { position: "Full lockout, standing tall, glutes squeezed", joints: "Knees 180°, hips 180°", weight: "Centered" },
    sceneRules: ["No barbell", "No weights", "Bodyweight hip hinge only", "Full body visible"],
    fabricCue: "Fabric stretches at hamstrings and lower back during hinge",
  },
  "lunges": {
    start: { position: "Standing upright, feet hip-width", joints: "Knees straight, hips neutral", weight: "Centered" },
    mid: { position: "One leg forward, both knees bending", joints: "Front knee 110°, back knee 120°", weight: "Split between feet" },
    peak: { position: "Deep lunge, front thigh parallel, back knee near ground", joints: "Front knee 90°, back knee 90°", weight: "60% front, 40% back" },
    sceneRules: ["No equipment", "Full body visible", "Feet on ground"],
    fabricCue: "Stretch at front quad and back hip flexor, compression at bent knee",
  },
  "burpees": {
    start: { position: "Standing upright", joints: "Neutral standing", weight: "Centered" },
    mid: { position: "Plank position, body straight, arms extended", joints: "Shoulders over wrists", weight: "Hands and toes" },
    peak: { position: "Explosive jump, arms overhead, body extended", joints: "Full extension, arms overhead", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body with headroom"],
    fabricCue: "Maximum fabric dynamics through all phases",
  },
  "high knees": {
    start: { position: "Standing tall, arms ready", joints: "Neutral", weight: "Centered" },
    mid: { position: "One knee driving toward chest, opposite arm pumping", joints: "Knee 90° hip flexion", weight: "Single-leg" },
    peak: { position: "Knee at chest height, rapid alternation", joints: "Maximum hip flexion", weight: "Alternating" },
    sceneRules: ["No equipment", "Standing in place", "Full body visible"],
    fabricCue: "Leggings stretch at hip, shirt bounces with movement",
  },
  "sprint": {
    start: { position: "Standing, slight forward lean", joints: "Neutral", weight: "Balls of feet" },
    mid: { position: "Sprinting in place, knee high, arm pumping", joints: "Drive knee 90°, elbow 90°", weight: "Single-leg" },
    peak: { position: "Maximum knee drive, explosive stride", joints: "Max knee height", weight: "Single-leg power" },
    sceneRules: ["In place", "No treadmill", "Full body visible"],
    fabricCue: "Intense fabric ripple with explosive strides",
  },
  "bench press": {
    start: { position: "Athlete lying flat on a weight bench, feet flat on floor, hands gripping barbell above chest at full arm extension, shoulder blades pinched together", joints: "Elbows locked out, wrists stacked over elbows", weight: "Bar supported at full extension above chest" },
    mid: { position: "Lowering barbell with control toward lower chest, elbows at 45° angle, athlete lying on bench", joints: "Elbows 90°, shoulders externally rotated, deep pec stretch", weight: "Bar descending under control to chest" },
    peak: { position: "Explosive press upward, driving barbell off chest, arms extending fully, athlete still lying flat on bench", joints: "Full elbow extension, chest contracted, bar stable overhead", weight: "Pressing through palms, driving weight upward" },
    sceneRules: ["Weight bench MUST be visible underneath athlete", "Barbell MUST be visible in hands", "Athlete MUST be lying on back on bench", "NEVER standing", "NEVER in plank or push-up position", "Feet flat on floor"],
    fabricCue: "Shirt stretches across chest during press, fabric tightens at shoulders under load",
  },
};

function getMovementPhases(movement: string, intensity: number): MovementPhase[] {
  const intensityLabel = intensity > 70 ? "explosive" : intensity > 40 ? "controlled" : "slow and deliberate";

  // Find matching exercise definition
  const movementKey = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[movementKey];

  if (def) {
    // Build phases from the 3-phase biomechanical definition
    const sceneStr = def.sceneRules.join(". ");
    const phases: MovementPhase[] = [
      { pct: 0, pose: `START: ${def.start.position}`, muscleState: "relaxed, ready to engage", fabricState: "fabric resting naturally", jointAngles: def.start.joints, weightShift: def.start.weight },
      { pct: 10, pose: `Transitioning from start toward mid movement`, muscleState: "muscles beginning to activate", fabricState: "slight fabric tension beginning", jointAngles: "joints beginning to flex", weightShift: "weight beginning to shift" },
      { pct: 25, pose: `Approaching mid movement: ${def.mid.position}`, muscleState: "primary muscle groups engaging", fabricState: `${def.fabricCue} beginning`, jointAngles: def.mid.joints, weightShift: def.mid.weight },
      { pct: 40, pose: `MID: ${def.mid.position}`, muscleState: "strong muscle contraction", fabricState: def.fabricCue, jointAngles: def.mid.joints, weightShift: def.mid.weight },
      { pct: 60, pose: `Transitioning from mid toward peak position`, muscleState: "near-maximum engagement", fabricState: `${def.fabricCue}, intensifying`, jointAngles: "joints deepening toward peak angles", weightShift: "weight committed to movement" },
      { pct: 80, pose: `PEAK: ${def.peak.position}`, muscleState: "maximum contraction, peak tension", fabricState: `Maximum: ${def.fabricCue}`, jointAngles: def.peak.joints, weightShift: def.peak.weight },
      { pct: 90, pose: `Beginning controlled return from peak`, muscleState: "controlled return, muscles still engaged", fabricState: "fabric beginning to release", jointAngles: "joints beginning to extend from peak", weightShift: "weight reversing direction" },
      { pct: 65, pose: `Returning through mid-range: ${def.mid.position}`, muscleState: "sustained engagement during return", fabricState: "fabric recovering", jointAngles: def.mid.joints, weightShift: def.mid.weight },
      { pct: 30, pose: `Nearing return to start position`, muscleState: "muscles decelerating", fabricState: "fabric mostly relaxed", jointAngles: "joints approaching neutral", weightShift: "weight nearly centered" },
      { pct: 5, pose: `Returning to: ${def.start.position}`, muscleState: "muscles settling", fabricState: "fabric at rest", jointAngles: def.start.joints, weightShift: def.start.weight },
    ];
    return phases.map(p => ({
      ...p,
      pose: `${p.pose} (${intensityLabel} pace). SCENE: ${sceneStr}`,
    }));
  }

  // Default phases for unmapped movements
  const defaultPhases: MovementPhase[] = [
    { pct: 0, pose: `starting position for ${movement}, body ready`, muscleState: "relaxed, ready to engage", fabricState: "fabric resting naturally", jointAngles: "neutral standing position", weightShift: "weight centered" },
    { pct: 10, pose: `beginning ${movement}, initial body engagement`, muscleState: "muscles beginning to activate", fabricState: "very slight fabric movement", jointAngles: "joints beginning to flex", weightShift: "weight beginning to shift" },
    { pct: 25, pose: `early phase of ${movement}, clear body motion`, muscleState: "primary muscle groups engaging", fabricState: "noticeable stretch at active joints", jointAngles: "moderate joint flexion", weightShift: "weight shifting toward direction of movement" },
    { pct: 40, pose: `mid-phase of ${movement}, significant body displacement`, muscleState: "strong muscle contraction", fabricState: "fabric stretching at tension zones", jointAngles: "significant joint angles", weightShift: "weight committed to movement" },
    { pct: 60, pose: `approaching peak of ${movement}`, muscleState: "near-maximum muscle engagement", fabricState: "heavy fabric stretch and compression", jointAngles: "deep joint angles approaching maximum", weightShift: "weight at maximum displacement" },
    { pct: 80, pose: `peak of ${movement}, maximum exertion`, muscleState: "maximum contraction, peak tension", fabricState: "maximum fabric deformation, visible tension lines", jointAngles: "maximum joint flexion for movement", weightShift: "weight at extreme of movement" },
    { pct: 90, pose: `beginning return from peak ${movement}`, muscleState: "explosive or controlled return", fabricState: "fabric beginning to release", jointAngles: "joints beginning to extend", weightShift: "weight reversing direction" },
    { pct: 65, pose: `returning through mid-range of ${movement}`, muscleState: "sustained muscle engagement during return", fabricState: "fabric recovering", jointAngles: "joints extending", weightShift: "weight returning to center" },
    { pct: 30, pose: `nearing end of ${movement} cycle`, muscleState: "muscles decelerating", fabricState: "fabric mostly recovered", jointAngles: "joints approaching neutral", weightShift: "weight nearly centered" },
    { pct: 5, pose: `completing ${movement}, returning to start`, muscleState: "muscles settling", fabricState: "fabric at rest", jointAngles: "near-neutral position", weightShift: "weight centered" },
  ];

  return defaultPhases.map(p => ({
    ...p,
    pose: `${p.pose} (${intensityLabel} pace). No equipment, bodyweight only.`,
  }));
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      garmentBase64,
      garmentName,
      movement,
      intensity,
      gender,
      size,
      bodyType,
      athleteIdentity,
      cameraStyle,  // "static" | "slow_tracking"
      referenceImageUrl, // URL of generated front image to use as identity/garment reference
    } = await req.json();

    const allPhases = getMovementPhases(movement, intensity);
    // Pick 6 evenly-spaced phases from the 10 available
    const phaseIndices = [0, 2, 4, 6, 8, 9];
    const phases = phaseIndices.map(i => allPhases[i]);
    const FRAME_COUNT = phases.length;
    const cameraLabel = cameraStyle === "slow_tracking"
      ? "Very slow, subtle cinematic tracking — camera drifts imperceptibly during the movement"
      : "Completely static camera, locked tripod, zero camera movement";

    const athleteLabel = athleteIdentity
      ? `EXACT ATHLETE IDENTITY (must be IDENTICAL in every frame):
- Gender: ${athleteIdentity.gender}
- Build: ${athleteIdentity.body_type}
- Height: ${athleteIdentity.height_cm}cm, Weight: ${athleteIdentity.weight_kg}kg
- Skin tone: ${athleteIdentity.skin_tone}
- Face: ${athleteIdentity.face_structure}
- Hair: ${athleteIdentity.hair_style}
- Muscle density: ${athleteIdentity.muscle_density}/10
- Body fat: ${athleteIdentity.body_fat_pct}%
- Identity seed: ${athleteIdentity.identity_seed || "locked"}`
      : `ATHLETE: ${gender} athlete, ${bodyType} build, size ${size}`;

    console.log(`VIDEO GEN: Generating ${FRAME_COUNT} micro-pose frames for "${movement}" at ${intensity}% intensity`);

    const frameUrls: string[] = [];
    const framePhaseLabels: string[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const phase = phases[i];
      console.log(`Frame ${i + 1}/${FRAME_COUNT}: ${phase.pct}% movement progression`);

      const hasReference = !!referenceImageUrl;
      const framePrompt = `MOTION SEQUENCE FRAME ${i + 1} of ${FRAME_COUNT} — CONTINUOUS ATHLETIC MOVEMENT

This is one frame in a smooth, continuous motion sequence. Every frame must look like it belongs to a single unbroken video of an athlete performing "${movement}".

${hasReference ? `CRITICAL REFERENCE IMAGE: A reference image of this EXACT athlete wearing this EXACT garment is provided. You MUST match:
- The athlete's face, skin tone, body shape, hair EXACTLY as shown in the reference
- The garment's exact color, pattern, logo placement, fabric texture, and design details
- The lighting style and studio environment from the reference
- This is the ground truth — every frame must look like the same person in the same clothes` : ""}

${athleteLabel}

POSE (frame ${i + 1}):
${phase.pose}

MUSCLE STATE: ${phase.muscleState}
JOINT POSITIONS: ${phase.jointAngles}
WEIGHT DISTRIBUTION: ${phase.weightShift}

GARMENT BEHAVIOR:
The athlete is wearing the uploaded activewear garment.
Fabric state: ${phase.fabricState}
- Fabric must react physically to the body's position
- Stretch and compression must be anatomically accurate
- Seams, logos, and details must remain intact and undistorted

CAMERA: ${cameraLabel}
LIGHTING: Consistent clean studio lighting throughout the entire sequence. Professional sportswear campaign quality.
FORMAT: Full body, head to toe, 9:16 vertical portrait (1080x1920)
BACKGROUND: Dark studio, matte black or deep charcoal

CRITICAL IDENTITY RULES:
- The athlete's face, body, skin, hair must be IDENTICAL to all other frames${hasReference ? " AND to the reference image" : ""}
- ONLY the pose changes between frames — identity NEVER changes
- If this frame were placed next to any other frame, the person must be unmistakably the same individual
- Natural anatomical proportions must be maintained throughout
- The garment must be the EXACT same garment in every frame — same color, same logo, same design

DO NOT include: text, watermarks, UI elements, other people, props, barbells, dumbbells, gym equipment of any kind`;

      const contentParts: Array<Record<string, unknown>> = [
        { type: "text", text: framePrompt },
      ];
      // Include reference image first (strongest conditioning signal)
      if (referenceImageUrl) {
        contentParts.push({ type: "image_url", image_url: { url: referenceImageUrl } });
      }
      if (garmentBase64 && garmentBase64.startsWith("data:")) {
        contentParts.push({ type: "image_url", image_url: { url: garmentBase64 } });
      }

      let frameUrl: string | null = null;
      let attempts = 0;
      while (attempts < 3 && !frameUrl) {
        attempts++;
        try {
          const resp = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: IMAGE_MODEL,
              modalities: ["image", "text"],
              messages: [{ role: "user", content: contentParts }],
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            frameUrl = extractImageFromResponse(data.choices?.[0]?.message);
          } else {
            console.error(`Frame ${i + 1} attempt ${attempts}: HTTP ${resp.status}`);
            const errText = await resp.text();
            console.error(errText);
          }
        } catch (e) {
          console.error(`Frame ${i + 1} attempt ${attempts} error:`, e);
        }
        if (!frameUrl && attempts < 3) await new Promise(r => setTimeout(r, 2000));
      }

      // Store to Supabase storage
      if (frameUrl && frameUrl.startsWith("data:")) {
        try {
          const base64Data = frameUrl.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/motion_${Date.now()}_frame_${i}.png`;
          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
            frameUrls.push(urlData.publicUrl);
          } else {
            console.error(`Frame ${i + 1} upload error:`, uploadError);
          }
        } catch (e) {
          console.error(`Frame ${i + 1} storage error:`, e);
        }
      } else if (frameUrl) {
        frameUrls.push(frameUrl);
      }

      framePhaseLabels.push(`${phase.pct}% — ${phase.pose.split("(")[0].trim()}`);

      // Delay between frames to avoid rate limiting
      if (i < FRAME_COUNT - 1) await new Promise(r => setTimeout(r, 1000));
    }

    // Log usage
    const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
    if (brand) {
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        brand_id: brand.id,
        action: "generate_motion_video",
        credits_used: 3,
        metadata: { movement, intensity, gender, size, bodyType, frame_count: frameUrls.length, camera: cameraStyle || "static" },
      });
    }

    console.log(`VIDEO GEN complete: ${frameUrls.length}/${FRAME_COUNT} frames generated`);

    return new Response(
      JSON.stringify({
        success: true,
        frame_count: frameUrls.length,
        total_requested: FRAME_COUNT,
        frame_urls: frameUrls,
        phase_labels: framePhaseLabels,
        movement,
        intensity,
        camera_style: cameraStyle || "static",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Video generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
