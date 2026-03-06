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

function getMovementPhases(movement: string, intensity: number): MovementPhase[] {
  const intensityLabel = intensity > 70 ? "explosive" : intensity > 40 ? "controlled" : "slow and deliberate";

  const phaseTemplates: Record<string, MovementPhase[]> = {
    "Squats": [
      { pct: 0, pose: "standing upright, feet shoulder-width apart, arms at sides", muscleState: "relaxed quads and glutes", fabricState: "fabric resting naturally, no tension", jointAngles: "knees straight at 180°, hips neutral", weightShift: "weight centered evenly on both feet" },
      { pct: 10, pose: "slight knee bend beginning, hips initiating backward", muscleState: "quads beginning to engage", fabricState: "very slight stretch at knee area", jointAngles: "knees at 170°, slight hip hinge", weightShift: "weight shifting slightly to heels" },
      { pct: 25, pose: "quarter squat depth, torso leaning forward slightly", muscleState: "quads and glutes actively engaging", fabricState: "noticeable stretch at thighs, compression at hip crease", jointAngles: "knees at 140°, hips at 145°", weightShift: "weight firmly on heels, core braced" },
      { pct: 40, pose: "half squat, thighs at 45° angle", muscleState: "significant quad tension, glute activation", fabricState: "moderate stretch across quads and glutes, fabric pulled taut", jointAngles: "knees at 115°, hips at 110°", weightShift: "weight on mid-foot to heels" },
      { pct: 60, pose: "deep squat, thighs approaching parallel", muscleState: "heavy quad and glute contraction, hamstring stretch", fabricState: "heavy stretch at glutes and outer thigh, compression at knee", jointAngles: "knees at 95°, hips at 85°", weightShift: "weight centered, deep into heels" },
      { pct: 80, pose: "bottom position, thighs parallel or below", muscleState: "maximum contraction, peak tension in quads and glutes", fabricState: "maximum stretch across entire lower body, visible tension lines", jointAngles: "knees at 75°, hips at 70°, deep fold", weightShift: "weight deep into heels, maximum stability" },
      { pct: 90, pose: "beginning to rise, slight upward momentum", muscleState: "explosive quad and glute drive", fabricState: "fabric beginning to release, still stretched", jointAngles: "knees at 90°, hips opening", weightShift: "driving through heels" },
      { pct: 70, pose: "rising through mid-position", muscleState: "sustained quad drive, glutes powering extension", fabricState: "stretch reducing, fabric recovering", jointAngles: "knees at 110°, hips at 120°", weightShift: "weight shifting forward as body rises" },
      { pct: 35, pose: "nearly upright, knees still slightly bent", muscleState: "controlled deceleration, muscles still engaged", fabricState: "fabric mostly relaxed, slight residual tension", jointAngles: "knees at 155°, hips near neutral", weightShift: "weight returning to center" },
      { pct: 5, pose: "returning to start, almost fully upright", muscleState: "muscles settling, post-rep relaxation", fabricState: "fabric returning to resting state", jointAngles: "knees at 175°, hips neutral", weightShift: "weight centered, balanced" },
    ],
    "Deadlifts": [
      { pct: 0, pose: "standing over barbell, knees bent, hips hinged, grip on bar", muscleState: "back and hamstrings pre-tensioned", fabricState: "fabric stretched at lower back and hamstrings", jointAngles: "knees at 130°, hips at 80°, flat back", weightShift: "weight over mid-foot" },
      { pct: 10, pose: "initial pull, bar just leaving ground", muscleState: "posterior chain firing, lats engaged", fabricState: "tension increasing across back and glutes", jointAngles: "knees at 135°, hips at 85°", weightShift: "weight shifting slightly back" },
      { pct: 25, pose: "bar at shin height, legs driving", muscleState: "quads and glutes driving hard", fabricState: "significant stretch at hamstrings and lower back", jointAngles: "knees at 145°, hips at 100°", weightShift: "weight balanced mid-foot" },
      { pct: 40, pose: "bar passing knees, torso rising", muscleState: "glutes and back heavily engaged", fabricState: "fabric taut across entire posterior", jointAngles: "knees at 155°, hips at 120°", weightShift: "driving through heels" },
      { pct: 60, pose: "bar at mid-thigh, nearing lockout", muscleState: "glutes squeezing, back straightening", fabricState: "stretch reducing as body straightens", jointAngles: "knees at 165°, hips at 150°", weightShift: "weight centered" },
      { pct: 80, pose: "full lockout, standing tall with bar", muscleState: "peak contraction, glutes fully squeezed", fabricState: "fabric settled, slight compression at chest", jointAngles: "knees at 180°, hips at 180°, fully extended", weightShift: "weight centered, stable" },
      { pct: 90, pose: "beginning controlled descent", muscleState: "eccentric loading, hamstrings lengthening", fabricState: "fabric beginning to stretch again", jointAngles: "knees at 175°, hips beginning to hinge", weightShift: "weight shifting to toes slightly" },
      { pct: 65, pose: "bar descending past knees", muscleState: "hamstrings under tension, back maintaining position", fabricState: "stretch increasing at posterior chain", jointAngles: "knees at 150°, hips at 130°", weightShift: "controlled descent" },
      { pct: 35, pose: "bar approaching ground", muscleState: "muscles controlling deceleration", fabricState: "significant stretch at hamstrings and back", jointAngles: "knees at 135°, hips at 90°", weightShift: "weight on mid-foot" },
      { pct: 5, pose: "bar nearly touching ground, ready for next rep", muscleState: "muscles resetting with maintained tension", fabricState: "fabric under moderate tension at rest", jointAngles: "knees at 130°, hips at 82°", weightShift: "weight centered" },
    ],
  };

  // Default phases for any movement not specifically mapped
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

  const key = Object.keys(phaseTemplates).find(k => movement.toLowerCase().includes(k.toLowerCase()));
  const phases = key ? phaseTemplates[key] : defaultPhases;

  // Add intensity label to each phase
  return phases.map(p => ({
    ...p,
    pose: `${p.pose} (${intensityLabel} pace)`,
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

DO NOT include: text, watermarks, UI elements, other people, props (except implied barbell for deadlifts)`;

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
