import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  buildConsistencyValidationPrompt,
  describeMasterSceneCompact,
  normalizeMasterScene,
  type MasterScenePayload,
} from "../_shared/consistency.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ── Smart Model Router — best model per task ──
// Planning/reasoning uses the strongest model for accurate scene blueprints.
// Preview uses the fastest image model for instant feedback.
// Quality uses the highest fidelity image model for the master scene.
// Validation uses a fast text model to avoid blocking.
const MODEL_ROUTER = {
  // Stage 1: Planning — strongest reasoning for scene blueprint + motion planning
  blueprint: "google/gemini-2.5-pro",
  // Stage 1: Analysis — fast text model for garment classification
  analyze: "google/gemini-3-flash-preview",
  // Stage 2: Fast preview — fastest image model for instant front preview
  generate_image_fast: "google/gemini-3.1-flash-image-preview",
  // Stage 3: Final master + multi-angle — highest quality image model
  generate_image_quality: "google/gemini-3-pro-image-preview",
  // Stage 1: Physics — lightweight text model for fabric physics
  describe_physics: "google/gemini-2.5-flash",
  // Pre-processing: background removal — fast image model
  remove_bg: "google/gemini-3.1-flash-image-preview",
  // Stage 4: Validation — fast text model for quality checks
  validate_image: "google/gemini-3-flash-preview",
  // Fallback: when quality model fails, downgrade to fast model
  fallback_image: "google/gemini-3.1-flash-image-preview",
} as const;

// Model info for transparency (returned to client)
function getModelRouterInfo(fast: boolean) {
  return {
    planning: MODEL_ROUTER.blueprint,
    analysis: MODEL_ROUTER.analyze,
    physics: MODEL_ROUTER.describe_physics,
    background_removal: MODEL_ROUTER.remove_bg,
    preview_image: MODEL_ROUTER.generate_image_fast,
    quality_image: MODEL_ROUTER.generate_image_quality,
    fallback_image: MODEL_ROUTER.fallback_image,
    validation: MODEL_ROUTER.validate_image,
    active_image_model: fast ? MODEL_ROUTER.generate_image_fast : MODEL_ROUTER.generate_image_quality,
    video: "runway/gen4-turbo",
  };
}

// ── Scene Lock Preamble — injected into EVERY generation prompt ──
const SCENE_LOCK_PREAMBLE = `CAMERA RENDERING SYSTEM — STRICT SCENE LOCK ENGINE

CORE RULE: You are NOT generating independent images.
You are rendering the SAME FROZEN SCENE from a different camera position.

This is a MULTI-CAMERA PRODUCTION SHOOT. All cameras fire at THE EXACT SAME MILLISECOND.
The scene is FROZEN IN TIME. Nothing moves. Nothing changes. Only the camera rotates.

HARD LOCKS (VIOLATION = IMMEDIATE REJECTION):
- ENVIRONMENT LOCK: Same background, floor, depth, props. Zero variation.
- LIGHTING LOCK: Same direction, shadows, exposure, color temperature. Zero variation.
- IDENTITY LOCK: Same face, body proportions, skin tone, hair style, hair color. Zero variation.
- GARMENT LOCK: Same clothing type, fit, wrinkles, textures, colors. Zero variation.
- MOTION LOCK: Same EXACT body position, joint angles, weight distribution. Zero variation.
- OBJECT LOCK: Same position, size, shape, color of all objects. Zero variation.

THE ONLY THING THAT CHANGES IS THE CAMERA POSITION.`;

// ── Motion Realism Preamble ──
const MOTION_REALISM_PREAMBLE = `BIOMECHANICAL ACCURACY (NON-NEGOTIABLE):
- Every joint at a physically possible angle — no hyperextension
- Spine maintains neutral or naturally loaded curve
- Limb proportions CONSTANT — muscle engagement anatomically correct
- Center of gravity physically plausible
- Head-to-body ratio realistic (~1:7.5)
- Weight-bearing limbs show appropriate tension and ground contact
- Pose looks like a FREEZE-FRAME from real video
- Hair, clothing respond to movement direction
- All objects and body parts obey gravity`;

// ── Exercise Definitions (compact) ──
interface MotionPhase {
  position: string;
  joints: string;
  weight: string;
  spine: string;
  balance: string;
}

interface ExerciseMotionDef {
  start: MotionPhase;
  mid: MotionPhase;
  peak: MotionPhase;
  sceneRules: string[];
  camera: string;
  fabricCue: string;
  bodyConstraints: string[];
  objectPhysics: string[];
  movementFlow: string;
}

