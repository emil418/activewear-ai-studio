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
    start: { position: "Standing tall, feet shoulder-width, barbell resting on upper traps if weighted, hands gripping bar wide", joints: "Knees straight, hips neutral, spine braced", weight: "Centered on both feet, core tight" },
    mid: { position: "Controlled descent, hips breaking parallel, knees tracking over toes, torso upright with slight forward lean", joints: "Knees 90°, hips below parallel, deep crease", weight: "Heels loaded, glutes stretching under tension" },
    peak: { position: "Explosive drive upward from the hole, hips and knees extending simultaneously, chest rising", joints: "Full lockout, hips forward, glutes squeezed hard", weight: "Driving through mid-foot, weight shifting upward" },
    sceneRules: ["Full body visible head to toe", "Natural gym environment or dark studio", "Barbell on back if weighted exercise"],
    camera: "Stable medium shot, slight low angle, slow cinematic drift, full body",
    fabricCue: "Leggings stretch visibly at quads and glutes under load, fabric compresses at knee crease during descent",
  },
  "push-ups": {
    start: { position: "High plank, arms locked out, body perfectly straight from head to heels, core braced", joints: "Elbows fully extended, wrists stacked under shoulders", weight: "Distributed between hands and toes" },
    mid: { position: "Controlled lowering, chest descending toward floor, elbows at 45° angle, shoulder blades retracting", joints: "Elbows 90°, shoulders loaded, scapulae pinched", weight: "Shifting slightly forward into hands" },
    peak: { position: "Chest nearly touching floor, pause at bottom, then explosive press back up with full arm extension", joints: "Elbows 45°, deep pec stretch, then full lockout", weight: "Pressing through palms, body rigid like a plank" },
    sceneRules: ["Body on floor level", "Full body visible in profile or slight angle", "Body forms perfectly straight line throughout", "No bench"],
    camera: "Low side angle, stable tripod, full body in frame, slight cinematic push",
    fabricCue: "Shirt stretches across upper back and shoulders on descent, fabric tightens at chest",
  },
  "deadlifts": {
    start: { position: "Standing behind barbell, feet hip-width, hinging at hips to grip bar, flat back, shoulders over bar", joints: "Hips hinged deeply, knees slightly bent, spine neutral and braced", weight: "Mid-foot, loaded into hamstrings and glutes" },
    mid: { position: "Pulling bar off ground, driving through legs, bar traveling close to shins, back angle constant", joints: "Hips and knees extending together, bar past knees", weight: "Shifting from quads to posterior chain" },
    peak: { position: "Full lockout standing tall, hips fully extended, chest proud, shoulders back, barbell at hip level, controlled lower back down", joints: "Full hip extension, knees straight, glutes contracted hard", weight: "Centered and stable at top, controlled eccentric" },
    sceneRules: ["Barbell present on the ground", "Full body visible", "Feet stay planted", "Bar travels close to body"],
    camera: "Stable medium shot from 30° side angle, full body head to toe, slight cinematic drift",
    fabricCue: "Fabric stretches at hamstrings and lower back during pull, shirt tightens across upper back at lockout",
  },
  "lunges": {
    start: { position: "Standing tall, feet hip-width, about to step forward naturally", joints: "Knees straight, hips neutral, core braced", weight: "Centered, balanced" },
    mid: { position: "Stepping forward with one leg, both knees bending, lowering body with control, back knee hovering above ground", joints: "Front knee 90° over ankle, back knee 90° hovering", weight: "60% front foot, 40% back foot, natural weight transfer" },
    peak: { position: "Driving back up through front heel, pushing off to return to standing or stepping into next lunge", joints: "Front leg extending powerfully, hip driving forward", weight: "Explosive push through front foot" },
    sceneRules: ["Full body visible", "Natural stepping motion", "Upright torso throughout"],
    camera: "Stable medium shot, slight angle, full body visible, slow tracking",
    fabricCue: "Dramatic stretch at front quad and back hip flexor, compression visible at bent knees",
  },
  "pull-ups": {
    start: { position: "Athlete hanging from pull-up bar overhead, arms fully extended, dead hang, lats stretched, body vertical and still", joints: "Shoulders fully extended, elbows locked at 180°, grip slightly wider than shoulders", weight: "Full bodyweight hanging from hands, feet off ground" },
    mid: { position: "Pulling body upward with controlled force, elbows driving down and back, chest rising toward bar, body staying vertical", joints: "Elbows bending to 110°, shoulders adducting, lats engaging hard", weight: "Pulling bodyweight upward through grip strength" },
    peak: { position: "Chin clearing the bar, shoulders fully contracted, brief hold at top, then controlled negative descent back to dead hang", joints: "Elbows fully bent at 45°, shoulders depressed and retracted", weight: "Suspended at peak, controlled lowering" },
    sceneRules: ["Pull-up bar MUST be above the athlete at all times", "Athlete MUST hang below the bar", "Bar must NEVER appear behind the neck", "Body must NEVER stand on floor during movement", "Full body visible including hanging feet"],
    camera: "Full body vertical framing, stable camera, centered athlete, showing bar above and feet below",
    fabricCue: "Back of shirt stretches dramatically showing lat engagement, sleeves compress around biceps at top of pull",
  },
  "bench press": {
    start: { position: "Lying on bench, feet flat on floor, barbell held at arms length above chest, shoulder blades pinched", joints: "Elbows locked out, wrists stacked over elbows, slight arch in back", weight: "Bar supported at full extension above chest" },
    mid: { position: "Lowering barbell with control toward lower chest, elbows at 45° angle, bar touching chest briefly", joints: "Elbows 90°, shoulders externally rotated, deep pec stretch", weight: "Bar descending under control to chest" },
    peak: { position: "Explosive press upward, driving bar off chest, arms extending fully, lockout at top", joints: "Full elbow extension, chest contracted, bar stable overhead", weight: "Pressing through palms, driving weight upward" },
    sceneRules: ["Bench and barbell present", "Athlete lying on bench", "Full upper body and bar visible", "Feet flat on floor"],
    camera: "Stable slight side angle, framing upper body with bar path visible, cinematic",
    fabricCue: "Shirt stretches across chest during press, fabric tightens at shoulders under load",
  },
  "sprint": {
    start: { position: "Explosive start position, slight forward lean, weight on balls of feet, ready to burst", joints: "Neutral athletic stance, slight knee bend", weight: "Balls of feet, leaning forward" },
    mid: { position: "Full sprint stride, one knee driving high toward chest, opposite arm pumping aggressively, powerful ground contact", joints: "Drive knee at 90° hip flexion, opposite elbow driving back at 90°", weight: "Alternating single-leg powerful strikes" },
    peak: { position: "Maximum velocity sprinting, high knee drive, aggressive arm pump, slight forward lean, powerful and explosive", joints: "Maximum knee height, full arm swing range, ankle dorsiflexed", weight: "Explosive single-leg drive, rapid alternation" },
    sceneRules: ["Sprinting in place or short distance", "No treadmill", "Full body visible", "Athletic and explosive"],
    camera: "Stable medium shot, full body, slight slow-motion feel, cinematic",
    fabricCue: "Intense fabric ripple with each explosive stride, shirt bouncing, shorts stretching at hip flexors",
  },
  "burpees": {
    start: { position: "Standing tall, then dropping into squat with hands reaching for floor", joints: "Transitioning from standing to squat to plank rapidly", weight: "Shifting from feet to hands" },
    mid: { position: "Jump back to plank, perform a push-up with chest to floor, then jump feet forward to hands", joints: "Full plank, push-up at bottom, then explosive hip flexion to jump forward", weight: "Hands and toes in plank, then feet under hips" },
    peak: { position: "Explosive vertical jump from squat position, arms reaching overhead, full body extension in the air", joints: "Full triple extension at ankles, knees, hips, arms overhead", weight: "Launching from ground, fully airborne" },
    sceneRules: ["Full body visible with headroom for jump", "Clear floor space", "Continuous fluid sequence"],
    camera: "Stable medium-wide shot, slight side angle, full body with jump room, cinematic",
    fabricCue: "Maximum fabric dynamics—stretch at back in plank, compression at chest in push-up, full stretch during jump",
  },
  "high knees": {
    start: { position: "Standing tall in athletic position, arms ready at sides", joints: "Neutral athletic stance", weight: "Centered, ready" },
    mid: { position: "Driving one knee up toward chest level, opposite arm pumping, rapid alternating rhythm", joints: "Drive knee past 90° hip flexion, quick switch", weight: "Bouncing on balls of feet, rapid alternation" },
    peak: { position: "Maximum speed high knees, knees reaching chest height each rep, intense arm drive, athletic rhythm", joints: "Maximum hip flexion each side, rapid fire", weight: "Quick light bouncing, athletic cadence" },
    sceneRules: ["Standing in place", "Full body visible", "Fast rhythmic movement"],
    camera: "Stable medium shot, full body, locked camera, slight slow motion",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces with rapid athletic movement",
  },
  "box jumps": {
    start: { position: "Athletic quarter squat, arms drawn back, eyes focused on the box, coiling to explode", joints: "Knees 130°, hips loaded, ankles ready", weight: "Balls of feet, loading posterior chain" },
    mid: { position: "Explosive triple extension, body launching upward and forward, arms driving overhead, knees tucking to clear box", joints: "Full extension then rapid knee tuck", weight: "Airborne, traveling upward" },
    peak: { position: "Landing softly on box in athletic squat position, absorbing impact, then standing tall on top", joints: "Knees absorbing impact at 100°, then full stand", weight: "Soft landing through mid-foot on box surface" },
    sceneRules: ["Plyometric box or platform visible", "Full body visible with headroom", "Explosive athletic jump"],
    camera: "Stable medium-wide shot, slight side angle, full body including box",
    fabricCue: "Strong fabric stretch during loading crouch, visible compression at knees on soft landing",
  },
  "squat jumps": {
    start: { position: "Dropping into deep bodyweight squat, arms reaching back for momentum", joints: "Knees deep at 75°, hips below parallel", weight: "Loaded deep into heels and mid-foot" },
    mid: { position: "Exploding upward from squat, triple extension, arms swinging overhead for momentum", joints: "Rapidly extending ankles, knees, hips simultaneously", weight: "Driving through feet, launching" },
    peak: { position: "Fully airborne, body extended, arms overhead, then landing softly back into squat", joints: "Full extension at peak, then absorbing into next squat", weight: "Airborne at peak, soft landing" },
    sceneRules: ["No equipment", "Full body with headroom for jump", "Continuous squat-jump cycle"],
    camera: "Stable medium shot, full body with headroom, slight cinematic drift",
    fabricCue: "Maximum legging stretch at squat bottom, fabric stretches along legs during explosive jump",
  },
  "battle ropes": {
    start: { position: "Athletic half-squat stance, holding ends of two heavy battle ropes, arms extended forward", joints: "Knees bent, hips hinged slightly, core braced, grip tight", weight: "Grounded through feet, center of gravity low" },
    mid: { position: "Alternating arm waves, one arm driving rope up while other slams down, creating wave pattern through ropes", joints: "Shoulders alternating flexion/extension, elbows slightly bent, wrists active", weight: "Stable lower body, upper body generating force" },
    peak: { position: "Maximum intensity waves, full arm range, visible rope waves traveling to anchor, powerful athletic rhythm", joints: "Full shoulder range each wave, core stabilizing hard", weight: "Rooted stance, explosive upper body" },
    sceneRules: ["Battle ropes visible and moving with waves", "Full body visible", "Athletic gym setting", "Ropes creating visible wave pattern"],
    camera: "Stable medium shot, slight front angle, showing full rope waves, cinematic",
    fabricCue: "Shirt stretches across shoulders and arms with each wave, visible muscle tension through fabric",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, hinged at hips, kettlebell held with both hands between legs, back flat, loading hamstrings", joints: "Hips deeply hinged, knees slightly bent, spine neutral", weight: "Posterior loaded, weight in heels" },
    mid: { position: "Explosive hip drive forward, snapping hips, swinging kettlebell upward with momentum from hips not arms", joints: "Hips extending rapidly, knees straightening, shoulders relaxed", weight: "Driving through heels, weight transferring forward" },
    peak: { position: "Standing tall, kettlebell at chest or eye height, hips fully locked out, brief float, then controlled swing back down", joints: "Full hip extension, arms relaxed at shoulder height, glutes squeezed", weight: "Centered and tall, kettlebell floating at peak" },
    sceneRules: ["Kettlebell visible in hands", "Full body visible", "Hip-driven explosive movement", "Smooth pendulum arc"],
    camera: "Stable medium shot from slight side angle, full body, showing kettlebell arc, cinematic",
    fabricCue: "Dramatic fabric movement with each swing cycle, shirt riding up slightly during deep hinge",
  },
  "jump rope": {
    start: { position: "Standing tall, holding jump rope handles, elbows close to body, wrists ready to rotate", joints: "Elbows at 90° close to ribs, wrists active, slight knee bend", weight: "Balls of feet, light and bouncy" },
    mid: { position: "Rope rotating overhead and under feet, small bounces on balls of feet, wrists driving rotation", joints: "Ankles extending with each hop, knees softly bending, wrists spinning rope", weight: "Light bounces, barely leaving ground" },
    peak: { position: "Fast rhythmic jumping, rope visibly rotating around body, feet clearing rope each revolution", joints: "Rapid ankle-driven bounces, minimal knee bend, fast wrist rotation", weight: "Light, rhythmic, athletic cadence" },
    sceneRules: ["Jump rope visible and rotating around the athlete", "Full body visible", "Rhythmic athletic movement"],
    camera: "Stable medium shot, full body, static camera, slight cinematic feel",
    fabricCue: "Shirt bounces with each hop, calves visible working with each jump",
  },
  "running": {
    start: { position: "Natural running stance, slight forward lean, one foot striking ground", joints: "Neutral running posture, arms at 90°", weight: "Balls of feet" },
    mid: { position: "Natural running stride, alternating leg drives, opposite arm swing, heel-to-toe foot strike", joints: "Knee 90° hip flexion on drive, elbow 90° swing", weight: "Alternating single-leg contact, natural gait" },
    peak: { position: "Full running stride at comfortable pace, natural breathing rhythm, smooth athletic motion", joints: "Maximum knee lift on drive phase, full arm swing", weight: "Dynamic single-leg, natural weight transfer" },
    sceneRules: ["Natural running motion", "No treadmill", "Full body visible", "Smooth and fluid"],
    camera: "Stable medium shot, full body, static or slight tracking, cinematic",
    fabricCue: "Shirt bounces naturally with each stride, shorts and leggings flex at knees and hips",
  },
  "jumping": {
    start: { position: "Athletic quarter squat, arms drawn back, coiling to jump", joints: "Knees 130°, hips loaded, ankles ready to extend", weight: "Balls of feet, posterior chain loading" },
    mid: { position: "Explosive triple extension, arms driving overhead, body launching vertically", joints: "Full extension through ankles, knees, hips simultaneously", weight: "Leaving ground with full force" },
    peak: { position: "Fully airborne at peak height, body extended or tucked, arms overhead, then controlled landing", joints: "Full body extension or tuck at peak", weight: "Airborne at peak, absorbing on landing" },
    sceneRules: ["Full body visible with headroom", "Clean vertical or tuck jump", "Natural athletic jump"],
    camera: "Stable medium-wide shot, full body with headroom, cinematic",
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
