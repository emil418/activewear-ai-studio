import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

// ---------------------------------------------------------------------------
// Movement Script System
// Each exercise has a step-by-step biomechanical movement script that tells
// the video model EXACTLY what to animate. All exercises are bodyweight-only.
// ---------------------------------------------------------------------------

interface MovementScript {
  /** Step-by-step movement description for the prompt */
  steps: string;
  /** Specific fabric behavior cues during this movement */
  fabricCues: string;
  /** Camera framing guidance */
  cameraCue: string;
}

const MOVEMENT_SCRIPTS: Record<string, MovementScript> = {
  "squats": {
    steps: "The athlete stands upright with feet shoulder-width apart and arms relaxed at their sides. They slowly bend their knees and hinge at the hips, lowering their body in a controlled descent. They continue lowering into a deep squat position with thighs parallel to the ground, maintaining an upright torso. They pause briefly at the bottom, then push firmly through their heels, extending knees and hips simultaneously, rising smoothly back to a full standing position.",
    fabricCues: "The leggings stretch visibly across the quadriceps and glutes during descent, compression lines appear at the knee and hip crease, fabric gathers slightly at the ankles. On the ascent the stretch releases gradually and fabric returns to its resting drape.",
    cameraCue: "Stable medium shot, framing from mid-thigh to head, slight low angle to emphasize the squat depth. Camera remains locked with zero movement.",
  },
  "deadlifts": {
    steps: "The athlete stands tall, then slowly hinges forward at the hips while keeping a flat back, reaching hands toward the ground as if gripping an imaginary bar at shin height. They pause briefly, then drive through the heels, extending the hips and knees together, pulling their torso upright. They squeeze the glutes at full lockout, standing completely tall, then slowly hinge forward again to return to the bottom position.",
    fabricCues: "The fabric along the hamstrings and lower back stretches taut during the hip hinge, visible tension lines appear across the glutes. The shirt compresses at the chest when bent over. As the athlete rises, fabric tension releases and returns to natural drape.",
    cameraCue: "Stable medium shot from a slight side angle (about 30 degrees), framing full body head to toe. Camera is completely static.",
  },
  "push-ups": {
    steps: "The athlete starts in a high plank position with arms fully extended, body forming a straight line. They slowly lower their chest toward the ground by bending the elbows, keeping the core tight and body rigid. They descend until chest nearly touches the floor, pause briefly, then press back up by extending the arms fully, returning to the starting plank position. The movement is smooth and controlled throughout.",
    fabricCues: "The shirt stretches across the upper back and shoulders during the lowering phase. Fabric compresses at the chest and bunches slightly at the armpits. On the press-up, back fabric pulls taut and sleeve material shifts with the arm extension.",
    cameraCue: "Stable medium shot from a low side angle, framing the full body in profile. Camera remains locked on a tripod.",
  },
  "lunges": {
    steps: "The athlete stands upright, then takes a controlled step forward with one leg, bending both knees simultaneously. The front thigh lowers to parallel while the back knee descends toward the ground without touching it. They pause at the bottom, then push through the front heel to drive back to standing. The movement is slow, controlled, and balanced.",
    fabricCues: "Leggings stretch dramatically across the front quad and hip flexor of the back leg. Fabric compression appears at the bent knee. The waistband stays in place while fabric below it stretches and adapts to the deep lunge position.",
    cameraCue: "Stable medium shot from a slight angle, framing full body from head to feet. Static locked camera.",
  },
  "running": {
    steps: "The athlete runs in place with a natural jogging cadence — driving alternating knees upward while swinging opposite arms in coordination. Each foot lifts and returns to the ground with a soft mid-foot strike. The torso stays upright with a slight natural forward lean. The movement is rhythmic, smooth, and continuous.",
    fabricCues: "The shirt bounces and shifts with each stride, fabric rippling at the hem and sleeves. Leggings flex at the knees and hips with each leg drive, showing visible stretch-and-release cycles. Natural fabric movement with each foot strike.",
    cameraCue: "Stable medium shot, framing from knees to head. Camera remains completely static while the athlete runs in place.",
  },
  "sprint": {
    steps: "The athlete sprints in place with explosive power — driving knees high with rapid arm pumps. Each stride is forceful with maximum knee lift and strong arm swing. The movement is fast, powerful, and athletic with a slight forward lean.",
    fabricCues: "Intense fabric movement — shirt ripples and bounces with each explosive stride. Leggings stretch dynamically at the hip and quad with each powerful knee drive. Compression visible at joints during peak flexion.",
    cameraCue: "Stable medium shot, framing full body. Completely static camera capturing the explosive movement.",
  },
  "jumping": {
    steps: "The athlete stands upright, then crouches into a quarter squat with arms drawn back. They explosively jump straight up, extending fully with arms reaching overhead. They land softly by bending knees to absorb the impact, settling back into standing position. The jump is powerful and the landing is controlled.",
    fabricCues: "During the crouch, fabric compresses at knees and hips. At the peak of the jump, fabric stretches along the full body line. On landing, fabric ripples with the impact absorption, visible bounce in shirt hem and waistband.",
    cameraCue: "Stable medium-wide shot, framing full body with headroom for the jump. Static camera.",
  },
  "burpees": {
    steps: "The athlete stands upright, then drops into a squat position placing hands on the ground. They kick feet back into a plank position, perform one push-up, then jump feet forward back to the squat position. They explosively jump upward with arms overhead, landing softly back in standing position.",
    fabricCues: "Maximum fabric dynamics — stretching across back during plank, compression at chest during push-up, dramatic stretch at hips and quads during the jump. Shirt rides and settles with each phase transition.",
    cameraCue: "Stable medium-wide shot from slight side angle, framing full body with room for the jump. Static camera.",
  },
  "high knees": {
    steps: "The athlete stands tall and rapidly drives alternating knees up toward chest height while staying in place. Arms pump in opposition to the legs. The torso remains upright and stable while the legs move quickly. The rhythm is fast and continuous.",
    fabricCues: "Leggings stretch at the hip and quad with each knee drive. Shirt bounces with the rapid movement. Fabric at the waistband flexes with each hip movement.",
    cameraCue: "Stable medium shot, framing from thighs to head. Camera completely locked.",
  },
  "mountain climbers": {
    steps: "The athlete starts in a high plank position. They rapidly drive one knee toward the chest, then switch legs in a continuous alternating pattern. The hips stay low and level, arms remain extended and stable. The movement is quick and rhythmic like running in a plank position.",
    fabricCues: "Shirt stretches across the back and shoulders. Leggings show dynamic stretch at the hip flexors with each knee drive. Fabric compresses and releases rapidly at the knee joints.",
    cameraCue: "Stable low-angle side shot, framing the full body in plank position. Static camera.",
  },
  "box jumps": {
    steps: "The athlete crouches into a quarter squat with arms back, then explosively jumps upward and forward as if jumping onto an elevated surface. They land in a soft squat position, then step back down and reset. The jump is powerful and the landing is controlled.",
    fabricCues: "Strong fabric stretch during the crouch and jump phases. Visible compression at knees on landing. Fabric ripples and settles with each landing impact.",
    cameraCue: "Stable medium-wide shot from slight side angle, full body in frame. Static camera.",
  },
  "squat jumps": {
    steps: "The athlete stands upright, drops into a full squat with thighs parallel, pauses briefly, then explosively jumps straight up extending fully. They land softly back into the squat position and repeat. Each jump is powerful with a smooth transition.",
    fabricCues: "Maximum legging stretch at the bottom of each squat. Fabric compression at knees and hips. On the jump, fabric stretches along the legs. Landing creates visible fabric ripple and bounce.",
    cameraCue: "Stable medium shot, framing full body with headroom for jumps. Static camera.",
  },
  "plank": {
    steps: "The athlete lowers into a forearm plank position, body forming a perfectly straight line from head to heels. They hold this position with visible core engagement — slight micro-adjustments in balance, controlled breathing causing subtle torso movement. The hold is steady and demonstrates strength and stability.",
    fabricCues: "Shirt drapes with gravity, fabric stretching across the engaged back and shoulders. Leggings show subtle tension along the full leg line. Core engagement creates slight fabric compression at the midsection.",
    cameraCue: "Stable low-angle side shot, framing the full body profile in plank. Camera completely locked.",
  },
  "warrior pose": {
    steps: "The athlete steps into a wide stance, bending the front knee to 90 degrees while keeping the back leg straight. They raise both arms overhead or extend them to the sides at shoulder height. They hold the pose with controlled balance, slight natural sway, and steady breathing.",
    fabricCues: "Deep stretch visible in the leggings at the inner thigh and hip of the back leg. Fabric at the front knee shows compression. Shirt lifts slightly with raised arms, showing natural drape and gentle movement with breathing.",
    cameraCue: "Stable medium shot from a slight front-angle, framing full body. Static camera.",
  },
  "downward dog": {
    steps: "The athlete starts on all fours, then presses hips up and back, straightening arms and legs to form an inverted V shape. They press heels toward the ground and extend through the spine. They hold the position with controlled breathing and subtle weight shifts between hands and feet.",
    fabricCues: "Shirt falls with gravity toward the head, revealing the midsection. Leggings stretch along the hamstrings and calves. Fabric at shoulders pulls taut with the arm extension.",
    cameraCue: "Stable medium shot from the side, framing the full inverted-V body position. Static camera.",
  },
  "bench press": {
    steps: "The athlete lies on the ground in a floor press position, arms extended upward. They slowly lower their arms by bending at the elbows until upper arms touch the floor, pause briefly, then press arms back up to full extension. The movement is smooth and controlled with visible chest and arm engagement.",
    fabricCues: "Shirt stretches across the chest during the press, fabric bunches at the armpits when arms are lowered. Sleeve material shifts with arm movement. Visible fabric tension across pecs during exertion.",
    cameraCue: "Stable overhead or slight side angle, framing upper body and arms. Static camera.",
  },
  "kettlebell swings": {
    steps: "The athlete stands with feet wider than shoulder-width, arms hanging in front. They hinge at the hips, swinging arms back between the legs, then explosively drive hips forward, swinging arms up to chest height. The movement is a continuous hip-hinge swing pattern with no actual weight — just the natural swinging motion.",
    fabricCues: "Dramatic fabric movement with each swing cycle. Shirt rides forward during the hip hinge, pulls against the back during the forward drive. Leggings stretch at glutes and hamstrings during the hinge phase.",
    cameraCue: "Stable medium shot from slight side angle, framing full body. Static camera.",
  },
  "pull-ups": {
    steps: "The athlete reaches arms overhead as if gripping a bar, hanging with arms fully extended. They pull their body upward by engaging back and arms until chin rises above hand level, pause briefly at the top, then lower back down with control to full arm extension. The movement is strict with no kipping.",
    fabricCues: "Back of the shirt stretches dramatically during the pull, visible lat engagement creating fabric tension lines. Sleeves compress around the biceps at the top. Fabric settles during the controlled descent.",
    cameraCue: "Stable medium shot from slight front angle, framing full body. Static camera.",
  },
};

