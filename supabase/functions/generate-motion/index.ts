import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MODEL_ROUTER: Record<string, string> = {
  analyze: "google/gemini-3-flash-preview",
  generate_image: "google/gemini-2.5-flash-image",
  describe_physics: "google/gemini-2.5-flash",
  remove_bg: "google/gemini-2.5-flash-image",
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
    sceneRules: ["Both feet flat on ground", "No equipment", "Full body visible", "Body never leaves ground"],
    camera: "Stable medium shot, slight low angle, full body head to toe",
    fabricCue: "Leggings stretch at quads and glutes, compression at knee crease",
  },
  "push-ups": {
    start: { position: "High plank, arms extended, body straight line from head to heels", joints: "Elbows straight, wrists under shoulders", weight: "Distributed between hands and toes" },
    mid: { position: "Lowering chest toward ground, elbows bending outward, core tight", joints: "Elbows 90°, shoulders engaged", weight: "Shifting forward slightly" },
    peak: { position: "Chest near floor, body rigid and straight, elbows bent", joints: "Elbows 45-60°, shoulders loaded", weight: "On hands and toes" },
    sceneRules: ["Body on floor level", "No bench or elevated surface", "Full body visible in profile", "Body forms straight line at all times"],
    camera: "Stable low side angle, full body in profile, static tripod",
    fabricCue: "Shirt stretches across upper back and shoulders, compresses at chest",
  },
  "deadlifts": {
    start: { position: "Standing tall, then hinging forward at hips, flat back, hands reaching toward shins", joints: "Hips hinged 80°, knees slightly bent 130°", weight: "Mid-foot" },
    mid: { position: "Torso at 45° angle, back flat, arms hanging straight down", joints: "Hips 100°, knees 140°", weight: "Balanced mid-foot to heels" },
    peak: { position: "Full standing lockout, hips fully extended, glutes squeezed, chest tall", joints: "Knees 180°, hips 180°, fully extended", weight: "Centered, stable" },
    sceneRules: ["No barbell", "No weights", "Bodyweight hip hinge only", "Full body visible", "Feet stay on ground"],
    camera: "Stable medium shot from 30° side angle, full body head to toe",
    fabricCue: "Fabric stretches at hamstrings and lower back during hinge, releases on extension",
  },
  "lunges": {
    start: { position: "Standing upright, feet hip-width apart", joints: "Knees straight, hips neutral", weight: "Centered" },
    mid: { position: "One leg forward, both knees bending, lowering body", joints: "Front knee 110°, back knee 120°", weight: "Split between both feet" },
    peak: { position: "Deep lunge, front thigh parallel, back knee near ground without touching", joints: "Front knee 90°, back knee 90°", weight: "60% front foot, 40% back foot" },
    sceneRules: ["No equipment", "Full body visible", "Feet on ground", "Upright torso"],
    camera: "Stable medium shot, slight angle, full body head to feet",
    fabricCue: "Dramatic stretch at front quad and back hip flexor, compression at bent knee",
  },
  "pull-ups": {
    start: { position: "Athlete hanging from a horizontal pull-up bar above, arms fully extended overhead, hands gripping bar slightly wider than shoulder width, body vertical, feet slightly behind body", joints: "Shoulders fully extended, elbows straight 180°", weight: "Hanging from hands, body suspended" },
    mid: { position: "Athlete pulling body upward, elbows bending naturally, chest approaching the bar, body remaining vertical", joints: "Elbows 110°, shoulders adducting", weight: "Pulling upward through grip" },
    peak: { position: "Chin above the bar, elbows fully bent, shoulders engaged and depressed, body controlled and stable", joints: "Elbows 45°, shoulders fully contracted", weight: "Suspended at top of pull" },
    sceneRules: ["Pull-up bar MUST be above the athlete", "Athlete MUST hang below the bar", "Bar must NEVER appear behind the neck", "Body must NEVER stand on the floor during the movement", "Full body must ALWAYS be visible including feet hanging", "No other equipment"],
    camera: "Full body visible, stable camera, centered athlete, vertical framing showing bar above and feet below",
    fabricCue: "Back of shirt stretches dramatically showing lat engagement, sleeves compress around biceps at top",
  },
  "bench press": {
    start: { position: "Lying on ground floor press position, arms extended upward", joints: "Elbows straight, shoulders neutral", weight: "Back flat on ground" },
    mid: { position: "Arms lowering, elbows bending outward, upper arms approaching ground", joints: "Elbows 100°, shoulders externally rotated", weight: "Back pressed into ground" },
    peak: { position: "Upper arms touching floor, elbows at 90°, chest stretched", joints: "Elbows 90°, deep chest stretch", weight: "Stable on ground" },
    sceneRules: ["No bench", "No barbell", "No weights", "Floor press only", "Full body visible"],
    camera: "Stable slight side angle, framing upper body and arms",
    fabricCue: "Shirt stretches across chest, bunches at armpits when arms lowered",
  },
  "sprint": {
    start: { position: "Standing tall, ready position, slight forward lean", joints: "Neutral standing", weight: "Balls of feet" },
    mid: { position: "Sprinting in place, one knee driving high, opposite arm pumping", joints: "Drive knee 90°, opposite elbow 90°", weight: "Alternating single-leg" },
    peak: { position: "Maximum knee drive, explosive arm pump, powerful stride", joints: "Knee at maximum height, full arm extension", weight: "Single-leg power drive" },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible"],
    camera: "Stable medium shot, full body, static camera",
    fabricCue: "Intense fabric ripple and bounce with each explosive stride",
  },
  "burpees": {
    start: { position: "Standing upright, arms at sides", joints: "Neutral standing", weight: "Centered" },
    mid: { position: "In plank position, body straight, arms extended, about to perform push-up", joints: "Shoulders over wrists, body rigid", weight: "Hands and toes" },
    peak: { position: "Explosive jump upward, arms reaching overhead, body fully extended in air", joints: "Full extension, arms overhead", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible with headroom for jump", "Clear floor space"],
    camera: "Stable medium-wide shot from slight side angle, full body with jump room",
    fabricCue: "Maximum fabric dynamics, stretch at back in plank, compression at chest in push-up, stretch during jump",
  },
  "high knees": {
    start: { position: "Standing tall, arms ready", joints: "Neutral", weight: "Centered" },
    mid: { position: "One knee driving up toward chest, opposite arm pumping", joints: "Drive knee 90° hip flexion", weight: "Single-leg stance" },
    peak: { position: "Knee at chest height, rapid alternating rhythm", joints: "Maximum hip flexion, knee tucked", weight: "Quick alternating" },
    sceneRules: ["No equipment", "Standing in place", "Full body visible"],
    camera: "Stable medium shot, thighs to head, locked camera",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces with rapid movement",
  },
  "box jumps": {
    start: { position: "Quarter squat, arms drawn back, ready to explode", joints: "Knees 130°, hips 120°", weight: "Balls of feet" },
    mid: { position: "Airborne, body rising, knees tucking slightly", joints: "Full extension transitioning to tuck", weight: "Airborne" },
    peak: { position: "Landing in soft squat on imaginary elevated surface", joints: "Knees 100°, absorbing impact", weight: "Landing through mid-foot" },
    sceneRules: ["No actual box", "Jumping upward and forward", "Full body visible with headroom"],
    camera: "Stable medium-wide shot from slight side angle, full body",
    fabricCue: "Strong fabric stretch during crouch, visible compression at knees on landing",
  },
  "squat jumps": {
    start: { position: "Standing, then dropping into full squat", joints: "Knees 75°, deep squat", weight: "Deep in heels" },
    mid: { position: "Exploding upward from squat, body extending", joints: "Rapidly extending all joints", weight: "Driving through feet" },
    peak: { position: "Fully airborne, body extended, arms reaching up", joints: "Full extension in air", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body with headroom for jump", "Feet leave ground"],
    camera: "Stable medium shot, full body with headroom",
    fabricCue: "Maximum legging stretch at squat bottom, fabric stretches along legs during jump",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, arms hanging forward, hinged at hips with arms between legs", joints: "Hips deeply hinged, knees slightly bent", weight: "In heels, posterior loaded" },
    mid: { position: "Driving hips forward explosively, swinging arms upward", joints: "Hips extending rapidly, knees straightening", weight: "Driving through heels" },
    peak: { position: "Standing tall, arms at chest height, hips fully extended", joints: "Full hip extension, arms at shoulder height", weight: "Centered, tall" },
    sceneRules: ["No actual kettlebell", "No weights", "Bodyweight hip swing motion only", "Full body visible"],
    camera: "Stable medium shot from slight side angle, full body",
    fabricCue: "Dramatic fabric movement with each swing cycle, shirt rides during hinge",
  },
  "jump rope": {
    start: { position: "Standing tall, arms at sides with elbows bent, wrists rotating", joints: "Elbows 90°, wrists active", weight: "Balls of feet" },
    mid: { position: "Slight hop, feet just leaving ground, arms rotating", joints: "Ankles extended, slight knee bend", weight: "Launching from toes" },
    peak: { position: "Airborne by a few inches, wrists completing rotation", joints: "Full ankle extension, knees slightly bent", weight: "Airborne" },
    sceneRules: ["No actual jump rope", "No equipment", "Bodyweight jumping motion", "Full body visible"],
    camera: "Stable medium shot, full body, static camera",
    fabricCue: "Shirt bounces with each hop, fabric shows subtle rhythmic movement",
  },
  "running": {
    start: { position: "Standing in running position, slight forward lean", joints: "Neutral", weight: "Balls of feet" },
    mid: { position: "Jogging in place, alternating knee drives, opposite arm swing", joints: "Knee 90° hip flexion, elbow 90°", weight: "Alternating single-leg" },
    peak: { position: "Full running stride, high knee drive, powerful arm pump", joints: "Maximum knee lift, full arm swing", weight: "Dynamic single-leg" },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible"],
    camera: "Stable medium shot, full body, static camera",
    fabricCue: "Shirt bounces with each stride, leggings flex at knees and hips",
  },
  "jumping": {
    start: { position: "Quarter squat, arms drawn back", joints: "Knees 130°, hips 120°", weight: "Balls of feet" },
    mid: { position: "Exploding upward, arms driving overhead", joints: "Full extension through ankles, knees, hips", weight: "Leaving ground" },
    peak: { position: "Fully airborne, body extended, arms overhead", joints: "Full body extension", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible with headroom", "Clean jump"],
    camera: "Stable medium-wide shot, full body with headroom",
    fabricCue: "Fabric compresses at crouch, stretches during jump, ripples on landing",
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

  return `BIOMECHANICAL MOVEMENT DEFINITION for ${movement}:
START POSITION: ${def.start.position}. Joints: ${def.start.joints}. Weight: ${def.start.weight}.
MID MOVEMENT: ${def.mid.position}. Joints: ${def.mid.joints}. Weight: ${def.mid.weight}.
PEAK POSITION: ${def.peak.position}. Joints: ${def.peak.joints}. Weight: ${def.peak.weight}.

The athlete should be shown at the MID or PEAK phase of this movement — the most dynamic and visually impactful moment.

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

    const { garmentName, garmentBase64, gender, size, bodyType, movement, intensity, logoBase64, logoPosition, athleteIdentity } = await req.json();

    // ── Step 0: Pre-process uploads – remove backgrounds ──
    console.log("Step 0: Removing backgrounds from uploaded images...");

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
    const processedGarment = cleanGarment || garmentBase64;
    const processedLogo = cleanLogo || logoBase64;

    console.log("Background removal complete.");

    // ── Step 1: Analyze garment ──
    console.log("Step 1: Analyzing garment...");
    let garmentAnalysis: Record<string, unknown> = {
      fabric_type: "High-compression polyester-elastane blend",
      garment_category: "Training T-Shirt",
      color_palette: ["#1a1a1a"],
      stretch_rating: 8,
      compression_level: "High",
      breathability_rating: 7,
      recommended_use: ["HIIT", "Strength", "CrossFit"],
    };

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

    // ── Step 2: Physics description ──
    console.log("Step 2: Generating physics description...");
    let physicsData = {
      stretch_factor: "4×",
      compression_percentage: 85,
      sweat_absorption: 92,
      breathability_score: 78,
      stress_zones: ["knees", "glutes", "waistband"],
      performance_notes: "Good stretch recovery under load.",
    };

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

    // ── Step 3: Generate multi-angle images ──
    console.log("Step 3: Generating motion images...");
    const angles = ["front", "side", "back"];
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

          const FRAMING = `FRAMING (CRITICAL): Show COMPLETE athlete from head to toe. Full-body framing — never crop at waist or torso.`;

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
            ? `Professional full-body studio photo: ${athleteLabel} wearing this exact uploaded garment, performing ${movement} at ${intensity}% intensity, ${angle} camera angle. FULL BODY head-to-toe framing. Dark background. ${anglePoseInstructions} ${MOTIF_RULES}${logoInstructions}`
            : `CRITICAL INSTRUCTIONS:
1. GARMENT REFERENCE: Preserve exact color, fabric texture, seams, and details from uploaded image with 100% fidelity.
2. ${MOTIF_RULES}
3. CAMERA ANGLE: ${angle.toUpperCase()} view.
4. ${FRAMING}
${athleteDesc ? `5. ${athleteDesc}` : ""}

${anglePoseInstructions}

Generate a professional FULL-BODY studio photo of ${athleteLabel}, size ${size}, wearing EXACTLY this uploaded garment while performing ${movement} at ${intensity}% intensity.

Requirements:
- ${angle.toUpperCase()} camera angle
- FULL-BODY framing: head to toe visible
- Garment color and fabric must match reference EXACTLY
- ${angle !== "front" ? `The ${angle} of the garment must be COMPLETELY PLAIN` : "Faithfully reproduce existing prints/motifs from reference"}
- Realistic stretch, compression, and motion physics for ${movement}
- Dark studio background with dramatic lighting
- Professional sportswear campaign quality
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
              console.log(`Got image for ${angle}`);
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
