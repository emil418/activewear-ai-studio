import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

/**
 * Runway Gen-3 Image-to-Video edge function.
 * Takes a reference image URL and generates a 4-6 second MP4 video
 * of an athlete performing a movement while wearing the garment.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

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

    const intensityLabel = intensity > 70 ? "explosive, powerful" : intensity > 40 ? "controlled, athletic" : "slow, deliberate";
    const cameraDesc = cameraStyle === "slow_tracking"
      ? "very slow, subtle cinematic tracking shot"
      : "stable tripod shot with minimal camera movement";

    const motionPrompt = `A ${gender || "female"} athlete with a ${bodyType || "athletic"} build performing ${movement || "squats"} in a professional dark studio. The movement is ${intensityLabel} with natural fluid motion. Show realistic fabric physics — the activewear stretches, compresses, and moves naturally with the body. ${cameraDesc}. Professional sports campaign lighting. Vertical 9:16 format. Smooth continuous motion, photorealistic quality.`;

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
        ratio: "9:16",
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
