import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

// ---------------------------------------------------------------------------
// Exercise Motion Definition System
// Each exercise has 3 biomechanical phases, scene rules, and camera framing
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
    fabricCue: "Intense fabric ripple and bounce with each explosive stride, dynamic stretch at hip and quad",
  },
  "burpees": {
    start: { position: "Standing upright, arms at sides", joints: "Neutral standing", weight: "Centered" },
    mid: { position: "In plank position, body straight, arms extended, about to perform push-up", joints: "Shoulders over wrists, body rigid", weight: "Hands and toes" },
    peak: { position: "Explosive jump upward, arms reaching overhead, body fully extended in air", joints: "Full extension, arms overhead", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible with headroom for jump", "Clear floor space"],
    camera: "Stable medium-wide shot from slight side angle, full body with jump room",
    fabricCue: "Maximum fabric dynamics through all phases, stretch at back in plank, compression at chest in push-up, stretch during jump",
  },
  "high knees": {
    start: { position: "Standing tall, arms ready", joints: "Neutral", weight: "Centered" },
    mid: { position: "One knee driving up toward chest, opposite arm pumping", joints: "Drive knee 90° hip flexion", weight: "Single-leg stance" },
    peak: { position: "Knee at chest height, rapid alternating rhythm", joints: "Maximum hip flexion, knee tucked", weight: "Quick alternating" },
    sceneRules: ["No equipment", "Standing in place", "Full body visible"],
    camera: "Stable medium shot, thighs to head, locked camera",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces with rapid movement",
  },
  "mountain climbers": {
    start: { position: "High plank position, arms extended, body straight", joints: "Shoulders over wrists, core engaged", weight: "Hands and toes" },
    mid: { position: "One knee driving toward chest, other leg extended", joints: "Drive knee toward chest, hip flexion", weight: "Hands and one foot" },
    peak: { position: "Knee at chest, rapid switch to other leg", joints: "Maximum hip flexion on drive leg", weight: "Dynamic alternating" },
    sceneRules: ["No equipment", "Plank position on floor", "Full body visible"],
    camera: "Stable low-angle side shot, full body in plank",
    fabricCue: "Shirt stretches across back, leggings show dynamic stretch at hip flexors",
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
  "plank": {
    start: { position: "Lowering into forearm plank, body forming straight line", joints: "Elbows 90° under shoulders", weight: "Forearms and toes" },
    mid: { position: "Holding plank, core visibly engaged, subtle breathing movement", joints: "Stable elbows, rigid body line", weight: "Evenly distributed forearms and toes" },
    peak: { position: "Sustained hold, micro-adjustments in balance, controlled breathing", joints: "Maintaining perfect alignment", weight: "Stable isometric hold" },
    sceneRules: ["No equipment", "On floor", "Full body visible in profile", "Body maintains straight line"],
    camera: "Stable low-angle side shot, full body profile",
    fabricCue: "Shirt drapes with gravity, fabric tension across engaged back and shoulders",
  },
  "warrior pose": {
    start: { position: "Stepping into wide stance, beginning to bend front knee", joints: "Front knee starting to bend, back leg straight", weight: "Splitting between both feet" },
    mid: { position: "Front knee at 90°, back leg straight, arms extending", joints: "Front knee 90°, back hip open", weight: "60% front, 40% back" },
    peak: { position: "Full warrior pose held, arms overhead or extended, steady balance", joints: "Deep front knee, open hips, extended spine", weight: "Grounded and balanced" },
    sceneRules: ["No equipment", "Full body visible", "Stable standing pose", "No mat required"],
    camera: "Stable medium shot, slight front angle, full body",
    fabricCue: "Deep stretch at inner thigh and hip of back leg, shirt lifts slightly with raised arms",
  },
  "downward dog": {
    start: { position: "On all fours, hands and knees on ground", joints: "Shoulders over wrists, hips over knees", weight: "Hands and knees" },
    mid: { position: "Pressing hips up and back, legs beginning to straighten", joints: "Hips flexing, knees extending", weight: "Shifting to hands and feet" },
    peak: { position: "Full inverted V shape, hips high, arms and legs extended, heels pressing toward ground", joints: "Shoulders open, hips flexed, knees extended", weight: "Balanced between hands and feet" },
    sceneRules: ["No equipment", "No mat visible", "Full body visible in inverted V", "Head between arms"],
    camera: "Stable medium shot from the side, full inverted-V body position",
    fabricCue: "Shirt falls toward head with gravity, leggings stretch along hamstrings",
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
    peak: { position: "Airborne by a few inches, wrists completing rotation", joints: "Full ankle extension, knees slightly bent", weight: "Airborne, about to land" },
    sceneRules: ["No actual jump rope", "No equipment", "Bodyweight jumping motion", "Full body visible"],
    camera: "Stable medium shot, full body, static camera",
    fabricCue: "Shirt bounces with each hop, fabric shows subtle rhythmic movement",
  },
  "tree pose": {
    start: { position: "Standing on one leg, other foot lifting toward inner thigh", joints: "Standing knee straight, lifted knee opening outward", weight: "Single-leg balance" },
    mid: { position: "Foot placed on inner thigh of standing leg, arms rising", joints: "Hip externally rotated, standing leg stable", weight: "Centered on standing foot" },
    peak: { position: "Full tree pose, arms overhead in prayer, balanced and still", joints: "Open hip, extended spine, arms overhead", weight: "Single-leg, centered and stable" },
    sceneRules: ["No equipment", "Full body visible", "Single-leg balance pose"],
    camera: "Stable medium shot, slight front angle, full body",
    fabricCue: "Leggings show stretch at open hip, fabric drapes naturally in stillness",
  },
  "sun salutation": {
    start: { position: "Standing tall in mountain pose, palms together at chest", joints: "Neutral standing, spine extended", weight: "Centered on both feet" },
    mid: { position: "Forward fold, hands reaching toward ground, spine flexed", joints: "Deep hip flexion, spine flexed forward", weight: "Shifting forward" },
    peak: { position: "Upward salute, arms reaching overhead, slight backbend, chest open", joints: "Spine extended, shoulders flexed overhead", weight: "Grounded through feet" },
    sceneRules: ["No equipment", "No mat visible", "Full body visible", "Flowing yoga sequence"],
    camera: "Stable medium shot from slight side angle, full body",
    fabricCue: "Shirt lifts and drapes with overhead reach, fabric follows body through transitions",
  },
  "cobra": {
    start: { position: "Lying face down, hands beside chest, forehead on ground", joints: "Prone position, elbows bent beside body", weight: "Fully on ground" },
    mid: { position: "Pressing upper body up, chest lifting, hips on ground", joints: "Spine extending, elbows partially straightening", weight: "Hands and hips on ground" },
    peak: { position: "Upper body fully lifted, arms extended, chest open, hips grounded", joints: "Full spinal extension, arms straight or nearly straight", weight: "Hands and pelvis on ground" },
    sceneRules: ["No equipment", "On floor", "Full body visible", "Hips stay on ground"],
    camera: "Stable low-angle side shot, full body on ground",
    fabricCue: "Shirt stretches across extended back, fabric compresses at waist",
  },
  "thrusters": {
    start: { position: "Deep squat position, arms at shoulders as if holding imaginary weight", joints: "Knees 75°, deep squat, arms at shoulder height", weight: "Deep in heels" },
    mid: { position: "Driving up from squat, arms beginning to press overhead", joints: "Knees extending, arms pushing up", weight: "Driving through heels" },
    peak: { position: "Full standing extension, arms locked out overhead", joints: "Full knee and hip extension, shoulders flexed overhead", weight: "Centered, tall" },
    sceneRules: ["No barbell", "No weights", "Bodyweight only", "Full body visible with overhead room"],
    camera: "Stable medium shot, full body with headroom for arm extension",
    fabricCue: "Leggings stretch at squat, shirt lifts with overhead press, fabric shows full range of motion",
  },
  "battle ropes": {
    start: { position: "Athletic stance, slight squat, arms forward holding imaginary ropes at hip height", joints: "Knees slightly bent, hips hinged, arms extended", weight: "Athletic base, slight forward lean" },
    mid: { position: "Arms alternating up and down in wave motion, core engaged", joints: "Shoulders alternating flexion/extension, core braced", weight: "Stable base, power from hips" },
    peak: { position: "Maximum arm amplitude, powerful alternating waves", joints: "Full shoulder range of motion, rapid alternation", weight: "Grounded, explosive upper body" },
    sceneRules: ["No actual ropes", "No equipment", "Bodyweight arm wave motion", "Full body visible"],
    camera: "Stable medium shot from front, full body",
    fabricCue: "Shirt moves dynamically with rapid arm motion, sleeves shift with each wave",
  },
  "skaters": {
    start: { position: "Standing on one leg, other leg crossing behind, slight lateral lean", joints: "Standing knee slightly bent, body leaning laterally", weight: "Single-leg, lateral" },
    mid: { position: "Jumping laterally, body airborne, switching legs", joints: "Full lateral extension, legs switching", weight: "Airborne, moving laterally" },
    peak: { position: "Landing on opposite leg, deep single-leg squat, opposite leg behind", joints: "Landing knee 110°, hip stabilizing", weight: "Single-leg landing, controlled" },
    sceneRules: ["No equipment", "Full body visible", "Lateral movement", "Feet on ground or briefly airborne"],
    camera: "Stable medium-wide shot from front, full body visible",
    fabricCue: "Fabric stretches laterally at hips and inner thighs, visible dynamic compression on landing leg",
  },
  "tuck jumps": {
    start: { position: "Standing, slight squat prep, arms ready", joints: "Knees 130°, ready to explode", weight: "Balls of feet" },
    mid: { position: "Airborne, knees tucking toward chest, arms pulling up", joints: "Maximum hip and knee flexion in air", weight: "Airborne" },
    peak: { position: "Peak height, knees fully tucked to chest, body compact", joints: "Knees at chest, maximum tuck", weight: "Airborne at peak" },
    sceneRules: ["No equipment", "Full body visible with significant headroom", "Feet leave ground clearly"],
    camera: "Stable medium-wide shot, full body with headroom for jump",
    fabricCue: "Leggings stretch dramatically at peak tuck, shirt rides up during jump, fabric ripples on landing",
  },
  "running": {
    start: { position: "Standing in running position, slight forward lean", joints: "Neutral, ready to move", weight: "Balls of feet" },
    mid: { position: "Jogging in place, alternating knee drives, opposite arm swing", joints: "Knee 90° hip flexion, elbow 90°", weight: "Alternating single-leg" },
    peak: { position: "Full running stride, high knee drive, powerful arm pump", joints: "Maximum knee lift, full arm swing", weight: "Dynamic single-leg" },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible"],
    camera: "Stable medium shot, full body, static camera",
    fabricCue: "Shirt bounces with each stride, leggings flex at knees and hips",
  },
  "jumping": {
    start: { position: "Quarter squat, arms drawn back", joints: "Knees 130°, hips 120°", weight: "Balls of feet" },
    mid: { position: "Exploding upward, body extending, arms driving overhead", joints: "Full extension through ankles, knees, hips", weight: "Leaving ground" },
    peak: { position: "Fully airborne, body extended, arms overhead", joints: "Full body extension at peak height", weight: "Airborne" },
    sceneRules: ["No equipment", "Full body visible with headroom", "Clean jump"],
    camera: "Stable medium-wide shot, full body with headroom",
    fabricCue: "Fabric compresses at crouch, stretches along body during jump, ripples on landing",
  },
};

// Build a concise motion prompt from the definition
function buildMotionPrompt(
  movement: string,
  intensity: number,
  gender: string,
  bodyType: string,
): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];
  const intensityLabel = intensity > 70 ? "explosive, powerful" : intensity > 40 ? "controlled, athletic" : "slow, deliberate";

  if (!def) {
    return `${gender || "Female"} ${bodyType || "athletic"} athlete in dark studio. Bodyweight ${movement}, ${intensityLabel} pace. Smooth, natural movement. ONLY the athlete — no equipment, no weights, no props, no other people. Photorealistic, consistent identity. Stable medium shot, full body.`;
  }

  const sceneStr = def.sceneRules.join(". ");

  // Keep it concise to fit 1000-char Runway limit
  return `${gender || "Female"} ${bodyType || "athletic"} athlete in dark studio performs ${movement}, ${intensityLabel} pace. START: ${def.start.position}. MID: ${def.mid.position}. PEAK: ${def.peak.position}. ${def.fabricCue}. RULES: ${sceneStr}. ${def.camera}. ONLY the athlete, no equipment, no weights, no props, no people. Photorealistic, smooth motion, consistent identity.`;
}