const EXERCISE_DEFS: Record<string, ExerciseMotionDef> = {
  "squats": {
    start: { position: "Standing upright, feet shoulder-width", joints: "Knees 180°, hips neutral", weight: "Centered", spine: "Neutral", balance: "Even" },
    mid: { position: "Bending knees/hips, lowering", joints: "Knees 120°, hips 110°", weight: "Heels", spine: "Slight lean, neutral", balance: "Posterior" },
    peak: { position: "Deep squat, thighs parallel, arms forward", joints: "Knees 75°, hips 70°", weight: "Deep in heels", spine: "Neutral maintained", balance: "Counterbalanced" },
    sceneRules: ["Both feet flat", "No equipment", "Full body head to toe"],
    camera: "WIDE full-body, head to toe, slight low angle",
    fabricCue: "Leggings stretch at quads/glutes, compression at knee",
    bodyConstraints: ["Knees track over toes", "Heels flat", "Hip crease below knee at peak"],
    objectPhysics: [],
    movementFlow: "Controlled descent, pause at depth, powerful drive up",
  },
  "push-ups": {
    start: { position: "High plank, arms extended", joints: "Elbows straight, wrists under shoulders", weight: "Hands and toes", spine: "Straight", balance: "Shoulder-width" },
    mid: { position: "Lowering chest, elbows bending", joints: "Elbows 90°", weight: "Shifting forward", spine: "Rigid plank", balance: "One unit" },
    peak: { position: "Chest near floor, body rigid", joints: "Elbows 45-60° from torso", weight: "Chest 2-3in from floor", spine: "Plank integrity", balance: "Max anterior tension" },
    sceneRules: ["Body on floor level", "No bench", "Full body head to toes"],
    camera: "WIDE full-body from low side angle",
    fabricCue: "Shirt stretches across upper back/shoulders",
    bodyConstraints: ["Body ONE STRAIGHT LINE", "Elbows tuck 45°", "Head neutral"],
    objectPhysics: [],
    movementFlow: "Controlled lower, explosive press to lockout",
  },
  "deadlifts": {
    start: { position: "Standing behind barbell, hinging, flat back", joints: "Hips 80°, knees 130°", weight: "Mid-foot, hamstrings", spine: "FLAT back", balance: "Shoulders ahead of bar" },
    mid: { position: "Pulling bar off ground, close to shins", joints: "Hips/knees extending together", weight: "Posterior chain", spine: "Back angle unchanged", balance: "Bar vertical close to body" },
    peak: { position: "Full lockout, standing tall, bar at hips", joints: "Knees 180°, hips 180°", weight: "Centered", spine: "Erect, shoulders retracted", balance: "Standing, bar balanced" },
    sceneRules: ["Barbell visible", "WIDE full-body head to toe"],
    camera: "WIDE full-body from 30° side",
    fabricCue: "Fabric stretches at hamstrings/lower back",
    bodyConstraints: ["FLAT BACK non-negotiable", "Bar straight vertical line", "Hips/knees extend simultaneously"],
    objectPhysics: ["Barbell shows weight — bar flex", "Plates symmetric"],
    movementFlow: "Powerful pull, hip snap to lockout, controlled descent",
  },
  "lunges": {
    start: { position: "Standing upright, hip-width", joints: "Knees straight, hips neutral", weight: "Centered", spine: "Tall", balance: "Bilateral" },
    mid: { position: "One leg forward, both knees bending", joints: "Front 110°, back 120°", weight: "Split", spine: "Vertical", balance: "60/40" },
    peak: { position: "Deep lunge, front thigh parallel", joints: "Front 90°, back 90°", weight: "60% front, 40% back", spine: "Vertical", balance: "Hip-width" },
    sceneRules: ["No equipment", "Full body head to toe"],
    camera: "WIDE full-body, head to toe",
    fabricCue: "Stretch at front quad and back hip flexor",
    bodyConstraints: ["Front knee tracks over ankle", "Back knee descends straight", "Torso VERTICAL"],
    objectPhysics: [],
    movementFlow: "Controlled step, smooth descent, powerful drive back",
  },
  "pull-ups": {
    start: { position: "Hanging from bar, arms extended, body vertical", joints: "Shoulders extended, elbows 180°", weight: "Hanging", spine: "Slight hollow", balance: "Dead hang" },
    mid: { position: "Pulling up, chest approaching bar", joints: "Elbows 110°", weight: "Pulling up", spine: "Slight thoracic extension", balance: "Controlled vertical" },
    peak: { position: "Chin above bar, elbows bent", joints: "Elbows 45°, shoulders contracted", weight: "Suspended at top", spine: "Proud chest", balance: "Peak hold" },
    sceneRules: ["Pull-up bar ABOVE", "Athlete BELOW bar", "Bar NEVER behind neck", "Body NEVER on floor", "Full body bar to feet"],
    camera: "WIDE vertical showing bar top and feet bottom",
    fabricCue: "Back shirt stretches showing lats",
    bodyConstraints: ["Arms pull VERTICALLY", "Body vertical", "Grip overhand, wider than shoulders"],
    objectPhysics: ["Bar FIXED, horizontal, rigid", "Bar high enough for extension"],
    movementFlow: "Dead hang, shoulder depression, smooth pull, chin-over-bar",
  },
  "bench press": {
    start: { position: "Lying flat on bench, feet on floor, bar extended", joints: "Elbows locked, wrists stacked", weight: "Bar extended", spine: "Natural arch, blades pinched", balance: "Five-point" },
    mid: { position: "Lowering bar to chest, elbows 45°", joints: "Elbows 90°", weight: "Bar descending", spine: "Arch maintained", balance: "Feet driving" },
    peak: { position: "Explosive press, arms extending, lying on bench", joints: "Full extension", weight: "Pressing through palms", spine: "Arch maintained", balance: "Five-point" },
    sceneRules: ["Bench visible underneath", "Barbell visible, NEVER cut off", "Athlete LYING on back", "NEVER standing", "Feet flat"],
    camera: "WIDE full-body from side showing entire athlete on bench",
    fabricCue: "Shirt stretches across chest",
    bodyConstraints: ["Athlete LYING HORIZONTALLY", "Elbows 45°", "Bar touches lower chest"],
    objectPhysics: ["Bar flex under load", "Bench flat and stable"],
    movementFlow: "Controlled unrack, slow descent, explosive drive",
  },
  "sprint": {
    start: { position: "Standing, slight forward lean", joints: "Neutral", weight: "Balls of feet", spine: "Slight lean", balance: "Athletic ready" },
    mid: { position: "One knee driving high, opposite arm pumping", joints: "Drive knee 90° hip flexion", weight: "Single-leg", spine: "Slight lean", balance: "Contralateral" },
    peak: { position: "Max knee drive, explosive arm pump", joints: "Knee max height", weight: "Explosive single-leg", spine: "Forward 15-20°", balance: "Dynamic single-leg" },
    sceneRules: ["Running in place", "No treadmill", "Full body head to toe"],
    camera: "WIDE full-body, head to toe",
    fabricCue: "Intense fabric ripple with each stride",
    bodyConstraints: ["Contralateral arm-leg", "Arms pump forward-back, NOT across midline"],
    objectPhysics: [],
    movementFlow: "Explosive rhythmic alternation with hip drive",
  },
  "burpees": {
    start: { position: "Standing upright", joints: "Neutral", weight: "Centered", spine: "Tall", balance: "Bilateral" },
    mid: { position: "In plank, body straight", joints: "Shoulders over wrists", weight: "Hands/toes", spine: "Perfect plank", balance: "Four-point" },
    peak: { position: "Explosive jump, arms overhead", joints: "Full triple extension", weight: "Airborne", spine: "Extended", balance: "Airborne aligned" },
    sceneRules: ["No equipment", "Full body with headroom"],
    camera: "WIDE full-body from slight side with headroom",
    fabricCue: "Maximum fabric dynamics",
    bodyConstraints: ["Plank: straight line", "Jump: triple extension", "Landing: soft knees"],
    objectPhysics: [],
    movementFlow: "Standing → squat → plank → push-up → squat → jump",
  },
  "high knees": {
    start: { position: "Standing tall, arms 90°", joints: "Neutral, elbows 90°", weight: "Balls of feet", spine: "Tall", balance: "Athletic" },
    mid: { position: "One knee driving up, opposite arm pumping", joints: "Knee 90° hip flexion", weight: "Single-leg", spine: "Vertical", balance: "Alternating" },
    peak: { position: "Knee at chest height, rapid alternation", joints: "Max hip flexion", weight: "Quick alternating", spine: "Upright", balance: "Fast rhythmic" },
    sceneRules: ["No equipment", "Standing in place", "Full body head to toe"],
    camera: "WIDE full-body, head to toe",
    fabricCue: "Leggings stretch at hip, shirt bounces",
    bodyConstraints: ["Torso UPRIGHT", "Contralateral arm-leg"],
    objectPhysics: [],
    movementFlow: "Fast rhythmic alternating knee drives",
  },
  "box jumps": {
    start: { position: "Athletic quarter squat facing box", joints: "Knees 130°, hips 120°", weight: "Balls of feet", spine: "Slight lean", balance: "Weight in legs" },
    mid: { position: "Explosive triple extension, launching", joints: "Full extension then tuck", weight: "Airborne", spine: "Extending", balance: "Aimed at box" },
    peak: { position: "Landing softly on box, then standing", joints: "Knees 100° on landing", weight: "Soft landing", spine: "Absorbing", balance: "Stable on box" },
    sceneRules: ["Plyometric box visible", "WIDE with headroom"],
    camera: "WIDE full-body from side, head to toe including box",
    fabricCue: "Stretch during loading, compression on landing",
    bodyConstraints: ["Full triple extension before feet leave ground", "Soft landing", "Feet simultaneous"],
    objectPhysics: ["Box SOLID and stable", "Box knee-to-hip height"],
    movementFlow: "Countermovement → extension → tuck → soft landing → stand",
  },
  "squat jumps": {
    start: { position: "Deep squat, arms back", joints: "Knees 75°", weight: "Deep in heels", spine: "Neutral, slight lean", balance: "Loaded" },
    mid: { position: "Exploding upward", joints: "Rapidly extending", weight: "Driving through feet", spine: "Extending", balance: "Transitioning airborne" },
    peak: { position: "Fully airborne, extended, arms up", joints: "Triple extension, toes pointed", weight: "Airborne", spine: "Fully extended", balance: "Aligned" },
    sceneRules: ["No equipment", "Full body with headroom"],
    camera: "WIDE full-body with headroom",
    fabricCue: "Max stretch at bottom, stretch during jump",
    bodyConstraints: ["Full depth before jump", "Triple extension drives jump"],
    objectPhysics: [],
    movementFlow: "Deep squat → explosive extension → max height → soft landing",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, hips hinged, KB between legs", joints: "Hips 80°, knees slightly bent", weight: "Posterior, heels", spine: "FLAT back", balance: "Weight in hips" },
    mid: { position: "Explosive hip drive, KB rising", joints: "Hips extending rapidly", weight: "Driving through heels", spine: "Extending", balance: "Hip momentum" },
    peak: { position: "Standing tall, KB at chest height", joints: "Full hip extension, arms shoulder height", weight: "Centered, KB floating", spine: "Erect, glutes locked", balance: "Standing" },
    sceneRules: ["Kettlebell visible, NEVER cut off", "WIDE full-body head to toe"],
    camera: "WIDE full-body from slight side",
    fabricCue: "Dramatic fabric movement",
    bodyConstraints: ["HIP HINGE not squat", "Arms PASSIVE", "Flat back ALWAYS"],
    objectPhysics: ["KB smooth pendulum arc", "Realistic weight"],
    movementFlow: "Backswing hinge → hip snap → float at top → controlled fall",
  },
  "jump rope": {
    start: { position: "Standing tall, holding rope", joints: "Elbows 90° close to ribs", weight: "Balls of feet", spine: "Tall", balance: "Light" },
    mid: { position: "Rope rotating, small bounces", joints: "Ankles extending each hop", weight: "1-2 inch bounces", spine: "Stable", balance: "Rhythmic" },
    peak: { position: "Fast rhythmic jumping", joints: "Rapid ankle bounces, fast wrist", weight: "Light rhythmic", spine: "Still upper body", balance: "Efficient rhythm" },
    sceneRules: ["Jump rope visible", "WIDE with rope space"],
    camera: "WIDE full-body, head to toe with rope arc",
    fabricCue: "Shirt bounces with each hop",
    bodyConstraints: ["Arms close to body", "Jumps SMALL 1-2in", "Upper body STILL"],
    objectPhysics: ["Rope smooth arc", "Handles at hip height"],
    movementFlow: "Light rhythmic bouncing with wrist-driven rotation",
  },
  "running": {
    start: { position: "Standing, slight forward lean", joints: "Neutral, arms 90°", weight: "Balls of feet", spine: "Slight lean", balance: "Ready" },
    mid: { position: "Alternating knee drives, arm swing", joints: "Knee 90° hip flexion", weight: "Alternating single-leg", spine: "Stable", balance: "Contralateral" },
    peak: { position: "Full stride, high knee, powerful arm", joints: "Max knee lift, full arm swing", weight: "Dynamic single-leg", spine: "Stable forward-leaning", balance: "Dynamic" },
    sceneRules: ["Running in place", "No treadmill", "Full body head to toe"],
    camera: "WIDE full-body, head to toe",
    fabricCue: "Shirt bounces, leggings flex at knees/hips",
    bodyConstraints: ["Contralateral coordination", "Foot strikes under center of mass"],
    objectPhysics: [],
    movementFlow: "Rhythmic alternating stride with arm pump",
  },
  "jumping": {
    start: { position: "Quarter squat, arms back", joints: "Knees 130°, hips 120°", weight: "Balls of feet", spine: "Slight lean", balance: "Loaded" },
    mid: { position: "Exploding up, arms driving overhead", joints: "Full triple extension", weight: "Leaving ground", spine: "Extending", balance: "Bilateral" },
    peak: { position: "Airborne, extended, arms overhead", joints: "Full extension, toes pointed", weight: "Airborne at peak", spine: "Extended", balance: "Aligned" },
    sceneRules: ["No equipment", "Full body with headroom"],
    camera: "WIDE full-body with headroom",
    fabricCue: "Fabric compresses loading, stretches jumping",
    bodyConstraints: ["Triple extension COMPLETE before feet leave", "Landing absorbs impact"],
    objectPhysics: [],
    movementFlow: "Countermovement → extension → peak → soft landing",
  },
  "battle ropes": {
    start: { position: "Athletic half-squat, gripping rope ends", joints: "Knees 120°, hips 110°", weight: "Athletic base, heels", spine: "Neutral, braced", balance: "Wide stable" },
    mid: { position: "Alternating arm waves, rope undulation", joints: "Shoulders alternating, elbows bent", weight: "Anchored in legs", spine: "Stable core", balance: "Lower body stable" },
    peak: { position: "Max wave amplitude, powerful drives", joints: "Full shoulder range, rapid alternation", weight: "Explosive arms, stable squat", spine: "Rigid core", balance: "Base absorbs forces" },
    sceneRules: ["Battle ropes visible to anchor", "WIDE showing rope length"],
    camera: "WIDE full-body showing full rope length",
    fabricCue: "Shirt shows rapid movement at shoulders",
    bodyConstraints: ["Lower body ANCHORED", "Core BRACED", "Waves from SHOULDER"],
    objectPhysics: ["Ropes WAVE PATTERN", "Waves toward anchor", "Realistic sag"],
    movementFlow: "Stable squat → alternating arm drives → wave propagation",
  },
};

