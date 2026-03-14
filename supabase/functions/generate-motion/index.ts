import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ── Smart Model Router ──
// Each task is routed to the best-performing model for that specific job
const MODEL_ROUTER: Record<string, string> = {
  // Garment analysis — fast vision model for structured JSON extraction
  analyze: "google/gemini-3-flash-preview",
  // Reference image generation — PRO model for maximum detail & realism
  generate_image: "google/gemini-3-pro-image-preview",
  // Physics simulation text — fast reasoning model
  describe_physics: "google/gemini-2.5-flash",
  // Background removal — fast image model for clean cutouts
  remove_bg: "google/gemini-3.1-flash-image-preview",
  // Image quality validation — fast vision model to detect hallucinations
  validate_image: "google/gemini-3-flash-preview",
};

// ---------------------------------------------------------------------------
// Exercise Motion Definition System
// Structured 3-phase biomechanical definitions used to guide AI image poses
// ---------------------------------------------------------------------------

interface MotionPhase {
  position: string;
  joints: string;
  weight: string;
}

interface ExerciseMotionDef {
  start: MotionPhase;
  mid: MotionPhase;
  peak: MotionPhase;
  sceneRules: string[];
  camera: string;
  fabricCue: string;
}

const EXERCISE_DEFS: Record<string, ExerciseMotionDef> = {
  "squats": {
    start: { position: "Standing upright, feet shoulder-width, arms at sides", joints: "Knees straight 180°, hips neutral", weight: "Centered on both feet" },
    mid: { position: "Bending knees and hips, lowering body, torso slightly forward", joints: "Knees 120°, hips 110°", weight: "Shifting to heels" },
    peak: { position: "Deep squat, thighs parallel, upright torso, arms forward for balance", joints: "Knees 75°, hips 70°", weight: "Deep into heels" },
    sceneRules: ["Both feet flat on ground", "No equipment", "Full body visible head to toe", "Body never leaves ground"],
    camera: "WIDE full-body shot, head to toe with generous space around athlete, slight low angle, stable tripod",
    fabricCue: "Leggings stretch at quads and glutes, compression at knee crease — show how fabric performs under load",
  },
  "push-ups": {
    start: { position: "High plank, arms extended, body straight line from head to heels", joints: "Elbows straight, wrists under shoulders", weight: "Distributed between hands and toes" },
    mid: { position: "Lowering chest toward ground, elbows bending outward, core tight", joints: "Elbows 90°, shoulders engaged", weight: "Shifting forward slightly" },
    peak: { position: "Chest near floor, body rigid and straight, elbows bent", joints: "Elbows 45-60°, shoulders loaded", weight: "On hands and toes" },
    sceneRules: ["Body on floor level", "No bench or elevated surface", "Full body visible from head to toes in profile", "Body forms straight line at all times"],
    camera: "WIDE full-body shot from low side angle showing entire body from head to toes, stable tripod, never crop any body part",
    fabricCue: "Shirt stretches across upper back and shoulders, compresses at chest — garment behavior clearly visible",
  },
  "deadlifts": {
    start: { position: "Standing behind barbell on floor, hinging at hips to grip bar, flat back, shoulders over bar", joints: "Hips hinged 80°, knees slightly bent 130°, spine neutral", weight: "Mid-foot, loaded into hamstrings" },
    mid: { position: "Pulling barbell off ground, bar close to shins, back angle constant, driving through legs", joints: "Hips and knees extending together, bar past knees", weight: "Shifting from quads to posterior chain" },
    peak: { position: "Full standing lockout, hips fully extended, barbell at hip level, glutes squeezed, chest tall, then controlled lower back to floor", joints: "Knees 180°, hips 180°, fully extended", weight: "Centered, stable at top" },
    sceneRules: ["Barbell MUST be visible on the ground and in hands", "Barbell NEVER cut off at edges", "WIDE full-body shot head to toe", "Feet stay planted", "Bar travels close to body"],
    camera: "WIDE full-body shot from 30° side angle, head to toe with space around athlete, barbell fully visible, stable tripod",
    fabricCue: "Fabric stretches at hamstrings and lower back during pull, shirt tightens across upper back at lockout — garment stretch clearly visible",
  },
  "lunges": {
    start: { position: "Standing upright, feet hip-width apart", joints: "Knees straight, hips neutral", weight: "Centered" },
    mid: { position: "One leg forward, both knees bending, lowering body", joints: "Front knee 110°, back knee 120°", weight: "Split between both feet" },
    peak: { position: "Deep lunge, front thigh parallel, back knee near ground without touching", joints: "Front knee 90°, back knee 90°", weight: "60% front foot, 40% back foot" },
    sceneRules: ["No equipment", "Full body visible head to toe", "Feet on ground", "Upright torso"],
    camera: "WIDE full-body shot, head to toe with space for full stride length, stable tripod",
    fabricCue: "Dramatic stretch at front quad and back hip flexor, compression at bent knee — garment performance clearly visible",
  },
  "pull-ups": {
    start: { position: "Athlete hanging from a horizontal pull-up bar above, arms fully extended overhead, hands gripping bar slightly wider than shoulder width, body vertical, feet slightly behind body", joints: "Shoulders fully extended, elbows straight 180°", weight: "Hanging from hands, body suspended" },
    mid: { position: "Athlete pulling body upward, elbows bending naturally, chest approaching the bar, body remaining vertical", joints: "Elbows 110°, shoulders adducting", weight: "Pulling upward through grip" },
    peak: { position: "Chin above the bar, elbows fully bent, shoulders engaged and depressed, body controlled and stable", joints: "Elbows 45°, shoulders fully contracted", weight: "Suspended at top of pull" },
    sceneRules: ["Pull-up bar MUST be above the athlete", "Athlete MUST hang below the bar", "Bar must NEVER appear behind the neck", "Body must NEVER stand on the floor during the movement", "Full body ALWAYS visible from bar to hanging feet"],
    camera: "WIDE full-body vertical shot showing bar at top and feet at bottom with generous space, stable camera, never crop bar or feet",
    fabricCue: "Back of shirt stretches dramatically showing lat engagement, sleeves compress around biceps — garment stretch clearly visible",
  },
  "bench press": {
    start: { position: "Athlete lying flat on a weight bench, feet flat on floor, hands gripping barbell above chest at full arm extension, shoulder blades pinched together, slight arch in lower back", joints: "Elbows locked out, wrists stacked directly over elbows", weight: "Bar supported at full extension above chest" },
    mid: { position: "Lowering barbell with control toward lower chest, elbows at 45° angle from torso, bar descending slowly, athlete lying on bench", joints: "Elbows 90°, shoulders externally rotated, deep pec stretch", weight: "Bar descending under control to chest" },
    peak: { position: "Explosive press upward, driving barbell off chest, arms extending fully to lockout, athlete still lying flat on bench", joints: "Full elbow extension, chest contracted, bar stable overhead", weight: "Pressing through palms, driving weight upward" },
    sceneRules: ["Weight bench MUST be visible underneath athlete", "Barbell MUST be visible in hands and NEVER cut off", "Athlete MUST be lying on back on bench", "NEVER standing", "NEVER in plank or push-up position", "Feet flat on floor beside bench", "ENTIRE body visible from head to feet including full barbell length"],
    camera: "WIDE full-body shot from slight side angle showing ENTIRE athlete lying on bench from head to feet, barbell fully visible end to end, never crop any part of body or equipment",
    fabricCue: "Shirt stretches across chest during press, fabric tightens at shoulders under load — garment compression clearly visible",
  },
  "sprint": {
    start: { position: "Standing tall, ready position, slight forward lean", joints: "Neutral standing", weight: "Balls of feet" },
    mid: { position: "Sprinting in place, one knee driving high, opposite arm pumping", joints: "Drive knee 90°, opposite elbow 90°", weight: "Alternating single-leg" },
    peak: { position: "Maximum knee drive, explosive arm pump, powerful stride", joints: "Knee at maximum height, full arm extension", weight: "Single-leg power drive" },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, stable tripod",
    fabricCue: "Intense fabric ripple and bounce with each explosive stride — garment motion clearly visible",
  },
  "burpees": {
    start: { position: "Standing upright, arms at sides", joints: "Neutral standing", weight: "Centered" },
    mid: { position: "In plank position, body straight, arms extended, about to perform push-up", joints: "Shoulders over wrists, body rigid", weight: "Hands and toes" },
    peak: { position: "Explosive jump upward, arms reaching overhead, body fully extended in air", joints: "Full extension, arms overhead", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible with generous headroom for jump", "Clear floor space"],
    camera: "WIDE full-body shot from slight side angle, head to toe with extra headroom for jump, stable tripod",
    fabricCue: "Maximum fabric dynamics, stretch at back in plank, compression at chest in push-up, stretch during jump — garment behavior visible throughout",
  },
  "high knees": {
    start: { position: "Standing tall, arms ready", joints: "Neutral", weight: "Centered" },
    mid: { position: "One knee driving up toward chest, opposite arm pumping", joints: "Drive knee 90° hip flexion", weight: "Single-leg stance" },
    peak: { position: "Knee at chest height, rapid alternating rhythm", joints: "Maximum hip flexion, knee tucked", weight: "Quick alternating" },
    sceneRules: ["No equipment", "Standing in place", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space around athlete, stable tripod",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces — garment motion clearly visible",
  },
  "box jumps": {
    start: { position: "Athletic quarter squat facing a plyometric box, arms drawn back, coiling to explode", joints: "Knees 130°, hips 120°, ankles loaded", weight: "Balls of feet, loading posterior chain" },
    mid: { position: "Explosive triple extension, body launching upward, knees tucking to clear box", joints: "Full extension then rapid knee tuck", weight: "Airborne, traveling upward" },
    peak: { position: "Landing softly on top of the box in athletic squat, absorbing impact, then standing tall on box", joints: "Knees 100°, absorbing impact, then full stand", weight: "Soft landing through mid-foot on box surface" },
    sceneRules: ["Plyometric box or platform MUST be visible", "Athlete jumps ONTO the box", "WIDE full-body shot head to toe with headroom", "Box fully visible"],
    camera: "WIDE full-body shot from slight side angle, head to toe including box, generous headroom, stable tripod",
    fabricCue: "Strong fabric stretch during loading crouch, visible compression at knees on soft landing — garment performance clearly visible",
  },
  "squat jumps": {
    start: { position: "Standing, then dropping into full squat", joints: "Knees 75°, deep squat", weight: "Deep in heels" },
    mid: { position: "Exploding upward from squat, body extending", joints: "Rapidly extending all joints", weight: "Driving through feet" },
    peak: { position: "Fully airborne, body extended, arms reaching up", joints: "Full extension in air", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible head to toe with headroom for jump", "Feet leave ground"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable tripod",
    fabricCue: "Maximum legging stretch at squat bottom, fabric stretches along legs during jump — garment behavior clearly visible",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, hinged at hips, kettlebell held with both hands between legs, back flat", joints: "Hips deeply hinged, knees slightly bent, spine neutral", weight: "Posterior loaded, weight in heels" },
    mid: { position: "Explosive hip drive forward, snapping hips, swinging kettlebell upward with momentum from hips", joints: "Hips extending rapidly, knees straightening", weight: "Driving through heels, weight transferring forward" },
    peak: { position: "Standing tall, kettlebell at chest or eye height, hips fully locked out, then controlled swing back down", joints: "Full hip extension, arms relaxed at shoulder height, glutes squeezed", weight: "Centered and tall, kettlebell floating at peak" },
    sceneRules: ["Kettlebell MUST be visible in hands and NEVER cut off", "WIDE full-body shot head to toe", "Hip-driven explosive movement", "Smooth pendulum arc"],
    camera: "WIDE full-body shot from slight side angle, head to toe showing kettlebell arc, never crop equipment, stable tripod",
    fabricCue: "Dramatic fabric movement with each swing cycle, shirt rides during deep hinge — garment motion clearly visible",
  },
  "jump rope": {
    start: { position: "Standing tall, holding jump rope handles, elbows close to body at 90°, wrists ready to rotate", joints: "Elbows 90° close to ribs, wrists active, slight knee bend", weight: "Balls of feet, light and bouncy" },
    mid: { position: "Rope rotating overhead and under feet, small bounces on balls of feet, wrists driving rotation", joints: "Ankles extending with each hop, knees softly bending, wrists spinning rope", weight: "Light bounces, barely leaving ground" },
    peak: { position: "Fast rhythmic jumping, rope visibly rotating around body, feet clearing rope each revolution", joints: "Rapid ankle-driven bounces, minimal knee bend, fast wrist rotation", weight: "Light, rhythmic, athletic cadence" },
    sceneRules: ["Jump rope MUST be visible rotating around the athlete", "WIDE full-body shot head to toe with space for rope arc", "Rhythmic athletic movement"],
    camera: "WIDE full-body shot, head to toe with space for rope arc, stable tripod",
    fabricCue: "Shirt bounces with each hop, calves visible working with each jump — garment behavior clearly visible",
  },
  "running": {
    start: { position: "Standing in running position, slight forward lean", joints: "Neutral", weight: "Balls of feet" },
    mid: { position: "Jogging in place, alternating knee drives, opposite arm swing", joints: "Knee 90° hip flexion, elbow 90°", weight: "Alternating single-leg" },
    peak: { position: "Full running stride, high knee drive, powerful arm pump", joints: "Maximum knee lift, full arm swing", weight: "Dynamic single-leg" },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, stable tripod",
    fabricCue: "Shirt bounces with each stride, leggings flex at knees and hips — garment motion clearly visible",
  },
  "jumping": {
    start: { position: "Quarter squat, arms drawn back", joints: "Knees 130°, hips 120°", weight: "Balls of feet" },
    mid: { position: "Exploding upward, arms driving overhead", joints: "Full extension through ankles, knees, hips", weight: "Leaving ground" },
    peak: { position: "Fully airborne, body extended, arms overhead", joints: "Full body extension", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible head to toe with headroom", "Clean jump"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable tripod",
    fabricCue: "Fabric compresses at crouch, stretches during jump, ripples on landing — garment behavior clearly visible",
  },
};

// Build biomechanical pose instructions for image generation
function buildPoseInstructions(movement: string, angle: string): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];

  if (!def) {
    return `The athlete performs ${movement} with smooth, natural, biomechanically correct form. Full body must be visible head to toe. No equipment.`;
  }

  const sceneStr = def.sceneRules.join(". ");

  // Angle-specific pose reinforcement for exercises where body orientation is critical
  let angleReinforcement = "";
  if (key === "bench press") {
    if (angle === "front") {
      angleReinforcement = `\nANGLE-SPECIFIC (FRONT VIEW): Camera positioned at the athlete's feet looking toward the head. Athlete is LYING FLAT on the bench, face visible, barbell above chest. The bench runs away from camera. Athlete is HORIZONTAL, NOT sitting, NOT standing.`;
    } else if (angle === "side") {
      angleReinforcement = `\nANGLE-SPECIFIC (SIDE VIEW): Camera positioned at the side of the bench. Athlete is LYING FLAT on the bench seen from the side — head on one end, feet on the floor at the other end. The full horizontal body position must be clearly visible. Barbell above chest. Athlete is HORIZONTAL, NOT sitting up, NOT vertical.`;
    } else if (angle === "back") {
      angleReinforcement = `\nANGLE-SPECIFIC (BACK VIEW): Camera positioned behind the athlete's head looking down the bench. Athlete is LYING FLAT on the bench, back of head visible, barbell above chest. Athlete is HORIZONTAL, NOT sitting, NOT standing.`;
    }
  } else if (key === "pull-ups") {
    angleReinforcement = `\nANGLE-SPECIFIC (${angle.toUpperCase()} VIEW): Athlete is HANGING from a bar ABOVE — body is VERTICAL and SUSPENDED, feet off the ground. The bar is at the TOP of the frame, feet at the BOTTOM. Camera shows ${angle} of the hanging athlete.`;
  } else if (key === "push-ups") {
    angleReinforcement = `\nANGLE-SPECIFIC (${angle.toUpperCase()} VIEW): Athlete is in HORIZONTAL plank/push-up position on the FLOOR. Body is PARALLEL to the ground, NOT standing, NOT sitting. Camera shows ${angle} of the athlete on the floor.`;
  }

  return `BIOMECHANICAL MOVEMENT DEFINITION for ${movement}:
START POSITION: ${def.start.position}. Joints: ${def.start.joints}. Weight: ${def.start.weight}.
MID MOVEMENT: ${def.mid.position}. Joints: ${def.mid.joints}. Weight: ${def.mid.weight}.
PEAK POSITION: ${def.peak.position}. Joints: ${def.peak.joints}. Weight: ${def.peak.weight}.

The athlete should be shown at the MID or PEAK phase of this movement — the most dynamic and visually impactful moment.
FULL RANGE OF MOTION: The movement must show COMPLETE range — all the way down AND all the way back up. Never show partial reps.
${angleReinforcement}
SCENE RULES (STRICT): ${sceneStr}.
CAMERA: ${def.camera}.
FABRIC BEHAVIOR: ${def.fabricCue}.

The pose must follow these biomechanical rules EXACTLY. Do NOT guess or improvise the body position.`;
}

// ── Helper: remove background from an image using AI ──
async function removeBackground(base64Image: string, apiKey: string, label: string): Promise<string> {
  console.log(`Removing background from ${label}...`);
  try {
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ROUTER.remove_bg,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Remove the background from this image completely. Output ONLY the foreground object (the ${label}) on a fully transparent background. Keep the original colors, details, and quality of the foreground object 100% intact. Do NOT alter, tint, or recolor any part of the foreground. The result must be a clean cutout with no background remnants, no color bleeding, and no artifacts.`,
              },
              { type: "image_url", image_url: { url: base64Image } },
            ],
          },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const choice = data.choices?.[0]?.message;
      let resultUrl: string | null = null;
      if (choice?.images && Array.isArray(choice.images)) {
        for (const img of choice.images) {
          if (img?.image_url?.url) { resultUrl = img.image_url.url; break; }
        }
      } else if (choice?.content && Array.isArray(choice.content)) {
        for (const part of choice.content) {
          if (part.type === "image_url" && part.image_url?.url) { resultUrl = part.image_url.url; break; }
        }
      }
      if (resultUrl) {
        console.log(`Background removed successfully for ${label}`);
        return resultUrl;
      }
    }
    console.warn(`Background removal failed for ${label}, using original`);
  } catch (e) {
    console.warn(`Background removal error for ${label}:`, e);
  }
  return base64Image;
}

// ── Helper: validate generated image quality ──
async function validateImage(imageUrl: string, apiKey: string, angle: string, movement: string): Promise<{ valid: boolean; issues: string[] }> {
  try {
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ROUTER.validate_image,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `Quickly validate this AI-generated sportswear image. Check for these CRITICAL issues ONLY:
1. CROPPING: Is the full body visible head to toe? (FAIL if legs/feet/head cut off)
2. ANATOMY: Are there obvious anatomical errors? (extra fingers, wrong limb count, distorted face)
3. HALLUCINATION: Is the athlete in a completely wrong pose for "${movement}"?
4. GARMENT: Is the garment obviously wrong (missing, duplicated, floating)?

Return JSON: {"valid": true/false, "issues": ["issue1", "issue2"]}
Be LENIENT — only flag OBVIOUS problems. Minor imperfections are OK.` },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }],
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
  return { valid: true, issues: [] }; // Default to valid if validation fails
}

// ── Helper: extract image from AI response ──
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
    const { garmentName, garmentBase64, gender, size, bodyType, movement, intensity, logoBase64, logoPosition, athleteIdentity } = body;
    const mode = body.mode || "full"; // "analyze" | "generate_angle" | "full" (legacy)

    // ── Step 0: Pre-process uploads – remove backgrounds ──
    console.log("Step 0: Removing backgrounds from uploaded images...");

    // For generate_angle mode, use pre-processed images passed from client
    let processedGarment = body.processedGarment || garmentBase64;
    let processedLogo = body.processedLogo || logoBase64;

    if (mode === "analyze" || mode === "full") {
      const bgRemovalPromises: Promise<string>[] = [];
      bgRemovalPromises.push(
        garmentBase64
          ? removeBackground(garmentBase64, LOVABLE_API_KEY, "garment/clothing")
          : Promise.resolve("")
      );
      bgRemovalPromises.push(
        logoBase64
          ? removeBackground(logoBase64, LOVABLE_API_KEY, "brand logo")
          : Promise.resolve("")
      );

      const [cleanGarment, cleanLogo] = await Promise.all(bgRemovalPromises);
      processedGarment = cleanGarment || garmentBase64;
      processedLogo = cleanLogo || logoBase64;
    }

    console.log("Background removal complete.");

    // ── Step 1: Analyze garment ──
    console.log("Step 1: Analyzing garment...");
    let garmentAnalysis: Record<string, unknown> = body.garmentAnalysis || {
      fabric_type: "High-compression polyester-elastane blend",
      garment_category: "Training T-Shirt",
      color_palette: ["#1a1a1a"],
      stretch_rating: 8,
      compression_level: "High",
      breathability_rating: 7,
      recommended_use: ["HIIT", "Strength", "CrossFit"],
    };

    if (mode === "analyze" || mode === "full") {
      try {
        const analysisResp = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_ROUTER.analyze,
            messages: [
              {
                role: "system",
                content: `You are an expert activewear and sportswear fabric analyst. You ONLY analyze athletic clothing.
IMPORTANT: The image background has been removed (transparent). Focus ONLY on the foreground clothing item. Completely ignore any background remnants, artifacts, or transparency.
Analyze the garment and return JSON with EXACTLY these fields:
- fabric_type: string – describe the actual fabric composition (e.g. "High-compression polyester-elastane blend", "Moisture-wicking nylon mesh"). Be specific about the material.
- garment_category: string (ONLY one of: "T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"). Pick the BEST match for the uploaded athletic clothing.
- color_palette: array of hex strings – analyze the ACTUAL fabric color from the foreground pixels only. If the fabric is black, return ["#1a1a1a"] or similar dark hex. NEVER let background color influence this.
- stretch_rating: number 1-10
- compression_level: string ("Light", "Medium", "High", "Ultra-High")
- breathability_rating: number 1-10
- recommended_use: array of strings (e.g. ["HIIT", "Strength", "Running", "Yoga", "CrossFit", "Cardio"])
ABSOLUTE RULES:
- This is ALWAYS athletic/sportswear clothing. NEVER categorize as jewelry, metal, cufflinks, accessories, or any non-sportswear item.
- The color must reflect the ACTUAL garment fabric, not background or transparency.
- Return ONLY valid JSON, no markdown fences, no extra text.`,
              },
              {
                role: "user",
                content: processedGarment
                  ? [
                      { type: "text", text: `Analyze this uploaded activewear/sportswear garment called "${garmentName}". The background has been removed – focus ONLY on the clothing item itself. This is ALWAYS athletic training clothing. Identify the actual fabric color (ignore background), fabric composition, stretch, compression, breathability. Categorize as one of: T-Shirt, Compression T-Shirt, Leggings, Shorts, Sports Bra, Training Top, Tank Top, Hoodie, Joggers. NEVER categorize as jewelry, metal, cufflinks, or non-sportswear.` },
                      { type: "image_url", image_url: { url: processedGarment } },
                    ]
                  : `Analyze an activewear garment called "${garmentName}". Categorize as activewear. Return analysis JSON.`,
              },
            ],
          }),
        });

        if (analysisResp.ok) {
          const analysisData = await analysisResp.json();
          const content = analysisData.choices?.[0]?.message?.content || "{}";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const validCategories = ["T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"];
            if (parsed.garment_category && !validCategories.includes(parsed.garment_category)) {
              parsed.garment_category = "T-Shirt";
            }
            garmentAnalysis = parsed;
          }
        } else {
          console.error("Analysis failed:", analysisResp.status, await analysisResp.text());
        }
      } catch (e) {
        console.error("Analysis parse error:", e);
      }
    }

    // ── Step 2: Physics description ──
    console.log("Step 2: Generating physics description...");
    let physicsData = body.physicsData || {
      stretch_factor: "4×",
      compression_percentage: 85,
      sweat_absorption: 92,
      breathability_score: 78,
      stress_zones: ["knees", "glutes", "waistband"],
      performance_notes: "Good stretch recovery under load.",
    };

    if (mode === "analyze" || mode === "full") {
      try {
        const physicsResp = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_ROUTER.describe_physics,
            messages: [
              {
                role: "system",
                content: "You are a sportswear physics engine. Given garment details and movement, return JSON with: stretch_factor (e.g. '4x'), compression_percentage (0-100), sweat_absorption (0-100), breathability_score (0-100), stress_zones (array of strings), performance_notes (string). Return ONLY valid JSON.",
              },
              {
                role: "user",
                content: `Garment: ${JSON.stringify(garmentAnalysis)}. Athlete: ${gender}, size ${size}, ${bodyType} build. Movement: ${movement} at ${intensity}% intensity.`,
              },
            ],
          }),
        });

        if (physicsResp.ok) {
          const physicsJson = await physicsResp.json();
          const physContent = physicsJson.choices?.[0]?.message?.content || "{}";
          const jsonMatch = physContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) physicsData = { ...physicsData, ...JSON.parse(jsonMatch[0]) };
        }
      } catch (e) {
        console.error("Physics parse error:", e);
      }
    }

    // ── If mode is "analyze", return early with analysis results ──
    if (mode === "analyze") {
      console.log("Analyze mode complete — returning analysis results.");
      return new Response(
        JSON.stringify({
          success: true,
          mode: "analyze",
          garment_analysis: garmentAnalysis,
          physics: physicsData,
          processedGarment,
          processedLogo,
          model_router: {
            analysis: MODEL_ROUTER.analyze,
            physics: MODEL_ROUTER.describe_physics,
            background_removal: MODEL_ROUTER.remove_bg,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Generate images ──
    // In "generate_angle" mode, only generate the requested angle
    const requestedAngle = body.angle; // e.g. "front", "side", "back"
    const angles = mode === "generate_angle" && requestedAngle ? [requestedAngle] : ["front", "side", "back"];
    console.log(`Step 3: Generating ${angles.join(", ")} images (mode: ${mode})...`);
    const MAX_RETRIES = 3;

    // Get biomechanical pose instructions for this movement
    const poseInstructions = buildPoseInstructions(movement, "front");

    async function generateAngle(angle: string): Promise<string | null> {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        attempts++;
        try {
          console.log(`Generating ${angle} view (attempt ${attempts})...`);

          const useSimplePrompt = attempts >= 2;

          const placementLabel = logoPosition?.placement || "chest-center";
          const isFrontPlacement = placementLabel.startsWith("chest") || placementLabel === "belly-center" || placementLabel === "upper" || placementLabel === "middle";
          const isBackPlacement = placementLabel.startsWith("back");
          const isSleevePlacement = placementLabel.startsWith("sleeve");

          const showLogoThisAngle =
            (angle === "front" && isFrontPlacement) ||
            (angle === "back" && isBackPlacement) ||
            (angle === "side" && isSleevePlacement);

          const logoInstructions = processedLogo ? (showLogoThisAngle
            ? `
LOGO PLACEMENT (CRITICAL):
- The brand logo is placed at "${placementLabel}" on the garment.
- This is the ${angle} view, so the logo IS visible.
- BLEND the logo INTO the fabric naturally: screen-print or heat-transfer look.
- Keep the logo at NATURAL proportional size (8-12cm on real garment).
- Preserve the logo's EXACT original colors.`
            : `
LOGO VISIBILITY:
- The brand logo is at "${placementLabel}" on the ${isFrontPlacement ? "front" : isBackPlacement ? "back" : "sleeve"}.
- This is the ${angle} view — the logo is NOT visible from this angle.
- Do NOT show any logo or branding on this view.`) : "";

          const FRAMING = `FRAMING (CRITICAL — HIGHEST PRIORITY): WIDE full-body shot showing the COMPLETE athlete from head to toe with generous empty space around the body. NEVER crop at waist, torso, or knees. All equipment (barbells, benches, bars) must be FULLY visible and NEVER cut off at edges. The garment must be clearly visible on the ENTIRE body to show how it performs during movement — stretch zones, compression areas, and fabric behavior must all be observable. Camera must be pulled back far enough to show the complete scene.`;

          const MOTIF_RULES = angle === "front"
            ? `EXISTING MOTIFS: Reproduce any front prints/motifs faithfully from the reference — same position, size, colors.`
            : `MOTIF DUPLICATION BAN: Any prints/motifs in the reference are FRONT ONLY. The ${angle} must be COMPLETELY PLAIN — no prints, text, or graphics.`;

          const athleteDesc = athleteIdentity
            ? `ATHLETE IDENTITY (CONSISTENT across ALL angles):
- Gender: ${athleteIdentity.gender}, Height: ${athleteIdentity.height_cm}cm, Weight: ${athleteIdentity.weight_kg}kg
- Body Type: ${athleteIdentity.body_type}, Muscle Density: ${athleteIdentity.muscle_density}/10, Body Fat: ${athleteIdentity.body_fat_pct}%
- Skin Tone: ${athleteIdentity.skin_tone}, Face: ${athleteIdentity.face_structure}, Hair: ${athleteIdentity.hair_style}
You MUST render this EXACT same person in every image.`
            : "";

          const athleteLabel = athleteIdentity
            ? `${athleteIdentity.gender} athlete "${athleteIdentity.name}" (${athleteIdentity.body_type}, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style} hair)`
            : `${gender} athlete (${bodyType}, size ${size})`;

          // Get angle-specific pose instructions
          const anglePoseInstructions = buildPoseInstructions(movement, angle);

          const mainPrompt = useSimplePrompt
            ? `Professional WIDE full-body studio photo: ${athleteLabel} wearing this exact uploaded garment, performing ${movement} at ${intensity}% intensity, ${angle} camera angle. WIDE SHOT showing COMPLETE body head-to-toe with space around athlete. All equipment fully visible. Focus on how the garment stretches and compresses during the movement. Dark background. ${anglePoseInstructions} ${MOTIF_RULES}${logoInstructions}`
            : `PHOTOREALISTIC SPORTSWEAR CAMPAIGN — ${angle.toUpperCase()} VIEW

STRICT REFERENCE FIDELITY: The uploaded garment image is the ABSOLUTE reference. Preserve exact color, fabric weave, texture, seams, stitching, and construction with 100% accuracy. This is a REAL photograph, not an illustration or render.

${MOTIF_RULES}
${FRAMING}
${athleteDesc}

${anglePoseInstructions}

SUBJECT: ${athleteLabel}, size ${size}, wearing EXACTLY this uploaded garment performing ${movement} at ${intensity}% intensity.

PHOTOREALISM REQUIREMENTS:
- Shot on a Canon EOS R5 with 85mm f/1.4 lens — shallow depth of field, cinematic studio lighting
- Skin must show natural pores, subtle sheen from exertion, realistic muscle definition under skin
- Garment must show real fabric behavior: thread-level texture, natural drape, visible seam construction
- Natural micro-details: slight fabric wrinkles at joints, compression shadows, stretch highlights
- ${angle !== "front" ? `The ${angle} of the garment must be COMPLETELY PLAIN — no prints, text, or graphics` : "Faithfully reproduce existing prints/motifs from reference"}
- Dark studio background with 3-point professional lighting setup
- This must be INDISTINGUISHABLE from a real photoshoot
${logoInstructions}`;

          const imageResp = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL_ROUTER.generate_image,
              modalities: ["image", "text"],
              messages: [
                {
                  role: "user",
                  content: processedGarment
                    ? [
                        { type: "text", text: mainPrompt },
                        { type: "image_url", image_url: { url: processedGarment } },
                        ...(processedLogo && showLogoThisAngle ? [{ type: "image_url", image_url: { url: processedLogo } }] : []),
                      ]
                    : `Studio photo: ${gender} athlete (${bodyType}, size ${size}) wearing dark athletic activewear performing ${movement} at ${intensity}% intensity. ${angle} view. Dark background, professional sportswear photography.`,
                },
              ],
            }),
          });

          if (imageResp.ok) {
            const imageData = await imageResp.json();
            const choice = imageData.choices?.[0]?.message;
            const imgUrl = extractImageFromResponse(choice as Record<string, unknown>);

            if (imgUrl) {
              // Validate on first attempt only (to avoid slowing retries)
              if (attempts === 1) {
                const validation = await validateImage(imgUrl, LOVABLE_API_KEY, angle, movement);
                if (!validation.valid) {
                  console.warn(`Image validation failed for ${angle}: ${validation.issues.join(", ")} — retrying`);
                  await new Promise(r => setTimeout(r, 1000));
                  continue; // retry with next attempt
                }
              }
              console.log(`✅ ${angle} view generated & validated (attempt ${attempts})`);
              return imgUrl;
            } else {
              console.warn(`No image in response for ${angle} (attempt ${attempts})`);
            }
          } else {
            const errText = await imageResp.text();
            console.error(`Image gen failed for ${angle}:`, imageResp.status, errText);
          }

          if (attempts < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch (e) {
          console.error(`Image gen error for ${angle} (attempt ${attempts}):`, e);
        }
      }
      return null;
    }

    // Generate angles sequentially to avoid rate-limit issues
    const angleResults: (string | null)[] = [];
    for (const angle of angles) {
      const result = await generateAngle(angle);
      angleResults.push(result);
    }
    const generatedImages: Record<string, string | null> = {};
    angles.forEach((a, i) => { generatedImages[a] = angleResults[i]; });

    // ── Step 4: Store results ──
    console.log("Step 4: Storing results...");

    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    let brandId = brand?.id;
    if (!brandId) {
      const { data: newBrand } = await supabase
        .from("brands")
        .insert({ owner_id: user.id, name: "My Brand" })
        .select("id")
        .single();
      brandId = newBrand?.id;
    }

    let projectId: string | null = null;
    if (brandId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("brand_id", brandId)
        .limit(1)
        .single();

      if (project) {
        projectId = project.id;
      } else {
        const { data: newProject } = await supabase
          .from("projects")
          .insert({ brand_id: brandId, name: "Default Project" })
          .select("id")
          .single();
        projectId = newProject?.id || null;
      }

      await supabase.from("usage_logs").insert({
        user_id: user.id,
        brand_id: brandId,
        action: "generate_motion",
        credits_used: 1,
        metadata: { movement, intensity, gender, size, bodyType, garmentName },
      });
    }

    // Upload generated images to storage
    const storedImageUrls: Record<string, string> = {};
    for (const [angle, imgData] of Object.entries(generatedImages)) {
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${angle}.png`;

          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("generated-images")
              .getPublicUrl(fileName);
            storedImageUrls[angle] = urlData.publicUrl;
          }
        } catch (e) {
          console.error(`Storage upload error for ${angle}:`, e);
        }
      }
    }

    const firstImageUrl = Object.values(storedImageUrls)[0] || null;

    if (brandId && projectId) {
      await supabase.from("assets").insert({
        brand_id: brandId,
        project_id: projectId,
        name: `${garmentName} - ${movement}`,
        type: "generated",
        status: "completed",
        thumbnail_url: firstImageUrl,
        physics_settings: physicsData,
        motion_settings: { movement, intensity },
        metadata: {
          garment_analysis: garmentAnalysis,
          athlete: { gender, size, bodyType },
          images: storedImageUrls,
          raw_images: {
            front: !!generatedImages.front,
            side: !!generatedImages.side,
            back: !!generatedImages.back,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        garment_analysis: garmentAnalysis,
        physics: physicsData,
        images: generatedImages,
        stored_urls: storedImageUrls,
        model_router: {
          analysis: MODEL_ROUTER.analyze,
          physics: MODEL_ROUTER.describe_physics,
          image_generation: MODEL_ROUTER.generate_image,
          background_removal: MODEL_ROUTER.remove_bg,
          image_validation: MODEL_ROUTER.validate_image,
          video: "runway/gen4-turbo",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-motion error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message.includes("429") || message.includes("rate limit")) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