// ---------------------------------------------------------------------------
// Edge Function
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

    if (!RUNWAY_API_KEY.startsWith("key_")) {
      console.error(`RUNWAY: Invalid API key format. Prefix: "${RUNWAY_API_KEY.substring(0, 4)}". Must start with "key_".`);
      return new Response(JSON.stringify({ error: "Invalid Runway API key format. The key must start with 'key_'. Please update your API key." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      referenceImageUrl,
      movement,
      intensity,
      gender,
      bodyType,
      cameraStyle,
      duration,
    } = await req.json();

    if (!referenceImageUrl) {
      return new Response(JSON.stringify({ error: "referenceImageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let motionPrompt = buildMotionPrompt(movement || "squats", intensity || 50, gender || "Female", bodyType || "athletic");

    // Hard cap at 1000 characters for Runway API
    const MAX_PROMPT = 1000;
    if (motionPrompt.length > MAX_PROMPT) {
      console.warn(`RUNWAY: Prompt truncated from ${motionPrompt.length} to ${MAX_PROMPT} chars`);
      motionPrompt = motionPrompt.slice(0, MAX_PROMPT);
    }

    console.log(`RUNWAY: Starting video generation for "${movement}" — prompt length: ${motionPrompt.length} chars`);

    // Step 1: Create the generation task
    const createResp = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4_turbo",
        promptImage: referenceImageUrl,
        promptText: motionPrompt,
        duration: duration || 5,
        ratio: "720:1280",
      }),
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      console.error(`RUNWAY create error: ${createResp.status} — ${errText}`);
      return new Response(JSON.stringify({ error: `Runway API error: ${createResp.status}`, details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createData = await createResp.json();
    const taskId = createData.id;
    console.log(`RUNWAY: Task created — ${taskId}`);

    // Step 2: Poll for completion (max ~120 seconds)
    let videoUrl: string | null = null;
    let status = "PENDING";
    const maxPolls = 60;

    for (let poll = 0; poll < maxPolls; poll++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollResp = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06",
        },
      });

      if (!pollResp.ok) {
        console.error(`RUNWAY poll error: ${pollResp.status}`);
        continue;
      }

      const pollData = await pollResp.json();
      status = pollData.status;
      console.log(`RUNWAY: Poll ${poll + 1} — status: ${status}`);

      if (status === "SUCCEEDED") {
        videoUrl = pollData.output?.[0] || null;
        break;
      }
      if (status === "FAILED") {
        const failReason = pollData.failure || "Unknown failure";
        console.error(`RUNWAY: Generation failed — ${failReason}`);
        return new Response(JSON.stringify({ error: `Video generation failed: ${failReason}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Video generation timed out" }), {
        status: 504,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`RUNWAY: Video ready — downloading and storing...`);

    // Step 3: Download the video and store in Supabase
    let storedVideoUrl = videoUrl;
    try {
      const videoResp = await fetch(videoUrl);
      const videoBytes = new Uint8Array(await videoResp.arrayBuffer());
      const fileName = `${user.id}/runway_${Date.now()}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from("generated-videos")
        .upload(fileName, videoBytes, { contentType: "video/mp4", upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("generated-videos").getPublicUrl(fileName);
        storedVideoUrl = urlData.publicUrl;
        console.log(`RUNWAY: Video stored at ${storedVideoUrl}`);
      } else {
        console.error("RUNWAY: Upload error:", uploadError);
      }
    } catch (e) {
      console.error("RUNWAY: Storage error:", e);
    }

    // Log usage
    const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
    if (brand) {
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        brand_id: brand.id,
        action: "generate_runway_video",
        credits_used: 5,
        metadata: { movement, intensity, gender, bodyType, duration: duration || 5, camera: cameraStyle || "static", task_id: taskId },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        video_url: storedVideoUrl,
        runway_task_id: taskId,
        duration: duration || 5,
        movement,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-runway-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Video generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