// ---------------------------------------------------------------------------
// Strict Scene Constraint Prompt
// ---------------------------------------------------------------------------

const SCENE_CONSTRAINTS = `ABSOLUTE SCENE RULES — STRICTLY ENFORCE:
- The scene contains ONLY the single athlete and NOTHING else
- ZERO equipment of any kind: no barbells, no dumbbells, no kettlebells, no gym machines, no resistance bands, no boxes, no benches, no racks, no ropes, no mats
- ZERO props: no water bottles, no towels, no phones, no bags
- ZERO other people — only one athlete in the entire frame
- This is a pure BODYWEIGHT movement demonstration
- The background is a clean, dark, professional photography studio — solid matte black or deep charcoal
- No logos, text, or watermarks in the scene
- No mirrors, windows, or reflective surfaces`;

const REALISM_CONSTRAINTS = `REALISM AND QUALITY REQUIREMENTS:
- The athlete must look like a real human being with natural proportions
- Realistic human anatomy with natural muscle definition
- Smooth, biomechanically correct motion — no jerky or unnatural movements
- Consistent athlete identity throughout — same face, body, skin tone for entire clip
- Professional studio lighting: soft key light with subtle fill, no harsh shadows
- Photorealistic quality matching a professional sports campaign shoot
- Natural skin texture, realistic hair movement
- The athlete's proportions must remain consistent and anatomically correct throughout`;

