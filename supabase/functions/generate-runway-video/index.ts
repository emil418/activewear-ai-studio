import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
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
    start: { position: "Standing tall, feet shoulder-width apart, arms extended forward for balance, NO equipment in hands or on body", joints: "Knees straight, hips neutral, spine braced", weight: "Centered on both feet, core tight" },
    mid: { position: "Controlled descent, hips breaking parallel, knees tracking over toes, torso upright with slight forward lean, arms forward for balance", joints: "Knees 90°, hips below parallel, deep crease", weight: "Heels loaded, glutes stretching under tension" },
    peak: { position: "Explosive drive upward from the hole, hips and knees extending simultaneously, chest rising, arms still forward", joints: "Full lockout, hips forward, glutes squeezed hard", weight: "Driving through mid-foot, weight shifting upward" },
    sceneRules: ["WIDE full-body shot head to toe", "Dark studio environment", "STRICTLY NO BARBELL — NO WEIGHTS — NO EQUIPMENT OF ANY KIND", "This is a BODYWEIGHT squat ONLY", "Garment stretch at quads and glutes clearly visible", "If a barbell appears the video is WRONG"],
    camera: "WIDE full-body shot head to toe with space around athlete, slight low angle, slow cinematic drift",
    fabricCue: "Leggings stretch visibly at quads and glutes under load, fabric compresses at knee crease during descent — garment performance clearly visible",
  },
  "push-ups": {
    start: { position: "High plank, arms locked out, body perfectly straight from head to heels, core braced", joints: "Elbows fully extended, wrists stacked under shoulders", weight: "Distributed between hands and toes" },
    mid: { position: "Controlled lowering, chest descending toward floor, elbows at 45° angle, shoulder blades retracting", joints: "Elbows 90°, shoulders loaded, scapulae pinched", weight: "Shifting slightly forward into hands" },
    peak: { position: "Chest nearly touching floor, pause at bottom, then explosive press back up with full arm extension", joints: "Elbows 45°, deep pec stretch, then full lockout", weight: "Pressing through palms, body rigid like a plank" },
    sceneRules: ["Body on floor level", "WIDE shot showing full body from head to toes", "Body forms perfectly straight line throughout", "No bench"],
    camera: "WIDE full-body shot from low side angle showing entire body head to toes, never crop any body part",
    fabricCue: "Shirt stretches across upper back and shoulders on descent, fabric tightens at chest — garment behavior clearly visible",
  },
  "deadlifts": {
    start: { position: "Standing behind barbell, feet hip-width, hinging at hips to grip bar, flat back, shoulders over bar", joints: "Hips hinged deeply, knees slightly bent, spine neutral and braced", weight: "Mid-foot, loaded into hamstrings and glutes" },
    mid: { position: "Pulling bar off ground, driving through legs, bar traveling close to shins, back angle constant", joints: "Hips and knees extending together, bar past knees", weight: "Shifting from quads to posterior chain" },
    peak: { position: "Full lockout standing tall, hips fully extended, chest proud, shoulders back, barbell at hip level, controlled lower back down", joints: "Full hip extension, knees straight, glutes contracted hard", weight: "Centered and stable at top, controlled eccentric" },
    sceneRules: ["Barbell present on the ground", "WIDE full-body shot head to toe", "Feet stay planted", "Bar travels close to body", "Barbell fully visible never cut off"],
    camera: "WIDE full-body shot from 30° side angle, head to toe with space, barbell fully visible",
    fabricCue: "Fabric stretches at hamstrings and lower back during pull, shirt tightens across upper back at lockout — garment stretch clearly visible",
  },
  "lunges": {
    start: { position: "Standing tall, feet hip-width, about to step forward naturally", joints: "Knees straight, hips neutral, core braced", weight: "Centered, balanced" },
    mid: { position: "Stepping forward with one leg, both knees bending, lowering body with control, back knee hovering above ground", joints: "Front knee 90° over ankle, back knee 90° hovering", weight: "60% front foot, 40% back foot, natural weight transfer" },
    peak: { position: "Driving back up through front heel, pushing off to return to standing or stepping into next lunge", joints: "Front leg extending powerfully, hip driving forward", weight: "Explosive push through front foot" },
    sceneRules: ["WIDE full-body shot head to toe", "Natural stepping motion", "Upright torso throughout"],
    camera: "WIDE full-body shot, head to toe with space for full stride, slow tracking",
    fabricCue: "Dramatic stretch at front quad and back hip flexor, compression visible at bent knees — garment performance clearly visible",
  },
  "pull-ups": {
    start: { position: "Athlete hanging from pull-up bar overhead, arms fully extended, dead hang, lats stretched, body vertical and still", joints: "Shoulders fully extended, elbows locked at 180°, grip slightly wider than shoulders", weight: "Full bodyweight hanging from hands, feet off ground" },
    mid: { position: "Pulling body upward with controlled force, elbows driving down and back, chest rising toward bar, body staying vertical", joints: "Elbows bending to 110°, shoulders adducting, lats engaging hard", weight: "Pulling bodyweight upward through grip strength" },
    peak: { position: "Chin clearing the bar, shoulders fully contracted, brief hold at top, then controlled negative descent back to dead hang", joints: "Elbows fully bent at 45°, shoulders depressed and retracted", weight: "Suspended at peak, controlled lowering" },
    sceneRules: ["Pull-up bar MUST be above the athlete at all times", "Athlete MUST hang below the bar", "Bar must NEVER appear behind the neck", "Body must NEVER stand on floor during movement", "WIDE shot showing bar at top and feet at bottom"],
    camera: "WIDE full-body vertical shot showing bar above and hanging feet below with generous space, never crop bar or feet",
    fabricCue: "Back of shirt stretches dramatically showing lat engagement, sleeves compress around biceps — garment stretch clearly visible",
  },
  "bench press": {
    start: { position: "Lying on bench, feet flat on floor, barbell held at arms length above chest, shoulder blades pinched", joints: "Elbows locked out, wrists stacked over elbows, slight arch in back", weight: "Bar supported at full extension above chest" },
    mid: { position: "Lowering barbell with control toward lower chest, elbows at 45° angle, bar touching chest briefly", joints: "Elbows 90°, shoulders externally rotated, deep pec stretch", weight: "Bar descending under control to chest" },
    peak: { position: "Explosive press upward, driving bar off chest, arms extending fully, lockout at top", joints: "Full elbow extension, chest contracted, bar stable overhead", weight: "Pressing through palms, driving weight upward" },
    sceneRules: ["Bench and barbell present", "Athlete lying on bench", "ENTIRE body visible from head to feet including full barbell length", "Feet flat on floor", "Barbell NEVER cut off at edges", "NEVER in plank or push-up position"],
    camera: "WIDE full-body shot from slight side angle showing ENTIRE athlete lying on bench from head to feet, barbell fully visible end to end, never crop body or equipment",
    fabricCue: "Shirt stretches across chest during press, fabric tightens at shoulders under load — garment compression clearly visible",
  },
  "sprint": {
    start: { position: "Explosive start position, slight forward lean, weight on balls of feet, ready to burst", joints: "Neutral athletic stance, slight knee bend", weight: "Balls of feet, leaning forward" },
    mid: { position: "Full sprint stride, one knee driving high toward chest, opposite arm pumping aggressively, powerful ground contact", joints: "Drive knee at 90° hip flexion, opposite elbow driving back at 90°", weight: "Alternating single-leg powerful strikes" },
    peak: { position: "Maximum velocity sprinting, high knee drive, aggressive arm pump, slight forward lean, powerful and explosive", joints: "Maximum knee height, full arm swing range, ankle dorsiflexed", weight: "Explosive single-leg drive, rapid alternation" },
    sceneRules: ["Sprinting in place or short distance", "No treadmill", "WIDE full-body shot head to toe", "Athletic and explosive"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, slight slow-motion feel",
    fabricCue: "Intense fabric ripple with each explosive stride, shirt bouncing, shorts stretching at hip flexors — garment motion clearly visible",
  },
  "burpees": {
    start: { position: "Standing tall, then dropping into squat with hands reaching for floor", joints: "Transitioning from standing to squat to plank rapidly", weight: "Shifting from feet to hands" },
    mid: { position: "Jump back to plank, perform a push-up with chest to floor, then jump feet forward to hands", joints: "Full plank, push-up at bottom, then explosive hip flexion to jump forward", weight: "Hands and toes in plank, then feet under hips" },
    peak: { position: "Explosive vertical jump from squat position, arms reaching overhead, full body extension in the air", joints: "Full triple extension at ankles, knees, hips, arms overhead", weight: "Launching from ground, fully airborne" },
    sceneRules: ["WIDE full-body shot with generous headroom for jump", "Clear floor space", "Continuous fluid sequence"],
    camera: "WIDE full-body shot from slight side angle, head to toe with extra headroom for jump",
    fabricCue: "Maximum fabric dynamics—stretch at back in plank, compression at chest in push-up, full stretch during jump — garment behavior visible throughout",
  },
  "high knees": {
    start: { position: "Standing tall in athletic position, arms ready at sides", joints: "Neutral athletic stance", weight: "Centered, ready" },
    mid: { position: "Driving one knee up toward chest level, opposite arm pumping, rapid alternating rhythm", joints: "Drive knee past 90° hip flexion, quick switch", weight: "Bouncing on balls of feet, rapid alternation" },
    peak: { position: "Maximum speed high knees, knees reaching chest height each rep, intense arm drive, athletic rhythm", joints: "Maximum hip flexion each side, rapid fire", weight: "Quick light bouncing, athletic cadence" },
    sceneRules: ["Standing in place", "WIDE full-body shot head to toe", "Fast rhythmic movement"],
    camera: "WIDE full-body shot, head to toe with space around athlete, stable",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces with rapid athletic movement — garment motion clearly visible",
  },
  "box jumps": {
    start: { position: "Athletic quarter squat, arms drawn back, eyes focused on the box, coiling to explode", joints: "Knees 130°, hips loaded, ankles ready", weight: "Balls of feet, loading posterior chain" },
    mid: { position: "Explosive triple extension, body launching upward and forward, arms driving overhead, knees tucking to clear box", joints: "Full extension then rapid knee tuck", weight: "Airborne, traveling upward" },
    peak: { position: "Landing softly on box in athletic squat position, absorbing impact, then standing tall on top", joints: "Knees absorbing impact at 100°, then full stand", weight: "Soft landing through mid-foot on box surface" },
    sceneRules: ["Plyometric box or platform visible", "WIDE full-body shot with headroom", "Explosive athletic jump"],
    camera: "WIDE full-body shot from slight side angle, head to toe including box, generous headroom",
    fabricCue: "Strong fabric stretch during loading crouch, visible compression at knees on soft landing — garment performance clearly visible",
  },
  "squat jumps": {
    start: { position: "Dropping into deep bodyweight squat, arms reaching back for momentum", joints: "Knees deep at 75°, hips below parallel", weight: "Loaded deep into heels and mid-foot" },
    mid: { position: "Exploding upward from squat, triple extension, arms swinging overhead for momentum", joints: "Rapidly extending ankles, knees, hips simultaneously", weight: "Driving through feet, launching" },
    peak: { position: "Fully airborne, body extended, arms overhead, then landing softly back into squat", joints: "Full extension at peak, then absorbing into next squat", weight: "Airborne at peak, soft landing" },
    sceneRules: ["No equipment", "WIDE full-body shot with headroom for jump", "Continuous squat-jump cycle"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable",
    fabricCue: "Maximum legging stretch at squat bottom, fabric stretches along legs during explosive jump — garment behavior clearly visible",
  },
  "battle ropes": {
    start: { position: "Athletic half-squat stance, holding ends of two heavy battle ropes, arms extended forward", joints: "Knees bent, hips hinged slightly, core braced, grip tight", weight: "Grounded through feet, center of gravity low" },
    mid: { position: "Alternating arm waves, one arm driving rope up while other slams down, creating wave pattern through ropes", joints: "Shoulders alternating flexion/extension, elbows slightly bent, wrists active", weight: "Stable lower body, upper body generating force" },
    peak: { position: "Maximum intensity waves, full arm range, visible rope waves traveling to anchor, powerful athletic rhythm", joints: "Full shoulder range each wave, core stabilizing hard", weight: "Rooted stance, explosive upper body" },
    sceneRules: ["Battle ropes visible and moving with waves", "WIDE full-body shot head to toe", "Athletic gym setting", "Ropes fully visible never cut off"],
    camera: "WIDE full-body shot, slight front angle, showing full rope waves and complete athlete, never crop ropes",
    fabricCue: "Shirt stretches across shoulders and arms with each wave, visible muscle tension through fabric — garment performance clearly visible",
  },
  "kettlebell swings": {
    start: { position: "Wide stance, hinged at hips, kettlebell held with both hands between legs, back flat, loading hamstrings", joints: "Hips deeply hinged, knees slightly bent, spine neutral", weight: "Posterior loaded, weight in heels" },
    mid: { position: "Explosive hip drive forward, snapping hips, swinging kettlebell upward with momentum from hips not arms", joints: "Hips extending rapidly, knees straightening, shoulders relaxed", weight: "Driving through heels, weight transferring forward" },
    peak: { position: "Standing tall, kettlebell at chest or eye height, hips fully locked out, brief float, then controlled swing back down", joints: "Full hip extension, arms relaxed at shoulder height, glutes squeezed", weight: "Centered and tall, kettlebell floating at peak" },
    sceneRules: ["Kettlebell visible in hands and never cut off", "WIDE full-body shot head to toe", "Hip-driven explosive movement", "Smooth pendulum arc"],
    camera: "WIDE full-body shot from slight side angle, head to toe showing kettlebell arc, never crop equipment",
    fabricCue: "Dramatic fabric movement with each swing cycle, shirt riding up slightly during deep hinge — garment motion clearly visible",
  },
  "jump rope": {
    start: { position: "Standing tall, holding jump rope handles, elbows close to body, wrists ready to rotate", joints: "Elbows at 90° close to ribs, wrists active, slight knee bend", weight: "Balls of feet, light and bouncy" },
    mid: { position: "Rope rotating overhead and under feet, small bounces on balls of feet, wrists driving rotation", joints: "Ankles extending with each hop, knees softly bending, wrists spinning rope", weight: "Light bounces, barely leaving ground" },
    peak: { position: "Fast rhythmic jumping, rope visibly rotating around body, feet clearing rope each revolution", joints: "Rapid ankle-driven bounces, minimal knee bend, fast wrist rotation", weight: "Light, rhythmic, athletic cadence" },
    sceneRules: ["Jump rope visible and rotating around the athlete", "WIDE full-body shot head to toe", "Rhythmic athletic movement"],
    camera: "WIDE full-body shot, head to toe with space for rope arc, stable",
    fabricCue: "Shirt bounces with each hop, calves visible working with each jump — garment behavior clearly visible",
  },
  "running": {
    start: { position: "Natural running stance, slight forward lean, one foot striking ground", joints: "Neutral running posture, arms at 90°", weight: "Balls of feet" },
    mid: { position: "Natural running stride, alternating leg drives, opposite arm swing, heel-to-toe foot strike", joints: "Knee 90° hip flexion on drive, elbow 90° swing", weight: "Alternating single-leg contact, natural gait" },
    peak: { position: "Full running stride at comfortable pace, natural breathing rhythm, smooth athletic motion", joints: "Maximum knee lift on drive phase, full arm swing", weight: "Dynamic single-leg, natural weight transfer" },
    sceneRules: ["Natural running motion", "No treadmill", "WIDE full-body shot head to toe", "Smooth and fluid"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, stable or slight tracking",
    fabricCue: "Shirt bounces naturally with each stride, shorts and leggings flex at knees and hips — garment motion clearly visible",
  },
  "jumping": {
    start: { position: "Athletic quarter squat, arms drawn back, coiling to jump", joints: "Knees 130°, hips loaded, ankles ready to extend", weight: "Balls of feet, posterior chain loading" },
    mid: { position: "Explosive triple extension, arms driving overhead, body launching vertically", joints: "Full extension through ankles, knees, hips simultaneously", weight: "Leaving ground with full force" },
    peak: { position: "Fully airborne at peak height, body extended or tucked, arms overhead, then controlled landing", joints: "Full body extension or tuck at peak", weight: "Airborne at peak, absorbing on landing" },
    sceneRules: ["WIDE full-body shot with headroom", "Clean vertical or tuck jump", "Natural athletic jump"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable",
    fabricCue: "Fabric compresses at crouch, stretches along body during jump, ripples on landing — garment behavior clearly visible",
  },
};

// ---------------------------------------------------------------------------
// Realistic human-motion prompt builder
// Priority: Realism > Camera > Biomechanics > Fabric > Identity
// ---------------------------------------------------------------------------

// Concise biomechanical cues per exercise — pure movement physics, no fluff
const BIOMECH_CUES: Record<string, string> = {
  "squats": "BODYWEIGHT SQUAT, NO barbell/equipment. Arms forward for balance. Braces core, inhales. 2s controlled hip-hinge descent — knees track toes, thighs below parallel, visible quad/glute tension, skin taut over straining muscles. 0.5s pause at bottom showing effort on face. 1.5s drive up through mid-foot — hips and knees extend together, glutes squeeze at lockout. Slight forward torso lean throughout. Natural micro-wobble in balance.",
  "bench press": "BENCH PRESS on flat bench. Lying supine, natural back arch, feet planted. Barbell at arms length, slight arm tremor from load. 2s descent — bar lowers to mid-chest, elbows 45°, pecs stretching under visible strain. Brief touch, grimace of effort. 1.5s press — forceful exhale, chest/triceps contract visibly, arms lock out with controlled deceleration. Natural micro-tremor under weight.",
  "deadlifts": "DEADLIFT with barbell. Feet hip-width, hinges to grip bar, flattens back, takes slack out — visible tension building in traps and lats. 2s pull — bar breaks floor staying close to shins, hips drive forward past knees, full lockout with proud chest, glutes squeezed. 2s controlled eccentric back to floor. Slight facial grimace, natural grip shifts, bar has visible mass and inertia.",
  "pull-ups": "PULL-UP from overhead bar. Dead hang, lats fully stretched, body still. Scapular depression initiates — shoulders drop first. 2s controlled pull — chin clears bar, forearms straining, lats flaring visibly through shirt, slight natural body sway. 0.5s hold at top. 2s slow negative to full dead hang. Visible effort on face, natural grip micro-adjustments between reps.",
  "push-ups": "PUSH-UP from high plank. Body rigid head-to-heels — NO hip sag, NO pike. 2s descent — elbows 45°, scapulae pinch, chest 2in from floor. Visible pause, effort on face. 1.5s press — chest/triceps contract under skin, full lockout. Forearm veins visible. Slight micro-timing variation between reps like a real human.",
  "lunges": "LUNGE — steps forward heel-to-toe with visible weight transfer. 1.5s descent — front knee 90°, back knee 2in above floor, torso upright with core bracing. 1.5s drive up through front heel. Natural balance micro-adjustments, slight wobble, visible quad and glute engagement under skin.",
  "sprint": "SPRINT — explosive alternating knee drives past 90°, aggressive 90° arm pump, 15° forward lean, balls of feet striking with visible impact. Natural acceleration, slight stride asymmetry, visible exertion on face, muscles contracting through fabric with each stride.",
  "burpees": "BURPEE — fluid continuous sequence: squat-hands down, jump back to plank, full push-up (controlled descent and press), jump feet forward, explosive vertical jump with arms overhead, controlled landing absorbing impact. Natural transition timing between phases, visible fatigue.",
  "kettlebell swings": "KETTLEBELL SWING — kettlebell in both hands. Deep hip hinge with flat back, visible hamstring stretch. Explosive hip snap drives bell to chest height — power from hips, arms relaxed. Brief float at top. Controlled pendulum back down. Sharp exhale on each snap. Bell has visible weight and inertia.",
  "battle ropes": "BATTLE ROPES — athletic half-squat gripping rope ends. Powerful alternating arm waves with undulating wave patterns traveling down ropes with real physics. Natural rhythm with slight variations, visible shoulder fatigue building. Ropes have visible weight and resistance. Core visibly bracing.",
  "high knees": "HIGH KNEES — rapid alternating knee drives to chest height, opposite arm pumping, balls of feet with athletic cadence. Natural rhythm micro-variations, visible exertion, slight natural torso rotation with each drive.",
  "box jumps": "BOX JUMP — loads into squat, arms back. Explosive triple extension launching upward, knees tuck to clear edge. Soft controlled landing on box absorbing impact, stands tall. Visible loading tension, genuine explosive effort, natural balance on landing.",
  "squat jumps": "SQUAT JUMP — deep squat, arms back. Explosive triple extension launching airborne, arms overhead at peak. Controlled soft landing absorbing back into squat. Visible loading tension, natural landing absorption with balance adjustments.",
  "jump rope": "JUMP ROPE — rope handles in hands, elbows at sides. Wrists drive rope rotation, light bounces on balls of feet barely leaving ground. Rope visibly rotating with real physics. Natural rhythm, visible calf engagement.",
  "running": "RUNNING — natural stride with alternating leg drives and opposite arm swing. Heel-to-toe foot strike with visible ground contact. Natural gait with slight asymmetry, visible breathing rhythm, smooth fluid locomotion.",
  "jumping": "JUMP — athletic squat loading, arms back. Explosive vertical jump with full triple extension, arms overhead. Full body extension at peak. Controlled soft landing absorbing impact. Visible power and effort throughout.",
};

// Camera angle descriptions — maximally explicit
const CAMERA_ANGLE_PROMPTS: Record<string, string> = {
  "front": "Camera directly in front, straight-on frontal view, stable centered.",
  "side-left": "Camera 90° to the LEFT. FULL LEFT PROFILE VIEW — left arm closest, right arm farthest. SIDE VIEW not front.",
  "side-right": "Camera 90° to the RIGHT. FULL RIGHT PROFILE VIEW — right arm closest, left arm farthest. SIDE VIEW not front.",
  "back": "Camera DIRECTLY BEHIND athlete. We see BACK, spine, shoulder blades, back of head. FACE NOT VISIBLE. REAR VIEW not front.",
  "45-overhead": "Camera at 45° elevated angle looking DOWN at athlete from above. Bird's eye tilted downward. OVERHEAD not front.",
  "low-angle": "Camera at GROUND LEVEL looking UP at athlete. Dramatic low angle, feet prominent in foreground.",
  "dynamic-follow": "Camera SLOWLY ORBITING around athlete during movement, gentle cinematic tracking arc front to side.",
};

function buildMotionPrompt(
  movement: string,
  intensity: number,
  gender: string,
  bodyType: string,
  cameraAngle?: string,
): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];
  const g = gender || "Female";
  const bt = bodyType || "athletic";
  const cameraKey = cameraAngle || "front";
  const cameraPrompt = CAMERA_ANGLE_PROMPTS[cameraKey] || CAMERA_ANGLE_PROMPTS["front"];
  const isNonFront = cameraKey !== "front";

  // Core realism mandate — every generation gets this
  const REALISM = `Cinematic 24fps real gym footage on RED camera. REAL PHYSICS throughout: genuine weight, gravity, mass, inertia. Visible muscle contraction under skin, natural sweat sheen, subtle skin pores and texture. Breathing rhythm — ribcage expands on eccentric, sharp exhale on exertion. Natural micro-asymmetry between reps. ZERO robotic stiffness, ZERO rubber-band bouncing, ZERO floating, ZERO AI artifacts.`;

  const parts: string[] = [];

  // #1: Camera — FIRST
  parts.push(`CAMERA: ${cameraPrompt} WIDE full-body head to toe.`);
  if (isNonFront) {
    parts.push(`LOCKED ${cameraKey.replace("-", " ").toUpperCase()} angle entire video. NEVER rotate to front.`);
  }

  // #2: Realism mandate
  parts.push(REALISM);

  // #3: Athlete + exercise
  const intensityLabel = intensity > 70 ? "powerful explosive" : intensity > 40 ? "controlled athletic" : "slow deliberate";
  parts.push(`${g} ${bt} athlete performs ${key}, ${intensityLabel} tempo.`);

  // #4: Biomechanical cues — the core of realism
  const biomech = BIOMECH_CUES[key];
  if (biomech) {
    if (isNonFront) {
      // Condense for non-front to save chars for camera instructions
      parts.push(biomech.slice(0, 280));
    } else {
      parts.push(biomech);
    }
  }

  // #5: Scene rules from exercise def
  if (def?.sceneRules) {
    const rules = def.sceneRules.slice(0, 3).join(". ");
    parts.push(rules + ".");
  }

  // #6: Fabric physics — short
  const fabric = def?.fabricCue || "Garment stretches and compresses naturally with movement.";
  parts.push(fabric);

  // #7: Identity lock
  parts.push(`STRICT: Preserve exact athlete identity, garment, colors, logo from reference. Dark studio, cinematic lighting.`);

  // #8: Bookend camera for non-front
  if (isNonFront) {
    parts.push(`FINAL: ${cameraKey.replace("-", " ").toUpperCase()} perspective only.`);
  }

  let prompt = parts.join(" ");

  // Hard cap at sentence boundary
  const MAX = 1000;
  if (prompt.length > MAX) {
    prompt = prompt.slice(0, MAX);
    const lastPeriod = prompt.lastIndexOf(".");
    if (lastPeriod > MAX * 0.7) {
      prompt = prompt.slice(0, lastPeriod + 1);
    }
  }

  console.log(`RUNWAY PROMPT (${prompt.length} chars, angle: ${cameraKey}): ${prompt}`);
  return prompt;
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

    const body = await req.json();
    const mode = body.mode || "start"; // "start" or "poll"

    // ===== POLL MODE: Check status of existing task =====
    if (mode === "poll") {
      const { taskId: pollTaskId } = body;
      if (!pollTaskId) {
        return new Response(JSON.stringify({ error: "taskId is required for poll mode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pollResp = await fetch(`${RUNWAY_API_BASE}/tasks/${pollTaskId}`, {
        headers: {
          Authorization: `Bearer ${RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06",
        },
      });

      if (!pollResp.ok) {
        const errText = await pollResp.text();
        console.error(`RUNWAY poll error: ${pollResp.status} — ${errText}`);
        return new Response(JSON.stringify({ error: `Poll failed: ${pollResp.status}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pollData = await pollResp.json();
      const status = pollData.status;
      console.log(`RUNWAY: Poll taskId=${pollTaskId} — status: ${status}`);

      if (status === "SUCCEEDED") {
        const rawVideoUrl = pollData.output?.[0] || null;
        if (!rawVideoUrl) {
          return new Response(JSON.stringify({ status: "FAILED", error: "No output URL" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Download and store in Supabase
        let storedVideoUrl = rawVideoUrl;
        try {
          const videoResp = await fetch(rawVideoUrl);
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
        const movement = body.movement || "unknown";
        const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
        if (brand) {
          await supabase.from("usage_logs").insert({
            user_id: user.id,
            brand_id: brand.id,
            action: "generate_runway_video",
            credits_used: 5,
            metadata: { movement, cameraAngle: body.cameraAngle || "front", task_id: pollTaskId },
          });
        }

        return new Response(JSON.stringify({
          status: "SUCCEEDED",
          success: true,
          video_url: storedVideoUrl,
          runway_task_id: pollTaskId,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (status === "FAILED") {
        const failReason = pollData.failure || "Unknown failure";
        return new Response(JSON.stringify({ status: "FAILED", error: failReason }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Still running
      return new Response(JSON.stringify({ status, runway_task_id: pollTaskId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== START MODE: Create task and return immediately =====
    const {
      referenceImageUrl,
      movement,
      intensity,
      gender,
      bodyType,
      cameraAngle,
      duration,
    } = body;

    if (!referenceImageUrl) {
      return new Response(JSON.stringify({ error: "referenceImageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let motionPrompt = buildMotionPrompt(movement || "squats", intensity || 50, gender || "Female", bodyType || "athletic", cameraAngle || "front");

    const MAX_PROMPT = 1000;
    if (motionPrompt.length > MAX_PROMPT) {
      console.warn(`RUNWAY: Prompt truncated from ${motionPrompt.length} to ${MAX_PROMPT} chars`);
      motionPrompt = motionPrompt.slice(0, MAX_PROMPT);
    }

    console.log(`RUNWAY: Starting video generation for "${movement}" — prompt length: ${motionPrompt.length} chars`);

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

    // Return immediately with task ID — client will poll
    return new Response(
      JSON.stringify({
        status: "PENDING",
        runway_task_id: taskId,
        movement,
        cameraAngle: cameraAngle || "front",
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
