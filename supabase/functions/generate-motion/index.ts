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

// ── Smart Model Router ──
// Fast mode uses flash model for instant previews; quality mode uses PRO
const MODEL_ROUTER = {
  analyze: "google/gemini-3-flash-preview",
  generate_image_fast: "google/gemini-3.1-flash-image-preview",
  generate_image_quality: "google/gemini-3-pro-image-preview",
  describe_physics: "google/gemini-2.5-flash",
  remove_bg: "google/gemini-3.1-flash-image-preview",
  validate_image: "google/gemini-3-flash-preview",
};

// ── Motion Realism Preamble ──
const MOTION_REALISM_PREAMBLE = `MOTION REALISM ENGINE — MANDATORY CONSTRAINTS:

BIOMECHANICAL ACCURACY (NON-NEGOTIABLE):
- Every joint must be at a physically possible angle — no hyperextension beyond anatomical limits
- The spine must maintain a neutral or naturally loaded curve appropriate to the exercise
- Limb proportions must remain CONSTANT
- Muscle engagement must be visible and anatomically correct for the exercise phase shown
- The athlete's center of gravity must be physically plausible

BODY INTEGRITY:
- Head-to-body ratio must remain realistic (approximately 1:7.5 for adults)
- Hands and feet must be correctly proportioned
- Weight-bearing limbs must show appropriate muscle tension and ground contact

NATURAL MOVEMENT QUALITY:
- The pose must look like a FREEZE-FRAME from a real video
- There must be visible momentum cues: weight shift, dynamic tension
- Hair, clothing, and loose elements must respond to the direction of movement

GRAVITY AND PHYSICS:
- All objects and body parts must obey gravity
- Ground contact must show appropriate pressure and weight distribution`;

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
    start: { position: "Standing upright, feet shoulder-width, arms at sides", joints: "Knees straight 180°, hips neutral", weight: "Centered on both feet", spine: "Neutral lordotic curve", balance: "Even bilateral" },
    mid: { position: "Bending knees and hips, lowering body", joints: "Knees 120°, hips 110°, ankles dorsiflexed 15°", weight: "Shifting to heels", spine: "Slight forward lean, neutral curve", balance: "Weight shifts posteriorly" },
    peak: { position: "Deep squat, thighs parallel, upright torso, arms forward", joints: "Knees 75°, hips 70°, ankles dorsiflexed 25°", weight: "Deep into heels", spine: "Neutral spine maintained", balance: "Counterbalanced by arm position" },
    sceneRules: ["Both feet flat on ground", "No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe, slight low angle",
    fabricCue: "Leggings stretch at quads and glutes, compression at knee crease",
    bodyConstraints: ["Knees MUST track over toes", "Heels flat on ground", "Hip crease drops below knee line at peak"],
    objectPhysics: [],
    movementFlow: "Controlled descent, brief pause at depth, powerful drive upward",
  },
  "push-ups": {
    start: { position: "High plank, arms extended, body straight line", joints: "Elbows straight, wrists under shoulders", weight: "Hands and toes", spine: "Perfectly straight", balance: "Hands shoulder-width" },
    mid: { position: "Lowering chest toward ground, elbows bending", joints: "Elbows 90°", weight: "Shifting forward", spine: "Rigid plank", balance: "Body moves as one unit" },
    peak: { position: "Chest near floor, body rigid and straight", joints: "Elbows 45-60° from torso", weight: "Chest 2-3 inches from floor", spine: "Absolute plank integrity", balance: "Maximal anterior chain tension" },
    sceneRules: ["Body on floor level", "No bench", "Full body visible head to toes"],
    camera: "WIDE full-body shot from low side angle",
    fabricCue: "Shirt stretches across upper back and shoulders",
    bodyConstraints: ["Body forms ONE STRAIGHT LINE", "Elbows tuck at 45°", "Head neutral"],
    objectPhysics: [],
    movementFlow: "Controlled lowering, explosive press to lockout",
  },
  "deadlifts": {
    start: { position: "Standing behind barbell, hinging at hips to grip bar, flat back", joints: "Hips hinged 80°, knees 130°", weight: "Mid-foot, loaded into hamstrings", spine: "FLAT back — neutral lumbar", balance: "Shoulders slightly in front of bar" },
    mid: { position: "Pulling barbell off ground, bar close to shins", joints: "Hips and knees extending together", weight: "Shifting to posterior chain", spine: "Back angle unchanged", balance: "Bar travels vertically close to body" },
    peak: { position: "Full lockout, standing tall, barbell at hip level", joints: "Knees 180°, hips 180°", weight: "Centered, stable", spine: "Fully erect, shoulders retracted", balance: "Standing tall, barbell balanced" },
    sceneRules: ["Barbell MUST be visible", "WIDE full-body shot head to toe"],
    camera: "WIDE full-body shot from 30° side angle",
    fabricCue: "Fabric stretches at hamstrings and lower back",
    bodyConstraints: ["FLAT BACK is NON-NEGOTIABLE", "Bar travels in straight vertical line", "Hips and knees extend SIMULTANEOUSLY"],
    objectPhysics: ["Barbell shows weight — slight bar flex", "Plates symmetric on both ends"],
    movementFlow: "Powerful pull from floor, hip snap to lockout, controlled descent",
  },
  "lunges": {
    start: { position: "Standing upright, feet hip-width", joints: "Knees straight, hips neutral", weight: "Centered", spine: "Tall and neutral", balance: "Stable bilateral" },
    mid: { position: "One leg forward, both knees bending", joints: "Front knee 110°, back knee 120°", weight: "Split between feet", spine: "Vertical torso", balance: "60/40 weight split" },
    peak: { position: "Deep lunge, front thigh parallel, back knee near ground", joints: "Front knee 90°, back knee 90°", weight: "60% front, 40% back", spine: "Perfectly vertical", balance: "Hip-width stance" },
    sceneRules: ["No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe",
    fabricCue: "Stretch at front quad and back hip flexor",
    bodyConstraints: ["Front knee tracks over ankle", "Back knee descends straight down", "Torso VERTICAL"],
    objectPhysics: [],
    movementFlow: "Controlled step forward, smooth descent, powerful drive back",
  },
  "pull-ups": {
    start: { position: "Hanging from pull-up bar above, arms fully extended, body vertical", joints: "Shoulders extended, elbows 180°", weight: "Hanging from hands", spine: "Slight hollow body", balance: "Dead hang, no swinging" },
    mid: { position: "Pulling body upward, chest approaching bar", joints: "Elbows 110°", weight: "Pulling upward", spine: "Slight thoracic extension", balance: "Controlled vertical pull" },
    peak: { position: "Chin above bar, elbows fully bent", joints: "Elbows 45°, shoulders contracted", weight: "Suspended at top", spine: "Proud chest, slight back arch", balance: "Peak contraction hold" },
    sceneRules: ["Pull-up bar ABOVE athlete", "Athlete hangs BELOW bar", "Bar NEVER behind neck", "Body NEVER on floor", "Full body visible bar to feet"],
    camera: "WIDE full-body vertical shot showing bar at top and feet at bottom",
    fabricCue: "Back shirt stretches showing lat engagement",
    bodyConstraints: ["Arms pull VERTICALLY", "Body remains vertical", "Grip overhand, wider than shoulders"],
    objectPhysics: ["Pull-up bar is FIXED, horizontal, rigid", "Bar positioned high enough for full extension"],
    movementFlow: "Dead hang, shoulder depression, smooth pull, controlled chin-over-bar peak",
  },
  "bench press": {
    start: { position: "Lying flat on bench, feet on floor, barbell at full extension", joints: "Elbows locked, wrists stacked", weight: "Bar at full extension", spine: "Natural arch, shoulder blades pinched", balance: "Five-point contact" },
    mid: { position: "Lowering barbell toward chest, elbows at 45°", joints: "Elbows 90°", weight: "Bar descending under control", spine: "Arch maintained", balance: "Feet driving into floor" },
    peak: { position: "Explosive press upward, arms extending, lying on bench", joints: "Full elbow extension", weight: "Pressing through palms", spine: "Maintained arch", balance: "Stable five-point contact" },
    sceneRules: ["Bench visible underneath athlete", "Barbell visible and NEVER cut off", "Athlete LYING on back", "NEVER standing", "Feet flat on floor"],
    camera: "WIDE full-body shot from side angle showing entire athlete on bench",
    fabricCue: "Shirt stretches across chest during press",
    bodyConstraints: ["Athlete is LYING HORIZONTALLY on bench", "Elbows at 45°", "Bar touches lower chest"],
    objectPhysics: ["Barbell shows slight flex under load", "Bench is flat and stable"],
    movementFlow: "Controlled unrack, slow descent, explosive drive to lockout",
  },
  "sprint": {
    start: { position: "Standing tall, slight forward lean", joints: "Neutral standing", weight: "Balls of feet", spine: "Slight forward lean", balance: "Athletic ready" },
    mid: { position: "Sprinting, one knee driving high, opposite arm pumping", joints: "Drive knee 90° hip flexion", weight: "Single-leg stance", spine: "Slight forward lean maintained", balance: "Contralateral coordination" },
    peak: { position: "Maximum knee drive, explosive arm pump", joints: "Knee at maximum height", weight: "Explosive single-leg drive", spine: "Forward lean 15-20°", balance: "Dynamic single-leg" },
    sceneRules: ["Running in place", "No treadmill", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe",
    fabricCue: "Intense fabric ripple with each stride",
    bodyConstraints: ["Contralateral arm-leg coordination", "Arms pump forward-back, NOT across midline"],
    objectPhysics: [],
    movementFlow: "Explosive rhythmic alternation with hip drive",
  },
  "burpees": {
    start: { position: "Standing upright", joints: "Neutral standing", weight: "Centered", spine: "Tall and neutral", balance: "Stable bilateral" },
    mid: { position: "In plank, body straight, arms extended", joints: "Shoulders over wrists", weight: "Hands and toes", spine: "Perfect plank", balance: "Stable four-point" },
    peak: { position: "Explosive jump, arms overhead, full extension", joints: "Full triple extension", weight: "Airborne", spine: "Fully extended vertical", balance: "Airborne, aligned" },
    sceneRules: ["No equipment", "Full body visible with headroom for jump"],
    camera: "WIDE full-body shot from slight side angle with headroom",
    fabricCue: "Maximum fabric dynamics through all phases",
    bodyConstraints: ["Plank: straight line", "Jump: full triple extension", "Landing: soft knees"],
    objectPhysics: [],
    movementFlow: "Standing → squat → plank → push-up → squat → explosive jump",
  },
  "high knees": {
    start: { position: "Standing tall, arms at 90° bend", joints: "Neutral, elbows 90°", weight: "Balls of feet", spine: "Tall and vertical", balance: "Athletic ready" },
    mid: { position: "One knee driving up, opposite arm pumping", joints: "Knee 90° hip flexion", weight: "Single-leg", spine: "Vertical, no fold", balance: "Rapid alternating" },
    peak: { position: "Knee at chest height, rapid alternation", joints: "Maximum hip flexion", weight: "Quick alternating ground contact", spine: "Upright", balance: "Fast rhythmic" },
    sceneRules: ["No equipment", "Standing in place", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe",
    fabricCue: "Leggings stretch at hip, shirt bounces with rhythm",
    bodyConstraints: ["Torso stays UPRIGHT", "Contralateral arm-leg coordination"],
    objectPhysics: [],
    movementFlow: "Fast rhythmic alternating knee drives",
  },
  "box jumps": {
    start: { position: "Athletic quarter squat facing box, arms drawn back", joints: "Knees 130°, hips 120°", weight: "Balls of feet", spine: "Slight forward lean, neutral", balance: "Weight loaded in legs" },
    mid: { position: "Explosive triple extension, body launching, knees tucking", joints: "Full extension then knee tuck", weight: "Airborne", spine: "Extending through jump", balance: "Aimed at box center" },
    peak: { position: "Landing softly on box in squat, then standing tall", joints: "Knees 100° on landing", weight: "Soft landing on box", spine: "Absorbing impact", balance: "Stable landing on box" },
    sceneRules: ["Plyometric box visible", "WIDE full-body shot with headroom"],
    camera: "WIDE full-body shot from side angle, head to toe including box",
    fabricCue: "Strong fabric stretch during loading, compression on landing",
    bodyConstraints: ["Full triple extension before feet leave ground", "Soft landing", "Feet land simultaneously"],
    objectPhysics: ["Box is SOLID and stable", "Box is knee to hip height"],
    movementFlow: "Countermovement → explosive triple extension → tuck → soft landing → stand",
  },
  "squat jumps": {
    start: { position: "Deep squat, arms back for momentum", joints: "Knees 75°", weight: "Deep in heels", spine: "Neutral, slight lean", balance: "Loaded bilateral" },
    mid: { position: "Exploding upward, extending rapidly", joints: "Rapidly extending all joints", weight: "Driving through feet", spine: "Extending to vertical", balance: "Transitioning to airborne" },
    peak: { position: "Fully airborne, body extended, arms up", joints: "Full triple extension, toes pointed", weight: "Airborne", spine: "Fully extended", balance: "Vertically aligned" },
    sceneRules: ["No equipment", "Full body visible with headroom for jump"],
    camera: "WIDE full-body shot with generous headroom",
    fabricCue: "Maximum legging stretch at bottom, stretch during jump",
    bodyConstraints: ["Full squat depth before jump", "Triple extension drives jump"],
    objectPhysics: [],
    movementFlow: "Deep squat → explosive extension → max height → soft landing",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, hinged at hips, kettlebell between legs, back flat", joints: "Hips 80°, knees slightly bent", weight: "Posterior loaded, heels", spine: "FLAT back, neutral lumbar", balance: "Weight back in hips" },
    mid: { position: "Explosive hip drive, snapping hips, kettlebell rising", joints: "Hips extending rapidly, arms passive", weight: "Driving through heels", spine: "Rapidly extending to vertical", balance: "Hip momentum creates movement" },
    peak: { position: "Standing tall, kettlebell at chest height, hips locked", joints: "Full hip extension, arms at shoulder height", weight: "Centered, kettlebell floating", spine: "Fully erect, glutes locked", balance: "Standing tall" },
    sceneRules: ["Kettlebell visible and NEVER cut off", "WIDE full-body shot head to toe"],
    camera: "WIDE full-body shot from slight side angle, showing kettlebell arc",
    fabricCue: "Dramatic fabric movement with each swing",
    bodyConstraints: ["HIP HINGE not squat", "Arms are PASSIVE — hips power the swing", "Flat back ALWAYS"],
    objectPhysics: ["Kettlebell follows smooth pendulum arc", "Shows realistic weight"],
    movementFlow: "Backswing hinge → explosive hip snap → float at top → controlled fall back",
  },
  "jump rope": {
    start: { position: "Standing tall, holding rope handles, elbows at sides", joints: "Elbows 90° close to ribs", weight: "Balls of feet", spine: "Tall, vertical", balance: "Light, ready to bounce" },
    mid: { position: "Rope rotating, small bounces on balls of feet", joints: "Ankles extending with each hop", weight: "Light bounces, 1-2 inches", spine: "Vertical and stable", balance: "Feet together, rhythmic" },
    peak: { position: "Fast rhythmic jumping, rope rotating around body", joints: "Rapid ankle-driven bounces, fast wrist rotation", weight: "Light, rhythmic, on balls of feet", spine: "Perfectly still upper body", balance: "Relaxed efficient rhythm" },
    sceneRules: ["Jump rope visible rotating around athlete", "WIDE full-body shot with space for rope"],
    camera: "WIDE full-body shot, head to toe with rope arc space",
    fabricCue: "Shirt bounces with each hop",
    bodyConstraints: ["Arms close to body", "Jumps SMALL (1-2 inches)", "Upper body STILL"],
    objectPhysics: ["Rope forms smooth arc", "Handles at hip height"],
    movementFlow: "Light rhythmic bouncing with wrist-driven rope rotation",
  },
  "running": {
    start: { position: "Standing in running position, slight forward lean", joints: "Neutral, arms at 90°", weight: "Balls of feet", spine: "Slight forward lean", balance: "Ready athletic stance" },
    mid: { position: "Alternating knee drives, opposite arm swing", joints: "Knee 90° hip flexion", weight: "Alternating single-leg", spine: "Stable, minimal rotation", balance: "Contralateral coordination" },
    peak: { position: "Full running stride, high knee drive, powerful arm pump", joints: "Maximum knee lift, full arm swing", weight: "Dynamic single-leg", spine: "Stable and forward-leaning", balance: "Dynamic single-leg balance" },
    sceneRules: ["Running in place", "No treadmill", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe",
    fabricCue: "Shirt bounces with each stride, leggings flex at knees and hips",
    bodyConstraints: ["Contralateral coordination", "Foot strikes under center of mass"],
    objectPhysics: [],
    movementFlow: "Rhythmic alternating stride with efficient arm pump",
  },
  "jumping": {
    start: { position: "Quarter squat, arms drawn back", joints: "Knees 130°, hips 120°", weight: "Balls of feet", spine: "Slight forward lean", balance: "Loaded bilateral" },
    mid: { position: "Exploding upward, arms driving overhead", joints: "Full triple extension", weight: "Leaving ground", spine: "Extending to vertical", balance: "Bilateral launch" },
    peak: { position: "Fully airborne, body extended, arms overhead", joints: "Full extension, toes pointed", weight: "Airborne at peak", spine: "Fully extended", balance: "Vertically aligned" },
    sceneRules: ["No equipment", "Full body visible with headroom"],
    camera: "WIDE full-body shot with generous headroom",
    fabricCue: "Fabric compresses at loading, stretches during jump",
    bodyConstraints: ["Triple extension COMPLETE before feet leave ground", "Landing absorbs impact"],
    objectPhysics: [],
    movementFlow: "Countermovement → explosive triple extension → peak → soft landing",
  },
  "battle ropes": {
    start: { position: "Athletic half-squat, gripping rope ends", joints: "Knees 120°, hips 110°", weight: "Athletic base, heels", spine: "Neutral, slight lean, core braced", balance: "Wide stable base" },
    mid: { position: "Alternating arm waves, creating rope undulation", joints: "Shoulders alternating, elbows bent", weight: "Anchored in legs", spine: "Stable core, minimal rotation", balance: "Lower body stable platform" },
    peak: { position: "Maximum wave amplitude, powerful arm drives", joints: "Full shoulder range, rapid alternation", weight: "Explosive arms, stable squat", spine: "Rigid core transfers force", balance: "Base absorbs reactive forces" },
    sceneRules: ["Battle ropes visible extending to anchor", "WIDE shot showing full rope length"],
    camera: "WIDE full-body shot showing full rope length",
    fabricCue: "Shirt shows rapid movement at shoulders and arms",
    bodyConstraints: ["Lower body ANCHORED in squat", "Core BRACED", "Waves from SHOULDER MOVEMENT"],
    objectPhysics: ["Ropes show WAVE PATTERN", "Waves travel toward anchor", "Rope sag is realistic"],
    movementFlow: "Stable squat base → alternating arm drives → rhythmic wave propagation",
  },
};

// Build biomechanical pose instructions
function buildPoseInstructions(movement: string, angle: string): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];
  if (!def) {
    return `${MOTION_REALISM_PREAMBLE}\n\nThe athlete performs ${movement} with correct biomechanical form. Full body visible head to toe.`;
  }
  const sceneStr = def.sceneRules.join(". ");
  const constraintStr = def.bodyConstraints.join("\n• ");
  const objectStr = def.objectPhysics.length > 0 ? `\nOBJECT PHYSICS:\n• ${def.objectPhysics.join("\n• ")}` : "";

  let angleReinforcement = "";
  const isSide = angle === "side" || angle === "side-left" || angle === "side-right";
  const angleLabel = angle.replace("-", " ").toUpperCase();
  if (key === "bench press") {
    if (angle === "front") angleReinforcement = `\nANGLE: Camera at athlete's feet. Athlete LYING FLAT on bench. HORIZONTAL.`;
    else if (isSide) angleReinforcement = `\nANGLE (${angleLabel}): Camera at ${angle === "side-right" ? "right" : "left"} side of bench. Athlete LYING FLAT, seen from side. HORIZONTAL.`;
    else if (angle === "back") angleReinforcement = `\nANGLE: Camera behind athlete's head. Athlete LYING FLAT on bench. HORIZONTAL.`;
  } else if (key === "pull-ups") {
    angleReinforcement = `\nANGLE (${angleLabel}): Athlete HANGING from bar ABOVE — VERTICAL, feet off ground. Bar at TOP, feet at BOTTOM.`;
  } else if (key === "push-ups") {
    angleReinforcement = `\nANGLE (${angleLabel}): Athlete in HORIZONTAL plank/push-up on FLOOR. Body PARALLEL to ground.`;
  }

  return `${MOTION_REALISM_PREAMBLE}

BIOMECHANICAL DEFINITION for ${movement}:
START: ${def.start.position}. Joints: ${def.start.joints}.
MID: ${def.mid.position}. Joints: ${def.mid.joints}.
PEAK: ${def.peak.position}. Joints: ${def.peak.joints}.

Show MID or PEAK phase — most dynamic moment.

BODY CONSTRAINTS:
• ${constraintStr}
${objectStr}

MOVEMENT FLOW: ${def.movementFlow}
${angleReinforcement}

SCENE: ${sceneStr}. CAMERA: ${def.camera}. GARMENT: ${def.fabricCue}.`;
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
            { type: "text", text: `Remove the background from this image completely. Output ONLY the foreground object (the ${label}) on a fully transparent background. Keep original colors and quality 100% intact.` },
            { type: "image_url", image_url: { url: base64Image } },
          ],
        }],
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const choice = data.choices?.[0]?.message;
      const url = extractImageUrl(choice);
      if (url) return url;
    }
  } catch (e) {
    console.warn(`BG removal error for ${label}:`, e);
  }
  return base64Image;
}

