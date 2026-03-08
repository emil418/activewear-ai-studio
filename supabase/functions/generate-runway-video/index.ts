import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

/** Predefined motion descriptions for supported exercises */
const MOTION_DESCRIPTIONS: Record<string, string> = {
  "squats": "performing a deep barbell back squat — lowering into a full squat position with controlled descent, then driving upward explosively through the hips and knees, maintaining upright torso",
  "deadlifts": "performing a conventional deadlift — hinging at the hips to grip the barbell, then pulling it from the floor to full lockout with straight back, squeezing glutes at the top",
  "bench press": "performing a flat barbell bench press — lowering the bar to mid-chest with controlled tempo, then pressing it upward to full arm extension with stable shoulder blades",
  "running": "sprinting in a professional studio — powerful arm drive, high knee lift, explosive ground contact with each stride, athletic running form",
  "jumping": "performing an explosive vertical box jump — crouching into a quarter squat, then launching upward with full arm swing, landing softly with bent knees",
  "push-ups": "performing push-ups with strict form — lowering chest to floor with elbows tracking back, then pressing up to full arm extension, maintaining rigid plank throughout",
  "sprint": "sprinting at full speed — explosive arm pump, driving knees high, powerful foot strikes with forward lean",
  "burpees": "performing a burpee — dropping into a push-up, then explosively jumping upward with arms overhead",
  "lunges": "performing walking lunges — stepping forward into a deep lunge, driving back up through the front heel",
  "pull-ups": "performing strict pull-ups — hanging from a bar then pulling chin above the bar with controlled movement",
  "high knees": "performing high knees in place — rapidly driving knees upward alternately with athletic posture",
  "mountain climbers": "performing mountain climbers — in plank position, rapidly alternating driving knees toward chest",
  "box jumps": "performing explosive box jumps — jumping onto a plyo box and landing with soft knees",
  "squat jumps": "performing explosive squat jumps — dropping into a squat then leaping vertically",
  "kettlebell swings": "performing kettlebell swings — hinging at hips, driving the kettlebell forward and overhead with hip snap",
  "warrior pose": "flowing through warrior pose — stepping into a wide stance with arms extended, holding with controlled breathing",
  "downward dog": "transitioning into downward dog — pressing hips high, straightening arms and legs, pressing heels toward floor",
  "plank": "holding a forearm plank with perfect alignment — core braced, body forming a straight line from head to heels",
};

/**
 * Runway Gen-4 Turbo Image-to-Video edge function.
 * Takes a reference image URL and generates a 3-5 second continuous MP4 video
 * of an athlete performing a movement naturally — NOT frame interpolation.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

    // Validate key format
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

    const movementKey = (movement || "squats").toLowerCase();
    const motionDesc = MOTION_DESCRIPTIONS[movementKey] || `performing ${movement || "squats"} with controlled, athletic form`;
    const intensityLabel = intensity > 70 ? "explosive, powerful" : intensity > 40 ? "controlled, athletic" : "slow, deliberate";
    const cameraDesc = cameraStyle === "slow_tracking"
      ? "very slow, subtle cinematic tracking shot"
      : "stable tripod shot with minimal camera movement";

    const motionPrompt = `A ${gender || "female"} athlete with a ${bodyType || "athletic"} build ${motionDesc} in a professional dark studio. The movement is ${intensityLabel} with natural fluid motion. The activewear stretches, compresses, wrinkles and moves naturally with the body — realistic fabric physics showing stretch under load, compression at joints, and natural folds. ${cameraDesc}. Professional sports campaign lighting. Vertical 9:16 format. Smooth continuous motion throughout the entire clip, photorealistic quality, natural body mechanics.`;

    console.log(`RUNWAY: Starting video generation for "${movement}" — prompt: ${motionPrompt.substring(0, 100)}...`);

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