const GARMENT_FOCUS = `GARMENT VISUALIZATION FOCUS — PRIMARY PURPOSE:
- The entire purpose of this video is to showcase how the garment behaves during movement
- Show realistic fabric physics: stretch, compression, folding, draping, and recovery
- Fabric must react naturally to body movement — stretching under load, compressing at joints
- Show natural wrinkle formation and release during the movement cycle
- The garment must remain the EXACT same garment throughout — same color, pattern, design, logos
- No warping, distortion, or color shifting of the garment
- The garment should be the visual star of the video — it's an activewear product showcase`;

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

    // Resolve movement script
    const movementKey = (movement || "squats").toLowerCase();
    const script = MOVEMENT_SCRIPTS[movementKey] || null;

    const movementSteps = script
      ? script.steps
      : `The athlete performs ${movement || "squats"} using only their bodyweight — smooth, controlled, biomechanically correct form. No equipment of any kind is used.`;

    const fabricCues = script
      ? script.fabricCues
      : "The activewear fabric stretches, compresses, folds, and drapes naturally with the body's movement. Visible fabric physics showing stretch under load and compression at joints.";

    const cameraCue = script
      ? script.cameraCue
      : "Stable medium shot, framing full body from head to feet. Camera remains completely static on a tripod.";

    const intensityLabel = intensity > 70 ? "explosive and powerful" : intensity > 40 ? "controlled and athletic" : "slow and deliberate";

    // Build the comprehensive prompt
    const motionPrompt = `A ${gender || "female"} athlete with a ${bodyType || "athletic"} build performing a bodyweight exercise in a professional dark photography studio.

MOVEMENT SCRIPT (animate this exactly):
${movementSteps}
The pace is ${intensityLabel}. The motion must be smooth, continuous, and biomechanically realistic throughout the entire clip.

${fabricCues ? `FABRIC BEHAVIOR:\n${fabricCues}\n` : ""}
CAMERA: ${cameraCue}${cameraStyle === "slow_tracking" ? " with very subtle, imperceptible drift." : ""}

${SCENE_CONSTRAINTS}

${GARMENT_FOCUS}

${REALISM_CONSTRAINTS}

OUTPUT: Vertical 9:16 format, smooth continuous motion, photorealistic quality. This must look like a real human performing a real exercise — not animation or CGI.`;

    console.log(`RUNWAY: Starting video generation for "${movement}" — prompt length: ${motionPrompt.length} chars`);
    console.log(`RUNWAY: Movement script: ${movementSteps.substring(0, 120)}...`);

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