// Build biomechanical pose instructions
function buildPoseInstructions(movement: string, angle: string): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];
  if (!def) {
    return `${MOTION_REALISM_PREAMBLE}\n\nThe athlete performs ${movement} with correct biomechanical form. Full body visible head to toe.`;
  }
  const constraintStr = def.bodyConstraints.join("\n• ");
  const objectStr = def.objectPhysics.length > 0 ? `\nOBJECT PHYSICS:\n• ${def.objectPhysics.join("\n• ")}` : "";

  let angleReinforcement = "";
  const isSide = angle === "side" || angle === "side-left" || angle === "side-right";
  const angleLabel = angle.replace("-", " ").toUpperCase();
  if (key === "bench press") {
    if (angle === "front") angleReinforcement = `\nANGLE: Camera at athlete's feet. Athlete LYING FLAT on bench. HORIZONTAL.`;
    else if (isSide) angleReinforcement = `\nANGLE (${angleLabel}): Camera at ${angle === "side-right" ? "right" : "left"} side. Athlete LYING FLAT. HORIZONTAL.`;
    else if (angle === "back") angleReinforcement = `\nANGLE: Camera behind head. Athlete LYING FLAT. HORIZONTAL.`;
  } else if (key === "pull-ups") {
    angleReinforcement = `\nANGLE (${angleLabel}): Athlete HANGING from bar ABOVE — VERTICAL, feet off ground.`;
  } else if (key === "push-ups") {
    angleReinforcement = `\nANGLE (${angleLabel}): Athlete in HORIZONTAL plank/push-up on FLOOR.`;
  }

  return `${MOTION_REALISM_PREAMBLE}

EXERCISE: ${movement}
MID: ${def.mid.position}. Joints: ${def.mid.joints}.
PEAK: ${def.peak.position}. Joints: ${def.peak.joints}.
Show MID or PEAK phase.
BODY CONSTRAINTS:
• ${constraintStr}
${objectStr}
FLOW: ${def.movementFlow}
${angleReinforcement}
SCENE: ${def.sceneRules.join(". ")}. CAMERA: ${def.camera}. GARMENT: ${def.fabricCue}.`;
}