// ── Helper: validate image ──
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
  } catch (e) {
    console.warn(`Validation error for ${angle}:`, e);
  }
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

// Camera position prompts
const CAMERA_POSITIONS: Record<string, string> = {
  "front": "CAMERA: DIRECTLY IN FRONT. Athlete faces camera. We see FRONT of body.",
  "side-left": "CAMERA: 90° LEFT SIDE. TRUE LEFT PROFILE. Athlete does NOT face camera.",
  "side-right": "CAMERA: 90° RIGHT SIDE. TRUE RIGHT PROFILE. Athlete does NOT face camera.",
  "back": "CAMERA: DIRECTLY BEHIND. We see BACK of body. Face NOT visible.",
  "side": "CAMERA: 90° LEFT SIDE. TRUE SIDE VIEW.",
};

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
    const fast = body.fast === true; // FAST MODE: use flash model, skip validation
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

    // Choose image model based on mode
    const imageModel = fast ? MODEL_ROUTER.generate_image_fast : MODEL_ROUTER.generate_image_quality;
    // Reduce retries to prevent timeout: fast=1, quality=2, maxRealism=2
    const MAX_RETRIES = fast ? 1 : 2;
    // Only validate front in quality mode (non-front angles skip validation to prevent stalling)
    const requestedAngle = body.angle;
    const shouldValidate = !fast && requestedAngle === "front" && maxRealismMode;

    console.log(`Mode: ${mode}, Fast: ${fast}, Model: ${imageModel}, MaxRetries: ${MAX_RETRIES}, Validate: ${shouldValidate}`);

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

    if (mode === "analyze" || mode === "full") {
      // Run analysis and physics in parallel
      const [analysisResult, physicsResult] = await Promise.all([
        (async () => {
          try {
            const resp = await fetch(AI_GATEWAY, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: MODEL_ROUTER.analyze,
                messages: [{
                  role: "system",
                  content: `You are an expert activewear analyst. Analyze the garment and return JSON with: fabric_type (string), garment_category (ONLY: "T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"), color_palette (array), stretch_rating (1-10), compression_level ("Low"|"Medium"|"High"), breathability_rating (1-10), recommended_use (array). Return ONLY valid JSON.`,
                }, {
                  role: "user",
                  content: processedGarment
                    ? [{ type: "text", text: `Analyze this athletic garment for "${garmentName}".` }, { type: "image_url", image_url: { url: processedGarment } }]
                    : `Analyze an athletic garment called "${garmentName}" (${gender}, size ${size}).`,
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
                  { role: "system", content: "You are a sportswear physics engine. Return JSON with: stretch_factor, compression_percentage, sweat_absorption, breathability_score, stress_zones, performance_notes. Return ONLY valid JSON." },
                  { role: "user", content: `Garment: ${garmentName}. Athlete: ${gender}, size ${size}, ${bodyType}. Movement: ${movement} at ${intensity}% intensity.` },
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
      ]);

      if (analysisResult) {
        // Validate category
        const validCategories = ["T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"];
        if (!validCategories.includes(analysisResult.garment_category)) {
          analysisResult.garment_category = "T-Shirt";
        }
        garmentAnalysis = analysisResult;
      }
      if (physicsResult) {
        physicsData = { ...physicsData, ...physicsResult };
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

    // ── If mode is "analyze", return early ──
    if (mode === "analyze") {
      return new Response(
        JSON.stringify({
          success: true, mode: "analyze",
          garment_analysis: garmentAnalysis,
          physics: physicsData,
          processedGarment, processedLogo,
          master_scene: masterScene,
          model_router: { analysis: MODEL_ROUTER.analyze, physics: MODEL_ROUTER.describe_physics, background_removal: MODEL_ROUTER.remove_bg },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Generate images ──
    const angles = mode === "generate_angle" && requestedAngle ? [requestedAngle] : ["front", "side-left", "side-right", "back"];
    console.log(`Generating ${angles.join(", ")} (fast: ${fast}, model: ${imageModel})`);

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
            ? `\nLOGO: Placed at "${placementLabel}", visible from ${angle}. Blend into fabric naturally, 8-12cm size.`
            : `\nLOGO: At "${placementLabel}" — NOT visible from ${angle} view.`) : "";

          const garmentCategory = masterScene.garment_lock.garment_category || "activewear";
          const garmentTypeEnforcement = `GARMENT LOCK: The garment is a "${garmentCategory}". This type is IMMUTABLE — never changes.${masterScene.garment_lock.garment_descriptor ? ` ${masterScene.garment_lock.garment_descriptor}` : ""}`;

          const MOTIF_RULES = angle === "front"
            ? `Reproduce any front prints/motifs faithfully.`
            : `Any prints/motifs are FRONT ONLY. ${angle.replace("-", " ")} view must be PLAIN.`;

          const athleteDesc = athleteIdentity
            ? `ATHLETE (LOCKED): ${athleteIdentity.gender}, ${athleteIdentity.body_type}, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style}${athleteIdentity.hair_color ? ` ${athleteIdentity.hair_color} hair (COLOR LOCKED)` : ""}. SAME person in every output.`
            : `ATHLETE: ${gender}, ${bodyType}, size ${size}`;

          const anglePoseInstructions = buildPoseInstructions(movement, angle);
          const motionBlock = motionIntelligencePrompt ? `\n${motionIntelligencePrompt}` : "";
          const maxRealismBlock = maxRealismMode ? `\nMAX REALISM: Every pixel indistinguishable from real photograph. Quality threshold: ${qualityThreshold}%.` : "";

          const cameraPos = CAMERA_POSITIONS[angle] || CAMERA_POSITIONS["front"];
          const angleDisplayName = angle.replace("-", " ").toUpperCase();

          const mainPrompt = `PHOTOREALISTIC SPORTSWEAR — ${angleDisplayName} VIEW

${cameraPos}

MASTER SCENE: ${describeMasterSceneCompact(masterScene)}

${garmentTypeEnforcement}

${athleteDesc}

FRAMING: ZOOM OUT FAR. Full-body, head to toe. Athlete occupies 45-55% of frame height. 20%+ space above head, 15%+ below feet. 9:16 vertical (1080×1920). Camera 4-5m away. All equipment fully visible.

${anglePoseInstructions}
${motionBlock}
${maxRealismBlock}

${MOTIF_RULES}${logoInstructions}

ANTI-ARTIFACT: NO halo/glow around athlete. NO cropping of any body part. Every body part and equipment fully in frame.

Shot on Canon EOS R5, 24mm f/2.8, professional studio lighting. Indistinguishable from real photoshoot. Dark studio background.

STRICT: ${angleDisplayName} PERSPECTIVE ONLY.`;

          const imageResp = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: imageModel,
              modalities: ["image", "text"],
              messages: [{
                role: "user",
                content: processedGarment
                  ? [
                      { type: "text", text: mainPrompt },
                      { type: "image_url", image_url: { url: processedGarment } },
                      ...(processedLogo && showLogoThisAngle ? [{ type: "image_url", image_url: { url: processedLogo } }] : []),
                    ]
                  : mainPrompt,
              }],
            }),
          });

          if (imageResp.ok) {
            const imageData = await imageResp.json();
            const imgUrl = extractImageUrl(imageData.choices?.[0]?.message as Record<string, unknown>);
            if (imgUrl) {
              // Only validate in quality mode (not fast)
              if (shouldValidate) {
                const referenceImageUrl = masterScene.anchor_image_url;
                const validation = await validateImage(imgUrl, LOVABLE_API_KEY, angle, movement, masterScene, referenceImageUrl);
                if (!validation.valid) {
                  console.warn(`Validation failed for ${angle} (attempt ${attempts}): ${validation.issues.join(", ")}`);
                  await new Promise(r => setTimeout(r, 500));
                  continue;
                }
              }
              console.log(`✅ ${angle} generated (attempt ${attempts}, ${fast ? "fast" : "quality"} mode)`);
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
        master_scene: masterScene,
        model_router: {
          analysis: MODEL_ROUTER.analyze, physics: MODEL_ROUTER.describe_physics,
          image_generation: imageModel, background_removal: MODEL_ROUTER.remove_bg,
          image_validation: MODEL_ROUTER.validate_image, video: "runway/gen4-turbo",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-motion error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("429") || message.includes("rate limit")) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