// ── Helper: remove background ──
async function removeBackground(base64Image: string, apiKey: string, label: string): Promise<string> {
  try {
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ROUTER.remove_bg,
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `Remove background completely. Output ONLY the ${label} on transparent background. Keep colors/quality intact.` },
            { type: "image_url", image_url: { url: base64Image } },
          ],
        }],
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const url = extractImageUrl(data.choices?.[0]?.message);
      if (url) return url;
    }
  } catch (e) { console.warn(`BG removal error for ${label}:`, e); }
  return base64Image;
}

// ── Helper: validate image against master scene ──
async function validateImage(
  imageUrl: string,
  apiKey: string,
  angle: string,
  movement: string,
  masterScene: MasterScenePayload,
  referenceImageUrl?: string,
): Promise<{ valid: boolean; issues: string[] }> {
  try {
    const validationPrompt = buildConsistencyValidationPrompt(masterScene, {
      angle, movement, hasReferenceImage: !!referenceImageUrl,
    });
    const contentParts: Array<Record<string, unknown>> = [
      { type: "text", text: validationPrompt },
      ...(referenceImageUrl ? [{ type: "image_url", image_url: { url: referenceImageUrl } }] : []),
      { type: "image_url", image_url: { url: imageUrl } },
    ];
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ROUTER.validate_image,
        messages: [{ role: "user", content: contentParts }],
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { valid: parsed.valid !== false, issues: parsed.issues || [] };
      }
    }
  } catch (e) { console.warn(`Validation error for ${angle}:`, e); }
  return { valid: true, issues: [] };
}

// ── Helper: extract image URL from AI response ──
function extractImageUrl(choice: Record<string, unknown>): string | null {
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

// ── Camera position prompts with scene-lock enforcement ──
const CAMERA_POSITIONS: Record<string, string> = {
  "front": "CAMERA POSITION: DIRECTLY IN FRONT (0°). Athlete faces camera. Full front of body visible. THIS IS THE ANCHOR VIEW.",
  "side-left": "CAMERA POSITION: 90° LEFT SIDE. Camera has rotated 90° around the SAME FROZEN SCENE. TRUE LEFT PROFILE. Athlete does NOT face camera. Same pose, same moment, only camera moved.",
  "side-right": "CAMERA POSITION: 90° RIGHT SIDE. Camera has rotated 90° around the SAME FROZEN SCENE. TRUE RIGHT PROFILE. Athlete does NOT face camera. Same pose, same moment, only camera moved.",
  "back": "CAMERA POSITION: DIRECTLY BEHIND (180°). Camera has rotated 180° around the SAME FROZEN SCENE. Full BACK of body visible. Face NOT visible. Same pose, same moment, only camera moved.",
};

// ── Build Scene Blueprint prompt ──
function buildSceneBlueprintPrompt(opts: {
  movement: string;
  athleteDesc: string;
  garmentDesc: string;
  environmentDesc: string;
  intensity: number;
  motionIntelligencePrompt: string;
}): string {
  const key = opts.movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];
  const phaseDesc = def
    ? `MID: ${def.mid.position} (${def.mid.joints})\nPEAK: ${def.peak.position} (${def.peak.joints})`
    : `${opts.movement} at mid-to-peak phase with correct biomechanics`;

  return `SCENE BLUEPRINT PLANNER — Create a FROZEN MOMENT definition.

You are defining a single frozen moment in time that will be captured by 4 cameras simultaneously.

ATHLETE: ${opts.athleteDesc}
GARMENT: ${opts.garmentDesc}
ENVIRONMENT: ${opts.environmentDesc}
EXERCISE: ${opts.movement} at ${opts.intensity}% intensity

BIOMECHANICAL PHASES:
${phaseDesc}

${opts.motionIntelligencePrompt}

Create a precise blueprint. Return ONLY valid JSON:
{
  "frozen_pose": "Exact description of the athlete's body position at this frozen moment — every joint angle, weight distribution, head position, arm position, leg position",
  "motion_phase": "exact phase (e.g. 'mid-squat, thighs 30° past parallel, arms forward for counterbalance')",
  "garment_state": "exact state of fabric — where it stretches, compresses, folds at this frozen moment",
  "lighting_setup": "3-point lighting: key light direction, fill ratio, rim light position",
  "ground_contact": "exact description of feet/body contact with ground and weight distribution",
  "equipment_state": "position and state of any equipment at this frozen moment (or 'none')",
  "atmosphere": "sweat level, breathing phase, muscle tension level"
}`;
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

    const body = await req.json();
    const {
      garmentName, garmentBase64, gender, size, bodyType, movement, intensity,
      logoBase64, logoPosition, athleteIdentity,
    } = body;
    const mode = body.mode || "full";
    const fast = body.fast === true;
    const motionIntelligencePrompt = body.motionIntelligencePrompt || "";
    const trainedAthleteMode = body.trainedAthleteMode !== false;
    const maxRealismMode = body.maxRealismMode === true && !fast;
    const qualityThreshold = body.qualityThreshold || 80;

    let masterScene = normalizeMasterScene(body.masterScene, {
      garmentName: garmentName || "Activewear",
      movement: movement || "squats",
      size: size || "M",
      gender: gender || "Female",
      bodyType: bodyType || "Athletic",
      athleteIdentity,
      logoPosition,
    });

    const imageModel = fast ? MODEL_ROUTER.generate_image_fast : MODEL_ROUTER.generate_image_quality;
    const MAX_RETRIES = fast ? 1 : 2;
    const requestedAngle = body.angle;
    // Validate front in quality mode, and side/back angles when anchor image exists
    const anchorImageUrl = body.anchorImageUrl || masterScene.anchor_image_url;
    const shouldValidate = !fast && maxRealismMode && requestedAngle === "front";
    // For non-front angles: lightweight consistency check against anchor
    const shouldValidateConsistency = !fast && requestedAngle !== "front" && !!anchorImageUrl;

    console.log(`Mode: ${mode}, Fast: ${fast}, Model: ${imageModel}, Angle: ${requestedAngle}, Validate: ${shouldValidate}, ConsistencyCheck: ${shouldValidateConsistency}`);

    // ── Pre-process uploads ──
    let processedGarment = body.processedGarment || garmentBase64;
    let processedLogo = body.processedLogo || logoBase64;

    if (mode === "analyze" || mode === "full") {
      const [cleanGarment, cleanLogo] = await Promise.all([
        garmentBase64 ? removeBackground(garmentBase64, LOVABLE_API_KEY, "garment/clothing") : Promise.resolve(""),
        logoBase64 ? removeBackground(logoBase64, LOVABLE_API_KEY, "brand logo") : Promise.resolve(""),
      ]);
      processedGarment = cleanGarment || garmentBase64;
      processedLogo = cleanLogo || logoBase64;
    }

    // ── Step 1: Analyze garment ──
    let garmentAnalysis: Record<string, unknown> = body.garmentAnalysis || {
      fabric_type: "High-compression polyester-elastane blend",
      garment_category: "Training T-Shirt",
      color_palette: ["#1a1a1a"],
      stretch_rating: 8,
      compression_level: "High",
      breathability_rating: 7,
      recommended_use: ["HIIT", "Strength", "CrossFit"],
    };

    let physicsData = body.physicsData || {
      stretch_factor: "4×",
      compression_percentage: 85,
      sweat_absorption: 92,
      breathability_score: 78,
      stress_zones: ["knees", "glutes", "waistband"],
      performance_notes: "Good stretch recovery under load.",
    };

    // Scene Blueprint data (from blueprint mode or cached)
    let sceneBlueprint = body.sceneBlueprint || null;

    if (mode === "analyze" || mode === "full") {
      // Run analysis, physics, and blueprint in parallel
      const athleteDesc = athleteIdentity
        ? `${athleteIdentity.gender}, ${athleteIdentity.body_type}, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style}${athleteIdentity.hair_color ? ` ${athleteIdentity.hair_color} hair` : ""}`
        : `${gender}, ${bodyType}, size ${size}`;
      const garmentDesc = `${garmentName}, size ${size}`;
      const envDesc = `${masterScene.environment_lock.location}, ${masterScene.environment_lock.background}, ${masterScene.environment_lock.lighting}`;

      const [analysisResult, physicsResult, blueprintResult] = await Promise.all([
        (async () => {
          try {
            const resp = await fetch(AI_GATEWAY, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: MODEL_ROUTER.analyze,
                messages: [{
                  role: "system",
                  content: `Expert activewear analyst. Analyze garment → JSON: fabric_type, garment_category (ONLY: "T-Shirt","Compression T-Shirt","Leggings","Shorts","Sports Bra","Training Top","Compression Tights","Tank Top","Hoodie","Joggers"), color_palette, stretch_rating (1-10), compression_level, breathability_rating (1-10), recommended_use. ONLY valid JSON.`,
                }, {
                  role: "user",
                  content: processedGarment
                    ? [{ type: "text", text: `Analyze garment "${garmentName}".` }, { type: "image_url", image_url: { url: processedGarment } }]
                    : `Analyze garment "${garmentName}" (${gender}, size ${size}).`,
                }],
              }),
            });
            if (resp.ok) {
              const data = await resp.json();
              const content = data.choices?.[0]?.message?.content || "{}";
              const match = content.match(/\{[\s\S]*\}/);
              if (match) return JSON.parse(match[0]);
            }
          } catch (e) { console.error("Analysis error:", e); }
          return null;
        })(),
        (async () => {
          try {
            const resp = await fetch(AI_GATEWAY, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: MODEL_ROUTER.describe_physics,
                messages: [
                  { role: "system", content: "Sportswear physics engine. Return JSON: stretch_factor, compression_percentage, sweat_absorption, breathability_score, stress_zones, performance_notes. ONLY valid JSON." },
                  { role: "user", content: `Garment: ${garmentName}. Athlete: ${gender}, ${size}, ${bodyType}. Movement: ${movement} at ${intensity}% intensity.` },
                ],
              }),
            });
            if (resp.ok) {
              const data = await resp.json();
              const content = data.choices?.[0]?.message?.content || "{}";
              const match = content.match(/\{[\s\S]*\}/);
              if (match) return JSON.parse(match[0]);
            }
          } catch (e) { console.error("Physics error:", e); }
          return null;
        })(),
        // Scene Blueprint — defines the EXACT frozen moment
        (async () => {
          try {
            const bpPrompt = buildSceneBlueprintPrompt({
              movement: movement || "squats",
              athleteDesc,
              garmentDesc,
              environmentDesc: envDesc,
              intensity: intensity || 50,
              motionIntelligencePrompt,
            });
            const resp = await fetch(AI_GATEWAY, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: MODEL_ROUTER.blueprint,
                messages: [{ role: "user", content: bpPrompt }],
              }),
            });
            if (resp.ok) {
              const data = await resp.json();
              const content = data.choices?.[0]?.message?.content || "{}";
              const match = content.match(/\{[\s\S]*\}/);
              if (match) return JSON.parse(match[0]);
            }
          } catch (e) { console.error("Blueprint error:", e); }
          return null;
        })(),
      ]);

      if (analysisResult) {
        const validCategories = ["T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"];
        if (!validCategories.includes(analysisResult.garment_category)) {
          analysisResult.garment_category = "T-Shirt";
        }
        garmentAnalysis = analysisResult;
      }
      if (physicsResult) {
        physicsData = { ...physicsData, ...physicsResult };
      }
      if (blueprintResult) {
        sceneBlueprint = blueprintResult;
      }
    }

    // Lock garment category into master scene
    const analyzedCategory = (garmentAnalysis as Record<string, unknown>).garment_category as string || "unknown";
    const analyzedColors = (garmentAnalysis as Record<string, unknown>).color_palette as string[] || [];
    const analyzedFabric = (garmentAnalysis as Record<string, unknown>).fabric_type as string || "";
    const garmentDescriptor = `${analyzedCategory}, ${analyzedFabric}, colors: ${analyzedColors.join(", ") || "dark"}.`;

    masterScene = {
      ...masterScene,
      garment_lock: {
        ...masterScene.garment_lock,
        garment_category: analyzedCategory,
        garment_descriptor: garmentDescriptor,
      },
    };

    // ── If mode is "analyze", return early with blueprint ──
    if (mode === "analyze") {
      return new Response(
        JSON.stringify({
          success: true, mode: "analyze",
          garment_analysis: garmentAnalysis,
          physics: physicsData,
          sceneBlueprint,
          processedGarment, processedLogo,
          master_scene: masterScene,
          model_router: { analysis: MODEL_ROUTER.analyze, physics: MODEL_ROUTER.describe_physics, background_removal: MODEL_ROUTER.remove_bg, blueprint: MODEL_ROUTER.blueprint },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Generate images ──
    const angles = mode === "generate_angle" && requestedAngle ? [requestedAngle] : ["front", "side-left", "side-right", "back"];
    console.log(`Generating ${angles.join(", ")} (fast: ${fast}, model: ${imageModel})`);

    // Build blueprint context for prompts
    const blueprintContext = sceneBlueprint
      ? `\nFROZEN MOMENT BLUEPRINT (MANDATORY — this is the EXACT pose to render):
Pose: ${sceneBlueprint.frozen_pose || ""}
Phase: ${sceneBlueprint.motion_phase || ""}
Garment State: ${sceneBlueprint.garment_state || ""}
Lighting: ${sceneBlueprint.lighting_setup || ""}
Ground Contact: ${sceneBlueprint.ground_contact || ""}
Equipment: ${sceneBlueprint.equipment_state || "none"}
Atmosphere: ${sceneBlueprint.atmosphere || ""}`
      : "";

    async function generateAngle(angle: string): Promise<string | null> {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        attempts++;
        try {
          const placementLabel = logoPosition?.placement || "chest-center";
          const isFrontPlacement = placementLabel.startsWith("chest") || placementLabel === "belly-center";
          const isBackPlacement = placementLabel.startsWith("back");
          const isSleevePlacement = placementLabel.startsWith("sleeve");
          const isSideAngle = angle === "side" || angle === "side-left" || angle === "side-right";
          const showLogoThisAngle =
            (angle === "front" && isFrontPlacement) ||
            (angle === "back" && isBackPlacement) ||
            (isSideAngle && isSleevePlacement);

          const logoInstructions = processedLogo ? (showLogoThisAngle
            ? `\nLOGO: Placed at "${placementLabel}", visible from ${angle}. Blend into fabric, 8-12cm.`
            : `\nLOGO: At "${placementLabel}" — NOT visible from ${angle}.`) : "";

          const garmentCategory = masterScene.garment_lock.garment_category || "activewear";
          const garmentTypeEnforcement = `GARMENT LOCK: "${garmentCategory}" — IMMUTABLE type.${masterScene.garment_lock.garment_descriptor ? ` ${masterScene.garment_lock.garment_descriptor}` : ""}`;

          const MOTIF_RULES = angle === "front"
            ? `Reproduce front prints/motifs faithfully.`
            : `Prints/motifs are FRONT ONLY. ${angle.replace("-", " ")} view is PLAIN.`;

          const athleteDesc = athleteIdentity
            ? `ATHLETE (LOCKED): ${athleteIdentity.gender}, ${athleteIdentity.body_type}, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style}${athleteIdentity.hair_color ? ` ${athleteIdentity.hair_color} hair (COLOR LOCKED)` : ""}. SAME person in every output.`
            : `ATHLETE: ${gender}, ${bodyType}, size ${size}`;

          const anglePoseInstructions = buildPoseInstructions(movement, angle);
          const motionBlock = motionIntelligencePrompt ? `\n${motionIntelligencePrompt}` : "";
          const maxRealismBlock = maxRealismMode ? `\nMAX REALISM: Every pixel indistinguishable from real photograph. Threshold: ${qualityThreshold}%.` : "";

          const cameraPos = CAMERA_POSITIONS[angle] || CAMERA_POSITIONS["front"];
          const angleDisplayName = angle.replace("-", " ").toUpperCase();

          // For non-front angles, add anchor reference instruction
          const anchorRefInstruction = angle !== "front" && anchorImageUrl
            ? `\nANCHOR REFERENCE: The provided reference image is the FRONT VIEW of this EXACT scene. You MUST render the SAME scene — same person, same pose, same clothing, same environment, same lighting, same moment — but from the ${angleDisplayName} camera position. The reference image is your GROUND TRUTH.`
            : "";

          const mainPrompt = `${SCENE_LOCK_PREAMBLE}

${cameraPos}
${anchorRefInstruction}

MASTER SCENE: ${describeMasterSceneCompact(masterScene)}
${blueprintContext}

${garmentTypeEnforcement}
${athleteDesc}

FRAMING: ZOOM OUT. Full-body head to toe. Athlete 45-55% frame height. 20%+ above head, 15%+ below feet. 9:16 vertical (1080×1920). 4-5m distance. All equipment visible.

${anglePoseInstructions}
${motionBlock}
${maxRealismBlock}

${MOTIF_RULES}${logoInstructions}

ANTI-ARTIFACT: NO halo/glow. NO cropping. Every body part and equipment in frame.
Canon EOS R5, 24mm f/2.8, professional studio lighting.

STRICT: ${angleDisplayName} PERSPECTIVE ONLY. Same frozen moment. Only camera position changed.`;

          // Build message content — include anchor image for non-front angles
          const contentParts: Array<Record<string, unknown>> = [
            { type: "text", text: mainPrompt },
          ];

          // Always include garment reference
          if (processedGarment) {
            contentParts.push({ type: "image_url", image_url: { url: processedGarment } });
          }

          // For non-front angles: include anchor (front) image as reference
          if (angle !== "front" && anchorImageUrl) {
            contentParts.push({ type: "image_url", image_url: { url: anchorImageUrl } });
          }

          // Include logo if visible from this angle
          if (processedLogo && showLogoThisAngle) {
            contentParts.push({ type: "image_url", image_url: { url: processedLogo } });
          }

          const imageResp = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: imageModel,
              modalities: ["image", "text"],
              messages: [{
                role: "user",
                content: contentParts.length === 1 ? mainPrompt : contentParts,
              }],
            }),
          });

          if (imageResp.ok) {
            const imageData = await imageResp.json();
            const imgUrl = extractImageUrl(imageData.choices?.[0]?.message as Record<string, unknown>);
            if (imgUrl) {
              // Front: full validation if maxRealism
              if (shouldValidate && angle === "front") {
                const validation = await validateImage(imgUrl, LOVABLE_API_KEY, angle, movement, masterScene);
                if (!validation.valid) {
                  console.warn(`Front validation failed (attempt ${attempts}): ${validation.issues.join(", ")}`);
                  await new Promise(r => setTimeout(r, 500));
                  continue;
                }
              }
              // Non-front: consistency validation against anchor
              if (shouldValidateConsistency && angle !== "front") {
                const validation = await validateImage(imgUrl, LOVABLE_API_KEY, angle, movement, masterScene, anchorImageUrl);
                if (!validation.valid) {
                  console.warn(`Consistency check failed for ${angle} (attempt ${attempts}): ${validation.issues.join(", ")}`);
                  // Only retry once for consistency — don't stall
                  if (attempts < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 300));
                    continue;
                  }
                }
              }
              console.log(`✅ ${angle} generated (attempt ${attempts}, ${fast ? "fast" : "quality"})`);
              return imgUrl;
            }
          } else {
            console.error(`Image gen failed for ${angle}:`, imageResp.status);
          }

          if (attempts < MAX_RETRIES) await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`Image gen error for ${angle} (attempt ${attempts}):`, e);
        }
      }
      return null;
    }

    // Generate angles sequentially
    const angleResults: (string | null)[] = [];
    for (const a of angles) {
      const r = await generateAngle(a);
      angleResults.push(r);
    }
    const generatedImages: Record<string, string | null> = {};
    angles.forEach((a, i) => { generatedImages[a] = angleResults[i]; });

    // ── generate_angle mode: return single angle ──
    if (mode === "generate_angle" && requestedAngle) {
      const imgData = generatedImages[requestedAngle];
      let storedUrl: string | null = null;
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${requestedAngle}.png`;
          const { error: uploadError } = await supabase.storage.from("generated-images").upload(fileName, binaryData, { contentType: "image/png", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
            storedUrl = urlData.publicUrl;
          }
        } catch (e) { console.error(`Upload error for ${requestedAngle}:`, e); }
      }

      if (requestedAngle === "front") {
        masterScene = { ...masterScene, anchor_image_url: storedUrl || imgData || masterScene.anchor_image_url };
      }

      return new Response(
        JSON.stringify({ success: true, mode: "generate_angle", angle: requestedAngle, image: imgData, stored_url: storedUrl, master_scene: masterScene }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Full mode: store results ──
    const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
    let brandId = brand?.id;
    if (!brandId) {
      const { data: newBrand } = await supabase.from("brands").insert({ owner_id: user.id, name: "My Brand" }).select("id").single();
      brandId = newBrand?.id;
    }

    let projectId: string | null = null;
    if (brandId) {
      const { data: project } = await supabase.from("projects").select("id").eq("brand_id", brandId).limit(1).single();
      if (project) { projectId = project.id; }
      else {
        const { data: newProject } = await supabase.from("projects").insert({ brand_id: brandId, name: "Default Project" }).select("id").single();
        projectId = newProject?.id || null;
      }
      await supabase.from("usage_logs").insert({
        user_id: user.id, brand_id: brandId, action: "generate_motion", credits_used: 1,
        metadata: { movement, intensity, gender, size, bodyType, garmentName },
      });
    }

    const storedImageUrls: Record<string, string> = {};
    for (const [angle, imgData] of Object.entries(generatedImages)) {
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${angle}.png`;
          const { error: uploadError } = await supabase.storage.from("generated-images").upload(fileName, binaryData, { contentType: "image/png", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
            storedImageUrls[angle] = urlData.publicUrl;
          }
        } catch (e) { console.error(`Upload error for ${angle}:`, e); }
      }
    }

    if (storedImageUrls.front && !masterScene.anchor_image_url) {
      masterScene = { ...masterScene, anchor_image_url: storedImageUrls.front };
    }

    if (brandId && projectId) {
      await supabase.from("assets").insert({
        brand_id: brandId, project_id: projectId,
        name: `${garmentName} - ${movement}`, type: "generated", status: "completed",
        thumbnail_url: Object.values(storedImageUrls)[0] || null,
        physics_settings: physicsData,
        motion_settings: { movement, intensity },
        metadata: { garment_analysis: garmentAnalysis, athlete: { gender, size, bodyType }, images: storedImageUrls },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        garment_analysis: garmentAnalysis, physics: physicsData,
        images: generatedImages, stored_urls: storedImageUrls,
        master_scene: masterScene, sceneBlueprint,
        model_router: {
          analysis: MODEL_ROUTER.analyze, physics: MODEL_ROUTER.describe_physics,
          image_generation: imageModel, background_removal: MODEL_ROUTER.remove_bg,
          image_validation: MODEL_ROUTER.validate_image, blueprint: MODEL_ROUTER.blueprint,
          video: "runway/gen4-turbo",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-motion error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("429") || message.includes("rate limit")) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
