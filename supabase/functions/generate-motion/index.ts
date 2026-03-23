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

// ── Motion Realism Preamble ──
// Injected into every generation prompt to enforce physical plausibility
const MOTION_REALISM_PREAMBLE = `MOTION REALISM ENGINE — MANDATORY CONSTRAINTS:

BIOMECHANICAL ACCURACY (NON-NEGOTIABLE):
- Every joint must be at a physically possible angle — no hyperextension beyond anatomical limits
- The spine must maintain a neutral or naturally loaded curve appropriate to the exercise — NO unnatural bending, twisting, or S-curves that defy physics
- Limb proportions must remain CONSTANT — arms and legs do not stretch, shrink, or change length
- Shoulders, hips, knees, and ankles must maintain realistic proportional spacing
- Muscle engagement must be visible and anatomically correct for the exercise phase shown
- The athlete's center of gravity must be physically plausible — no floating or impossible balance

BODY INTEGRITY (ZERO TOLERANCE FOR DISTORTION):
- Head-to-body ratio must remain realistic (approximately 1:7.5 for adults)
- Hands and feet must be correctly proportioned and naturally positioned
- Fingers must be anatomically correct — 5 per hand, natural curl and grip
- No rubber-band limbs, no melting joints, no impossible contortions
- Weight-bearing limbs must show appropriate muscle tension and ground contact
- Facial expression must match exertion level — not blank or relaxed during peak effort

NATURAL MOVEMENT QUALITY:
- The pose must look like a FREEZE-FRAME from a real video, not a mannequin placement
- There must be visible momentum cues: slight motion blur direction, weight shift, dynamic tension
- Hair, clothing, and loose elements must respond to the direction of movement
- The athlete must look like they are IN the movement, not posing statically

GRAVITY AND PHYSICS:
- All objects and body parts must obey gravity — nothing floats without cause
- Ground contact must show appropriate pressure: compressed shoes, floor shadow, weight distribution
- Sweat and exertion signs must be proportional to intensity level`;

const EXERCISE_DEFS: Record<string, ExerciseMotionDef> = {
  "squats": {
    start: {
      position: "Standing upright, feet shoulder-width, arms at sides",
      joints: "Knees straight 180°, hips neutral",
      weight: "Centered on both feet",
      spine: "Neutral lordotic curve, head stacked over pelvis",
      balance: "Even bilateral weight distribution, stable base",
    },
    mid: {
      position: "Bending knees and hips, lowering body, torso slightly forward",
      joints: "Knees 120°, hips 110°, ankles dorsiflexed 15°",
      weight: "Shifting to heels, knees tracking over toes",
      spine: "Slight forward lean maintaining neutral curve, chest up",
      balance: "Weight shifts posteriorly, core braced for stability",
    },
    peak: {
      position: "Deep squat, thighs parallel, upright torso, arms forward for balance",
      joints: "Knees 75°, hips 70°, ankles dorsiflexed 25°",
      weight: "Deep into heels, tripod foot contact maintained",
      spine: "Neutral spine maintained under load, thoracic extension",
      balance: "Counterbalanced by arm position and torso angle",
    },
    sceneRules: ["Both feet flat on ground", "No equipment", "Full body visible head to toe", "Body never leaves ground"],
    camera: "WIDE full-body shot, head to toe with generous space around athlete, slight low angle, stable tripod",
    fabricCue: "Leggings stretch at quads and glutes, compression at knee crease — fabric shows visible tension lines radiating from knee joint",
    bodyConstraints: [
      "Knees MUST track over toes — never cave inward (valgus collapse)",
      "Heels MUST remain flat on ground throughout entire movement",
      "Torso angle mirrors shin angle (parallel lines when viewed from side)",
      "Hip crease MUST drop below knee line at peak depth",
      "Arms counterbalance forward — never behind the body",
    ],
    objectPhysics: [],
    movementFlow: "Controlled descent over 2 seconds, brief pause at depth, powerful drive upward through heels",
  },
  "push-ups": {
    start: {
      position: "High plank, arms extended, body straight line from head to heels",
      joints: "Elbows straight, wrists under shoulders",
      weight: "Distributed between hands and toes",
      spine: "Perfectly straight from crown to heels — no sag or pike",
      balance: "Hands shoulder-width, fingers spread for stability",
    },
    mid: {
      position: "Lowering chest toward ground, elbows bending outward, core tight",
      joints: "Elbows 90°, shoulders engaged",
      weight: "Shifting forward slightly",
      spine: "Rigid plank maintained — glutes and core fully engaged",
      balance: "Body moves as one unit, no hip drop or pike",
    },
    peak: {
      position: "Chest near floor, body rigid and straight, elbows bent",
      joints: "Elbows 45-60° from torso, shoulders loaded",
      weight: "On hands and toes, chest 2-3 inches from floor",
      spine: "Absolute plank integrity — hips level with shoulders and ankles",
      balance: "Maximal anterior chain tension, scapulae retracted",
    },
    sceneRules: ["Body on floor level", "No bench or elevated surface", "Full body visible from head to toes in profile", "Body forms straight line at all times"],
    camera: "WIDE full-body shot from low side angle showing entire body from head to toes, stable tripod, never crop any body part",
    fabricCue: "Shirt stretches across upper back and shoulders showing lat spread, compresses at chest showing pec engagement — visible tension across scapular region",
    bodyConstraints: [
      "Body forms ONE STRAIGHT LINE from head through hips to heels — no sagging hips, no piked hips",
      "Elbows tuck at 45° from torso — not flared out at 90°",
      "Head in neutral position — looking slightly ahead of hands, not dropped or craned up",
      "Glutes and quads visibly engaged to maintain plank",
      "Wrists directly under shoulders in start position",
    ],
    objectPhysics: [],
    movementFlow: "Controlled 2-second lowering, brief chest-near-floor hold, explosive press to lockout",
  },
  "deadlifts": {
    start: {
      position: "Standing behind barbell on floor, hinging at hips to grip bar, flat back, shoulders over bar",
      joints: "Hips hinged 80°, knees slightly bent 130°, spine neutral",
      weight: "Mid-foot, loaded into hamstrings and glutes",
      spine: "FLAT back — neutral lumbar curve, thoracic extension, NO rounding at any point",
      balance: "Weight centered over mid-foot, shoulders slightly in front of bar",
    },
    mid: {
      position: "Pulling barbell off ground, bar close to shins, back angle constant, driving through legs",
      joints: "Hips and knees extending together, bar past knees",
      weight: "Shifting from quads to posterior chain",
      spine: "Back angle unchanged from start — spine angle maintained until bar passes knees",
      balance: "Bar travels in straight vertical line close to body, center of pressure at mid-foot",
    },
    peak: {
      position: "Full standing lockout, hips fully extended, barbell at hip level, glutes squeezed, chest tall",
      joints: "Knees 180°, hips 180°, fully extended",
      weight: "Centered, stable at top, bar resting against thighs",
      spine: "Fully erect, shoulders retracted and depressed, proud chest",
      balance: "Standing tall, weight evenly distributed, barbell balanced at arm's length",
    },
    sceneRules: ["Barbell MUST be visible on the ground and in hands", "Barbell NEVER cut off at edges", "WIDE full-body shot head to toe", "Feet stay planted", "Bar travels close to body"],
    camera: "WIDE full-body shot from 30° side angle, head to toe with space around athlete, barbell fully visible, stable tripod",
    fabricCue: "Fabric stretches at hamstrings and lower back during pull, shirt tightens across upper back at lockout — compression visible at glute-hamstring junction",
    bodyConstraints: [
      "FLAT BACK is NON-NEGOTIABLE — spine must maintain neutral curve throughout entire lift",
      "Bar MUST travel in a straight vertical line, staying within 1 inch of the body",
      "Shoulders start slightly in front of bar, end directly over it at lockout",
      "Hips and knees extend SIMULTANEOUSLY — not hips first (stripper deadlift)",
      "At lockout: full hip extension, shoulders back, glutes squeezed — NOT leaning back",
      "Feet flat, shoulder-width, toes slightly pointed out 15-30°",
    ],
    objectPhysics: [
      "Barbell MUST appear heavy — plates cause slight flex in bar under load",
      "Barbell grip shows white knuckles and forearm tension",
      "Plates on each end are symmetric and identical",
      "Bar height off ground is consistent with standard 45lb plate diameter",
    ],
    movementFlow: "Powerful pull from floor with leg drive, smooth transition past knees, hip snap to lockout, controlled descent maintaining bar contact with legs",
  },
  "lunges": {
    start: {
      position: "Standing upright, feet hip-width apart",
      joints: "Knees straight, hips neutral",
      weight: "Centered",
      spine: "Tall and neutral, shoulders over hips",
      balance: "Stable bilateral stance",
    },
    mid: {
      position: "One leg forward, both knees bending, lowering body",
      joints: "Front knee 110°, back knee 120°",
      weight: "Split between both feet",
      spine: "Vertical torso — no forward lean, no lateral tilt",
      balance: "60/40 weight split favoring front leg",
    },
    peak: {
      position: "Deep lunge, front thigh parallel, back knee near ground without touching",
      joints: "Front knee 90°, back knee 90°",
      weight: "60% front foot, 40% back foot",
      spine: "Perfectly vertical — crown of head directly over pelvis",
      balance: "Hip-width stance maintained for lateral stability, core braced",
    },
    sceneRules: ["No equipment", "Full body visible head to toe", "Feet on ground", "Upright torso"],
    camera: "WIDE full-body shot, head to toe with space for full stride length, stable tripod",
    fabricCue: "Dramatic stretch at front quad and back hip flexor, compression at bent knee — fabric tension lines visible across hip joint",
    bodyConstraints: [
      "Front knee MUST track directly over front ankle — never past toes, never caving inward",
      "Back knee descends straight down, nearly touching floor",
      "Torso remains VERTICAL — no forward lean or lateral tilt",
      "Hips remain square (facing forward), not rotating",
      "Front shin approximately vertical from side view",
    ],
    objectPhysics: [],
    movementFlow: "Controlled step forward, smooth descent to 90/90, powerful drive back to standing through front heel",
  },
  "pull-ups": {
    start: {
      position: "Athlete hanging from a horizontal pull-up bar above, arms fully extended overhead, hands gripping bar slightly wider than shoulder width, body vertical, feet slightly behind body",
      joints: "Shoulders fully extended, elbows straight 180°",
      weight: "Hanging from hands, body suspended",
      spine: "Slight hollow body position — lats engaged, shoulders packed down away from ears",
      balance: "Dead hang with controlled body — no swinging, no kipping",
    },
    mid: {
      position: "Athlete pulling body upward, elbows bending naturally, chest approaching the bar, body remaining vertical",
      joints: "Elbows 110°, shoulders adducting and depressing",
      weight: "Pulling upward through grip",
      spine: "Slight thoracic extension as chest drives toward bar",
      balance: "Controlled vertical pull — no swinging momentum, no knee drive",
    },
    peak: {
      position: "Chin above the bar, elbows fully bent, shoulders engaged and depressed, body controlled and stable",
      joints: "Elbows 45°, shoulders fully contracted, scapulae squeezed",
      weight: "Suspended at top of pull",
      spine: "Proud chest, slight back arch, chin clearing bar",
      balance: "Peak contraction hold — body still, no momentum",
    },
    sceneRules: ["Pull-up bar MUST be above the athlete", "Athlete MUST hang below the bar", "Bar must NEVER appear behind the neck", "Body must NEVER stand on the floor during the movement", "Full body ALWAYS visible from bar to hanging feet"],
    camera: "WIDE full-body vertical shot showing bar at top and feet at bottom with generous space, stable camera, never crop bar or feet",
    fabricCue: "Back of shirt stretches dramatically showing lat engagement and V-taper, sleeves compress around biceps showing peak contraction — visible tension across entire posterior chain of garment",
    bodyConstraints: [
      "Arms pull VERTICALLY — elbows drive down and back, not forward",
      "Body remains vertical — no horizontal swinging or kipping",
      "Shoulders depress FIRST (pull down from ears), then elbows bend",
      "At top: chin above bar, chest close to bar, lats fully contracted",
      "Grip is overhand (pronated), slightly wider than shoulders",
      "Legs remain relatively straight or slightly crossed — no knee drive for momentum",
    ],
    objectPhysics: [
      "Pull-up bar is FIXED, horizontal, and rigid — does not bend or flex",
      "Bar is positioned high enough for full arm extension without feet touching ground",
      "Hands show white-knuckle grip tension, forearms visibly engaged",
    ],
    movementFlow: "Dead hang start, shoulder depression initiation, smooth pull through mid-range, controlled chin-over-bar peak, slow eccentric lowering to full hang",
  },
  "bench press": {
    start: {
      position: "Athlete lying flat on a weight bench, feet flat on floor, hands gripping barbell above chest at full arm extension, shoulder blades pinched together, slight arch in lower back",
      joints: "Elbows locked out, wrists stacked directly over elbows",
      weight: "Bar supported at full extension above chest",
      spine: "Natural arch in lower back, upper back firmly pressed into bench, shoulder blades retracted and depressed",
      balance: "Five-point contact: head, upper back, glutes on bench; both feet flat on floor",
    },
    mid: {
      position: "Lowering barbell with control toward lower chest, elbows at 45° angle from torso, bar descending slowly, athlete lying on bench",
      joints: "Elbows 90°, shoulders externally rotated, deep pec stretch",
      weight: "Bar descending under control to chest",
      spine: "Arch maintained, shoulder blades remain pinched, stable base",
      balance: "Feet driving into floor for leg drive, glutes on bench",
    },
    peak: {
      position: "Explosive press upward, driving barbell off chest, arms extending fully to lockout, athlete still lying flat on bench",
      joints: "Full elbow extension, chest contracted, bar stable overhead",
      weight: "Pressing through palms, driving weight upward",
      spine: "Maintained arch, bar path curves slightly back toward face at lockout",
      balance: "Leg drive through feet, stable five-point contact maintained throughout",
    },
    sceneRules: ["Weight bench MUST be visible underneath athlete", "Barbell MUST be visible in hands and NEVER cut off", "Athlete MUST be lying on back on bench", "NEVER standing", "NEVER in plank or push-up position", "Feet flat on floor beside bench", "ENTIRE body visible from head to feet including full barbell length"],
    camera: "WIDE full-body shot from slight side angle showing ENTIRE athlete lying on bench from head to feet, barbell fully visible end to end, never crop any part of body or equipment",
    fabricCue: "Shirt stretches across chest during press showing pec engagement, fabric tightens at shoulders under load — compression visible at anterior deltoids",
    bodyConstraints: [
      "Athlete is LYING HORIZONTALLY on bench — NEVER standing, sitting, or in push-up position",
      "Five-point contact maintained: head, upper back, glutes on bench; both feet on floor",
      "Shoulder blades pinched together and pressed into bench — creates natural thoracic arch",
      "Elbows at 45° from torso — not flared at 90° (shoulder injury position)",
      "Bar touches lower chest (nipple line), NOT upper chest or neck",
      "At lockout: bar is over shoulder joint, not over face or belly",
      "Wrists straight and stacked over elbows — no wrist flexion",
    ],
    objectPhysics: [
      "Barbell shows slight flex under load — not rigid like a broomstick",
      "Weight plates are symmetric on both ends, identical sizes",
      "Bench is flat, stable, and at correct height (feet flat on floor, thighs roughly parallel)",
      "Barbell grip shows chalk marks or knurling contact, firm grip tension",
    ],
    movementFlow: "Controlled unrack, slow 2-second descent to chest, brief touch-and-go at chest, explosive drive to lockout with slight J-curve bar path",
  },
  "sprint": {
    start: {
      position: "Standing tall, ready position, slight forward lean",
      joints: "Neutral standing",
      weight: "Balls of feet",
      spine: "Slight forward lean from ankles, straight line from ear to ankle",
      balance: "Athletic ready position, weight forward",
    },
    mid: {
      position: "Sprinting, one knee driving high, opposite arm pumping forward",
      joints: "Drive knee 90° hip flexion, opposite elbow 90° driving forward",
      weight: "Single-leg stance phase, powerful ground contact",
      spine: "Slight forward lean maintained, torso stable and not rotating",
      balance: "Contralateral arm-leg coordination, core stabilizing rotation",
    },
    peak: {
      position: "Maximum knee drive, explosive arm pump, powerful stride",
      joints: "Knee at maximum height (thigh parallel or above), full arm extension behind",
      weight: "Explosive single-leg power drive through ball of foot",
      spine: "Forward lean 15-20° from vertical, rigid torso",
      balance: "Dynamic single-leg balance at peak drive, ground reaction force visible",
    },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, stable tripod",
    fabricCue: "Intense fabric ripple and bounce with each explosive stride, shorts flutter with leg drive — garment shows dynamic movement response",
    bodyConstraints: [
      "Arm-leg coordination is CONTRALATERAL: right knee up = left arm forward",
      "Arms pump forward-back along the body — NOT across the midline",
      "Hands relaxed (not clenched fists), elbows at 90°",
      "Dorsiflexed ankle on drive leg (toe pulled up toward shin)",
      "Support foot contacts ground under center of mass, not ahead",
    ],
    objectPhysics: [],
    movementFlow: "Explosive, rhythmic alternation with visible power generation from hip drive and arm coordination",
  },
  "burpees": {
    start: {
      position: "Standing upright, arms at sides",
      joints: "Neutral standing",
      weight: "Centered",
      spine: "Tall and neutral",
      balance: "Stable bilateral stance",
    },
    mid: {
      position: "In plank position, body straight, arms extended, about to perform push-up",
      joints: "Shoulders over wrists, body rigid, elbows locked",
      weight: "Hands and toes",
      spine: "Perfect plank — straight line from head to heels",
      balance: "Stable four-point contact, core braced",
    },
    peak: {
      position: "Explosive jump upward, arms reaching overhead, body fully extended in air",
      joints: "Full triple extension (ankles, knees, hips), arms overhead",
      weight: "Airborne at peak height",
      spine: "Fully extended vertical, slight back extension at peak",
      balance: "Airborne, body aligned vertically, prepared for soft landing",
    },
    sceneRules: ["No equipment", "Full body visible with generous headroom for jump", "Clear floor space"],
    camera: "WIDE full-body shot from slight side angle, head to toe with extra headroom for jump, stable tripod",
    fabricCue: "Maximum fabric dynamics: stretch at back in plank, compression at chest in push-up phase, stretch and flutter during explosive jump — garment behavior changes with each phase",
    bodyConstraints: [
      "Plank phase: body is ONE STRAIGHT LINE — no hip sag or pike",
      "Jump phase: full triple extension before feet leave ground",
      "Landing: soft knees, absorbing impact, not stiff-legged",
      "Transitions are fluid: squat-thrust to plank is one smooth motion",
    ],
    objectPhysics: [],
    movementFlow: "Standing → squat down hands to floor → thrust back to plank → push-up → thrust forward to squat → explosive vertical jump → soft landing",
  },
  "high knees": {
    start: {
      position: "Standing tall, arms ready at 90° elbow bend",
      joints: "Neutral standing, elbows 90°",
      weight: "Balls of feet",
      spine: "Tall and vertical, slight forward lean",
      balance: "Athletic ready stance",
    },
    mid: {
      position: "One knee driving up toward chest, opposite arm pumping forward",
      joints: "Drive knee 90° hip flexion, opposite arm forward",
      weight: "Single-leg stance, bouncing rhythm",
      spine: "Vertical torso, no forward fold",
      balance: "Rapid alternating single-leg balance",
    },
    peak: {
      position: "Knee at chest height, rapid alternating rhythm, arms pumping",
      joints: "Maximum hip flexion 90°+, knee tucked tight",
      weight: "Quick alternating ground contact on balls of feet",
      spine: "Upright — torso does NOT fold forward to meet the knee",
      balance: "Fast rhythmic alternation with controlled upper body",
    },
    sceneRules: ["No equipment", "Standing in place", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space around athlete, stable tripod",
    fabricCue: "Leggings stretch at hip with each knee drive, shirt bounces with rhythm — garment shows rapid dynamic response",
    bodyConstraints: [
      "Torso stays UPRIGHT — the knee comes up to the chest, the chest does NOT come down to the knee",
      "Arm-leg coordination is contralateral: right knee = left arm forward",
      "Ground contact is on balls of feet only, heels never touch",
      "Movement is VERTICAL, not forward-leaning",
    ],
    objectPhysics: [],
    movementFlow: "Fast rhythmic alternating knee drives with arm pumps, staying tall and bouncy on balls of feet",
  },
  "box jumps": {
    start: {
      position: "Athletic quarter squat facing a plyometric box, arms drawn back, coiling to explode",
      joints: "Knees 130°, hips 120°, ankles loaded",
      weight: "Balls of feet, loading posterior chain",
      spine: "Slight forward lean, neutral spine, eyes on box top",
      balance: "Weight loaded in legs, countermovement arm swing back",
    },
    mid: {
      position: "Explosive triple extension, body launching upward, knees tucking to clear box",
      joints: "Full extension then rapid knee tuck, arms driving overhead",
      weight: "Airborne, traveling upward",
      spine: "Extending through jump, then flexing for knee tuck",
      balance: "Airborne trajectory aimed at box center",
    },
    peak: {
      position: "Landing softly on top of the box in athletic squat, absorbing impact, then standing tall on box",
      joints: "Knees 100° on landing, absorbing impact, then full stand",
      weight: "Soft landing through mid-foot on box surface",
      spine: "Absorbing impact with slight forward lean, then standing tall",
      balance: "Stable landing on box surface, both feet planted",
    },
    sceneRules: ["Plyometric box or platform MUST be visible", "Athlete jumps ONTO the box", "WIDE full-body shot head to toe with headroom", "Box fully visible"],
    camera: "WIDE full-body shot from slight side angle, head to toe including box, generous headroom, stable tripod",
    fabricCue: "Strong fabric stretch during loading crouch, visible compression at knees on soft landing — garment reacts to explosive force then deceleration",
    bodyConstraints: [
      "Takeoff uses FULL triple extension: ankles, knees, and hips all fully extend before feet leave ground",
      "Landing is SOFT: knees bend to absorb, not stiff-legged",
      "Arms drive upward to assist jump, then stabilize on landing",
      "Feet land SIMULTANEOUSLY on box — not one foot at a time",
      "Box height is realistic — approximately knee to hip height",
    ],
    objectPhysics: [
      "Plyometric box is SOLID, stable, and does not move on landing",
      "Box surface is flat and at consistent height",
      "Box shows realistic material: rubber-topped wood or foam",
    ],
    movementFlow: "Countermovement arm swing → explosive triple extension → tuck knees to clear box → soft bilateral landing on box → stand tall",
  },
  "squat jumps": {
    start: {
      position: "Standing, then dropping into full squat",
      joints: "Knees 75°, deep squat, ankles dorsiflexed",
      weight: "Deep in heels, loaded for explosion",
      spine: "Neutral, slight forward lean at bottom of squat",
      balance: "Loaded bilateral stance, arms back for countermovement",
    },
    mid: {
      position: "Exploding upward from squat, body extending rapidly",
      joints: "Rapidly extending all joints: ankles, knees, hips simultaneously",
      weight: "Driving through feet, about to leave ground",
      spine: "Extending from forward lean to vertical as body launches",
      balance: "Transitioning from bilateral ground contact to airborne",
    },
    peak: {
      position: "Fully airborne, body extended, arms reaching up",
      joints: "Full triple extension in air, ankles plantar-flexed (toes pointed down)",
      weight: "Airborne at peak height",
      spine: "Fully extended vertical, slight back extension",
      balance: "Airborne, aligned vertically, arms overhead for height",
    },
    sceneRules: ["No equipment", "Full body visible head to toe with headroom for jump", "Feet leave ground"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable tripod",
    fabricCue: "Maximum legging stretch at squat bottom, fabric stretches along legs during jump — garment shows loading and explosive release",
    bodyConstraints: [
      "Full squat depth before jump — thighs parallel or below",
      "Triple extension drives the jump: ankles, knees, hips ALL extend",
      "Arms swing from behind to overhead to assist jump height",
      "Toes point down at peak height (plantar flexion)",
      "Landing is soft with knees bending to absorb — never stiff-legged",
    ],
    objectPhysics: [],
    movementFlow: "Deep squat loading → explosive arm swing and triple extension → maximum height airborne → soft landing absorbing into next squat",
  },
  "kettlebell swings": {
    start: {
      position: "Wide stance, hinged at hips, kettlebell held with both hands between legs, back flat",
      joints: "Hips deeply hinged 80°, knees slightly bent 20°, spine neutral",
      weight: "Posterior loaded, weight in heels, hamstrings on stretch",
      spine: "FLAT back — neutral lumbar, thoracic extension, gaze 6 feet ahead on floor",
      balance: "Weight back in hips, kettlebell behind knee line in backswing",
    },
    mid: {
      position: "Explosive hip drive forward, snapping hips, swinging kettlebell upward with momentum from hips",
      joints: "Hips extending rapidly, knees straightening, arms passive",
      weight: "Driving through heels, weight transferring forward with hip snap",
      spine: "Rapidly extending from hinged to vertical with hip power",
      balance: "Hip drive creates momentum — arms are passive, not pulling",
    },
    peak: {
      position: "Standing tall, kettlebell at chest or eye height, hips fully locked out",
      joints: "Full hip extension, arms relaxed at shoulder height, glutes squeezed",
      weight: "Centered and tall, kettlebell floating at peak of arc",
      spine: "Fully erect, glutes locked, slight posterior pelvic tilt",
      balance: "Standing tall with kettlebell at weightless peak before descent",
    },
    sceneRules: ["Kettlebell MUST be visible in hands and NEVER cut off", "WIDE full-body shot head to toe", "Hip-driven explosive movement", "Smooth pendulum arc"],
    camera: "WIDE full-body shot from slight side angle, head to toe showing kettlebell arc, never crop equipment, stable tripod",
    fabricCue: "Dramatic fabric movement with each swing cycle: shirt rides up during deep hinge, pulls down at lockout — garment responds to explosive hip extension",
    bodyConstraints: [
      "This is a HIP HINGE — not a squat. Hips go BACK, minimal knee bend",
      "Arms are PASSIVE PENDULUMS — the hips power the swing, not the shoulders",
      "At the top: glutes SQUEEZED, body forms straight vertical line",
      "Kettlebell floats at peak — there is a brief weightless moment",
      "Flat back ALWAYS — never rounded lumbar at any point",
      "Eyes look forward (not up or down) — gaze follows kettlebell naturally",
    ],
    objectPhysics: [
      "Kettlebell follows smooth PENDULUM ARC — not jerky or linear",
      "Kettlebell handle orientation changes naturally through the swing arc",
      "Kettlebell shows realistic weight: arms show tension, grip is firm",
      "The bell portion hangs below the handle at all times",
    ],
    movementFlow: "Backswing hinge → explosive hip snap → kettlebell floats to chest height → controlled fall back between legs → repeat",
  },
  "jump rope": {
    start: {
      position: "Standing tall, holding jump rope handles, elbows close to body at 90°, wrists ready to rotate",
      joints: "Elbows 90° close to ribs, wrists active, slight knee bend",
      weight: "Balls of feet, light and bouncy",
      spine: "Tall, vertical, head neutral, looking forward",
      balance: "Light on feet, ready to bounce, minimal ground contact time",
    },
    mid: {
      position: "Rope rotating overhead and under feet, small bounces on balls of feet, wrists driving rotation",
      joints: "Ankles extending with each hop, knees softly bending, wrists spinning rope",
      weight: "Light bounces, barely leaving ground, 1-2 inches of air",
      spine: "Vertical and stable — torso does not bounce or lean",
      balance: "Feet together, bouncing in rhythm, arms still and close to body",
    },
    peak: {
      position: "Fast rhythmic jumping, rope visibly rotating around body, feet clearing rope each revolution",
      joints: "Rapid ankle-driven bounces, minimal knee bend, fast wrist rotation",
      weight: "Light, rhythmic, athletic cadence on balls of feet",
      spine: "Perfectly still upper body — only wrists and ankles move significantly",
      balance: "Relaxed rhythm, minimal energy expenditure per jump, efficient movement",
    },
    sceneRules: ["Jump rope MUST be visible rotating around the athlete", "WIDE full-body shot head to toe with space for rope arc", "Rhythmic athletic movement"],
    camera: "WIDE full-body shot, head to toe with space for rope arc, stable tripod",
    fabricCue: "Shirt bounces with each hop, calves visible working — garment shows light repetitive bouncing motion",
    bodyConstraints: [
      "Arms stay CLOSE to body — elbows at ribs, only wrists rotate",
      "Jumps are SMALL (1-2 inches) — not exaggerated high jumps",
      "Landing is on BALLS OF FEET only — heels never touch ground",
      "Upper body is STILL — all visible movement is wrists and feet",
      "Body stays vertical — no leaning forward or backward",
    ],
    objectPhysics: [
      "Jump rope forms smooth circular arc around the body",
      "Rope shows natural curve from gravity — not rigid straight lines",
      "Handles are held at hip height, rope passes overhead and under feet",
      "Rope speed is realistic: visible but slightly blurred in motion",
    ],
    movementFlow: "Light rhythmic bouncing on balls of feet with wrist-driven rope rotation, steady cadence like a metronome",
  },
  "running": {
    start: {
      position: "Standing in running position, slight forward lean",
      joints: "Neutral standing, arms at 90° ready",
      weight: "Balls of feet, forward lean from ankles",
      spine: "Slight forward lean, straight line from ear through hip to ankle",
      balance: "Ready athletic stance",
    },
    mid: {
      position: "Jogging, alternating knee drives, opposite arm swing",
      joints: "Knee 90° hip flexion, elbow 90° in arm swing",
      weight: "Alternating single-leg ground contact on mid-foot",
      spine: "Stable, minimal rotation, slight forward lean maintained",
      balance: "Contralateral arm-leg coordination for rotational stability",
    },
    peak: {
      position: "Full running stride, high knee drive, powerful arm pump",
      joints: "Maximum knee lift, full arm swing forward-back",
      weight: "Dynamic single-leg stance, mid-foot strike",
      spine: "Stable and forward-leaning, core preventing excessive rotation",
      balance: "Dynamic single-leg balance with arm counterbalance",
    },
    sceneRules: ["Running in place", "No treadmill", "No equipment", "Full body visible head to toe"],
    camera: "WIDE full-body shot, head to toe with space for arm swing, stable tripod",
    fabricCue: "Shirt bounces with each stride, leggings flex at knees and hips — garment shows rhythmic running dynamics",
    bodyConstraints: [
      "Contralateral coordination: right leg forward = left arm forward",
      "Arms swing FORWARD-BACK, not across the body midline",
      "Foot strikes under center of mass, not out in front (no overstriding)",
      "Relaxed hands — no clenched fists",
      "Head stable and level — not bobbing excessively",
    ],
    objectPhysics: [],
    movementFlow: "Rhythmic alternating stride with efficient arm pump, foot contact under center of mass, forward lean from ankles",
  },
  "jumping": {
    start: {
      position: "Quarter squat, arms drawn back for countermovement",
      joints: "Knees 130°, hips 120°, ankles loaded",
      weight: "Balls of feet, loading for explosion",
      spine: "Slight forward lean, loading position",
      balance: "Bilateral loaded stance, arms back",
    },
    mid: {
      position: "Exploding upward, arms driving overhead powerfully",
      joints: "Full triple extension: ankles, knees, hips extending simultaneously",
      weight: "Leaving ground, driving upward",
      spine: "Extending to fully vertical during launch",
      balance: "Bilateral launch, symmetric force production",
    },
    peak: {
      position: "Fully airborne, body extended, arms overhead at maximum height",
      joints: "Full body extension, toes pointed down",
      weight: "Airborne at peak",
      spine: "Fully extended, slight back extension at peak",
      balance: "Airborne, vertically aligned, arms reaching maximum height",
    },
    sceneRules: ["No equipment", "Full body visible head to toe with headroom", "Clean vertical jump"],
    camera: "WIDE full-body shot, head to toe with generous headroom, stable tripod",
    fabricCue: "Fabric compresses at squat loading, stretches during explosive jump, ripples on landing — garment shows full force-response cycle",
    bodyConstraints: [
      "Countermovement arm swing is essential for maximum jump height",
      "Triple extension (ankles, knees, hips) must be COMPLETE before feet leave ground",
      "Toes point down at peak (plantar flexion)",
      "Landing absorbs impact through knees — NEVER stiff-legged",
      "Jump is VERTICAL — minimal forward or backward drift",
    ],
    objectPhysics: [],
    movementFlow: "Countermovement squat with arm swing → explosive triple extension → vertical launch → peak height → soft bilateral landing",
  },
  "battle ropes": {
    start: {
      position: "Athletic half-squat stance, gripping one rope end in each hand, arms extended toward anchor point",
      joints: "Knees 120°, hips 110°, elbows slightly bent, shoulders engaged",
      weight: "Athletic base, weight in heels, squat stance",
      spine: "Neutral with slight forward lean, core braced",
      balance: "Wide stable base, lower body anchored",
    },
    mid: {
      position: "Alternating arm waves, creating undulating waves in the ropes, lower body stable",
      joints: "Shoulders alternating flexion/extension, elbows slightly bent, knees stable",
      weight: "Anchored in legs, upper body generating force",
      spine: "Stable core, minimal rotation, slight forward lean maintained",
      balance: "Lower body provides stable platform for upper body power",
    },
    peak: {
      position: "Maximum wave amplitude, ropes showing dramatic undulation, powerful arm drives",
      joints: "Full shoulder range of motion, rapid alternation, core fully engaged",
      weight: "Explosive arm drives while maintaining squat base",
      spine: "Rigid core transfers force from legs through arms to ropes",
      balance: "Athletic base absorbs reactive forces from rope waves",
    },
    sceneRules: ["Battle ropes MUST be visible extending from hands to anchor point", "WIDE shot showing full rope length", "Rope anchor visible", "Athletic squat stance"],
    camera: "WIDE full-body shot from front or slight angle, showing full rope length, stable tripod",
    fabricCue: "Shirt shows rapid dynamic movement at shoulders and arms, lower body garment stable — contrast between upper and lower body fabric behavior",
    bodyConstraints: [
      "Lower body is ANCHORED in athletic squat — does not bounce or stand up",
      "Arms alternate in rhythm — creating wave pattern in ropes",
      "Core is BRACED to prevent torso rotation",
      "Grip is firm but not death-grip — forearms show engagement",
      "Waves originate from SHOULDER MOVEMENT, not just arm flapping",
    ],
    objectPhysics: [
      "Ropes show realistic WAVE PATTERN — smooth sinusoidal undulation",
      "Waves travel FROM hands TOWARD the anchor point",
      "Rope thickness and weight appear consistent along length",
      "Anchor point is fixed and stable — ropes are attached securely",
      "Rope sag is realistic — showing the weight of the ropes between waves",
    ],
    movementFlow: "Stable squat base → alternating powerful arm drives → rhythmic wave propagation through ropes → continuous athletic cadence",
  },
};

// Build biomechanical pose instructions for image generation
function buildPoseInstructions(movement: string, angle: string): string {
  const key = movement.toLowerCase().replace(/-/g, " ");
  const def = EXERCISE_DEFS[key];

  if (!def) {
    return `${MOTION_REALISM_PREAMBLE}

The athlete performs ${movement} with smooth, natural, biomechanically correct form. Full body must be visible head to toe. No equipment. The pose must look like a freeze-frame from real training footage.`;
  }

  const sceneStr = def.sceneRules.join(". ");
  const constraintStr = def.bodyConstraints.join("\n• ");
  const objectStr = def.objectPhysics.length > 0
    ? `\nOBJECT PHYSICS (MANDATORY):\n• ${def.objectPhysics.join("\n• ")}`
    : "";

  // Angle-specific pose reinforcement for exercises where body orientation is critical
  let angleReinforcement = "";
  const isSide = angle === "side" || angle === "side-left" || angle === "side-right";
  const angleLabel = angle.replace("-", " ").toUpperCase();
  if (key === "bench press") {
    if (angle === "front") {
      angleReinforcement = `\nANGLE-SPECIFIC (FRONT VIEW): Camera positioned at the athlete's feet looking toward the head. Athlete is LYING FLAT on the bench, face visible, barbell above chest. The bench runs away from camera. Athlete is HORIZONTAL, NOT sitting, NOT standing.`;
    } else if (isSide) {
      angleReinforcement = `\nANGLE-SPECIFIC (${angleLabel} VIEW): Camera positioned at the ${angle === "side-right" ? "right" : "left"} side of the bench. Athlete is LYING FLAT on the bench seen from the side — head on one end, feet on the floor at the other end. The full horizontal body position must be clearly visible. Barbell above chest. Athlete is HORIZONTAL, NOT sitting up, NOT vertical.`;
    } else if (angle === "back") {
      angleReinforcement = `\nANGLE-SPECIFIC (BACK VIEW): Camera positioned behind the athlete's head looking down the bench. Athlete is LYING FLAT on the bench, back of head visible, barbell above chest. Athlete is HORIZONTAL, NOT sitting, NOT standing.`;
    }
  } else if (key === "pull-ups") {
    angleReinforcement = `\nANGLE-SPECIFIC (${angleLabel} VIEW): Athlete is HANGING from a bar ABOVE — body is VERTICAL and SUSPENDED, feet off the ground. The bar is at the TOP of the frame, feet at the BOTTOM. Camera shows ${angleLabel.toLowerCase()} of the hanging athlete.`;
  } else if (key === "push-ups") {
    angleReinforcement = `\nANGLE-SPECIFIC (${angleLabel} VIEW): Athlete is in HORIZONTAL plank/push-up position on the FLOOR. Body is PARALLEL to the ground, NOT standing, NOT sitting. Camera shows ${angleLabel.toLowerCase()} of the athlete on the floor.`;
  }

  return `${MOTION_REALISM_PREAMBLE}

BIOMECHANICAL MOVEMENT DEFINITION for ${movement}:

START POSITION: ${def.start.position}. Joints: ${def.start.joints}. Weight: ${def.start.weight}. Spine: ${def.start.spine}. Balance: ${def.start.balance}.

MID MOVEMENT: ${def.mid.position}. Joints: ${def.mid.joints}. Weight: ${def.mid.weight}. Spine: ${def.mid.spine}. Balance: ${def.mid.balance}.

PEAK POSITION: ${def.peak.position}. Joints: ${def.peak.joints}. Weight: ${def.peak.weight}. Spine: ${def.peak.spine}. Balance: ${def.peak.balance}.

The athlete should be shown at the MID or PEAK phase — the most dynamic and visually impactful moment.
FULL RANGE OF MOTION: The movement must show COMPLETE range — all the way down AND all the way back up. Never show partial reps.

BODY CONSTRAINTS (STRICT — VIOLATIONS INVALIDATE THE IMAGE):
• ${constraintStr}
${objectStr}

MOVEMENT FLOW: ${def.movementFlow}
${angleReinforcement}

SCENE RULES (STRICT): ${sceneStr}.
CAMERA: ${def.camera}.
GARMENT BEHAVIOR: ${def.fabricCue}.

The pose must follow these biomechanical rules EXACTLY. It must look like a FREEZE-FRAME from professional training footage of a real athlete — not a mannequin, not an AI render, not a static pose. The body must show dynamic tension, momentum cues, and natural weight distribution.`;
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

// ── Helper: validate generated image quality + master scene consistency ──
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
      angle,
      movement,
      hasReferenceImage: !!referenceImageUrl,
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
        messages: [{
          role: "user",
          content: contentParts,
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
    const motionIntelligencePrompt = body.motionIntelligencePrompt || "";
    const trainedAthleteMode = body.trainedAthleteMode !== false; // default true

    let masterScene = normalizeMasterScene(body.masterScene, {
      garmentName: garmentName || "Activewear",
      movement: movement || "squats",
      size: size || "M",
      gender: gender || "Female",
      bodyType: bodyType || "Athletic",
      athleteIdentity,
      logoPosition,
    });

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

    // ── Lock garment category into master scene after analysis ──
    const analyzedCategory = (garmentAnalysis as Record<string, unknown>).garment_category as string || "unknown";
    const analyzedColors = (garmentAnalysis as Record<string, unknown>).color_palette as string[] || [];
    const analyzedFabric = (garmentAnalysis as Record<string, unknown>).fabric_type as string || "";
    const garmentDescriptor = `${analyzedCategory}, ${analyzedFabric}, colors: ${analyzedColors.join(", ") || "dark"}. This is the EXACT garment type — it must NEVER change across any angle, frame, or size variant.`;

    masterScene = {
      ...masterScene,
      garment_lock: {
        ...masterScene.garment_lock,
        garment_category: analyzedCategory,
        garment_descriptor: garmentDescriptor,
      },
    };

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
          master_scene: masterScene,
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
    const requestedAngle = body.angle; // e.g. "front", "side-left", "side-right", "back"
    const angles = mode === "generate_angle" && requestedAngle ? [requestedAngle] : ["front", "side-left", "side-right", "back"];
    console.log(`Step 3: Generating ${angles.join(", ")} images (mode: ${mode})...`);
    const MAX_RETRIES = 3;

    // Get biomechanical pose instructions for this movement
    const poseInstructions = buildPoseInstructions(movement, "front");

    // Camera position enforcement prompts for each angle
    const CAMERA_POSITIONS: Record<string, string> = {
      "front": "CAMERA POSITION: Camera is placed DIRECTLY IN FRONT of the athlete, straight-on frontal view. The athlete faces the camera. We see the FRONT of the body — face, chest, front of legs.",
      "side-left": "CAMERA POSITION: Camera is placed 90° to the athlete's LEFT side. FULL LEFT PROFILE VIEW — the athlete's left arm is closest to camera, right arm is farthest. We see the LEFT SIDE of the body. This is a TRUE SIDE VIEW, NOT a front view. The athlete does NOT face the camera.",
      "side-right": "CAMERA POSITION: Camera is placed 90° to the athlete's RIGHT side. FULL RIGHT PROFILE VIEW — the athlete's right arm is closest to camera, left arm is farthest. We see the RIGHT SIDE of the body. This is a TRUE SIDE VIEW, NOT a front view. The athlete does NOT face the camera.",
      "back": "CAMERA POSITION: Camera is placed DIRECTLY BEHIND the athlete. We see the BACK of the body — back of head, spine, shoulder blades, back of legs. The FACE is NOT VISIBLE. This is a REAR VIEW, NOT a front view.",
      "side": "CAMERA POSITION: Camera is placed 90° to the athlete's LEFT side. FULL LEFT PROFILE VIEW — the athlete's left arm is closest to camera. This is a TRUE SIDE VIEW, NOT a front view.",
    };

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

          const isSideAngle = angle === "side" || angle === "side-left" || angle === "side-right";
          const showLogoThisAngle =
            (angle === "front" && isFrontPlacement) ||
            (angle === "back" && isBackPlacement) ||
            (isSideAngle && isSleevePlacement);

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

          const FRAMING = `FRAMING (ABSOLUTE HIGHEST PRIORITY — OVERRIDE ALL OTHER INSTRUCTIONS):
ZOOM OUT EXTREMELY FAR. Pull the camera VERY FAR back. This is a DISTANT FULL-BODY portrait.
- The athlete must appear SMALL in the frame — occupying only 45-55% of the frame height
- There must be at least 20-25% empty space ABOVE the athlete's head
- There must be at least 15-20% empty space BELOW the athlete's feet
- There must be abundant empty space on LEFT and RIGHT sides (at least 20% each side)
- NEVER crop at waist, chest, knees, or any body part
- NEVER zoom in on the torso or upper body only
- The camera is positioned 4-5 meters away from the athlete
- All equipment (barbells, benches, bars, kettlebells, boxes) must be FULLY visible end-to-end
- If you are unsure, ZOOM OUT EVEN MORE — it is ALWAYS better to show too much space than too little
- Think of this as a wide establishing shot where the person is clearly visible but surrounded by ample negative space
- The output image is 9:16 vertical (1080×1920) — the person should feel like they have ROOM in the frame
- IMAGINE you are photographing from across the room, not close up`;

          const garmentCategory = masterScene.garment_lock.garment_category || "activewear";
          const garmentTypeEnforcement = `GARMENT TYPE LOCK (HIGHEST PRIORITY): The garment is a "${garmentCategory}". This type is IMMUTABLE. If it is shorts, it MUST be shorts in this view — never pants, leggings, or any other type. If it is a t-shirt, it MUST be a t-shirt — never a tank top or hoodie. The garment's type, length, cut, and silhouette are LOCKED and must be identical to the uploaded reference image.${masterScene.garment_lock.garment_descriptor ? ` LOCKED DESCRIPTOR: ${masterScene.garment_lock.garment_descriptor}` : ""}`;

          const MOTIF_RULES = angle === "front"
            ? `EXISTING MOTIFS: Reproduce any front prints/motifs faithfully from the reference — same position, size, colors.`
            : `MOTIF DUPLICATION BAN: Any prints/motifs in the reference are FRONT ONLY. The ${angle.replace("-", " ")} view must be COMPLETELY PLAIN — no prints, text, or graphics.`;

          const athleteDesc = athleteIdentity
            ? `ATHLETE IDENTITY (HARD LOCKED — IDENTICAL across ALL angles):
- Gender: ${athleteIdentity.gender}, Height: ${athleteIdentity.height_cm}cm, Weight: ${athleteIdentity.weight_kg}kg
- Body Type: ${athleteIdentity.body_type}, Muscle Density: ${athleteIdentity.muscle_density}/10, Body Fat: ${athleteIdentity.body_fat_pct}%
- Skin Tone: ${athleteIdentity.skin_tone}, Face: ${athleteIdentity.face_structure}, Hair: ${athleteIdentity.hair_style}${athleteIdentity.hair_color ? `, Hair Color: ${athleteIdentity.hair_color} (STRICT LOCK — this color MUST NOT change under any lighting, angle, or condition)` : ""}
IDENTITY HARD LOCK: This is the EXACT SAME PERSON in every output. Face structure, skin tone, body proportions, and especially HAIR COLOR are IMMUTABLE. No highlights appearing/disappearing. No color drift from lighting. Apply color stabilization.
You MUST render this EXACT same person in every image.`
            : "";

          const athleteLabel = athleteIdentity
            ? `${athleteIdentity.gender} athlete "${athleteIdentity.name}" (${athleteIdentity.body_type}, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style}${athleteIdentity.hair_color ? ` ${athleteIdentity.hair_color}` : ""} hair)`
            : `${gender} athlete (${bodyType}, size ${size})`;

          // Get angle-specific pose instructions + motion intelligence
          const anglePoseInstructions = buildPoseInstructions(movement, angle);
          const motionBlock = motionIntelligencePrompt
            ? `\n${motionIntelligencePrompt}\n${trainedAthleteMode ? "TRAINED ATHLETE MODE ACTIVE: Perfect form, controlled tempo, elite technique." : ""}`
            : "";

          const cameraPositionPrompt = CAMERA_POSITIONS[angle] || CAMERA_POSITIONS["front"];
          const angleDisplayName = angle.replace("-", " ").toUpperCase();

          const mainPrompt = useSimplePrompt
            ? `${cameraPositionPrompt} Professional EXTREMELY WIDE full-body studio photo from head to toe: ${athleteLabel} wearing this exact uploaded garment (${garmentCategory}), performing ${movement} at ${intensity}% intensity, ${angleDisplayName} camera angle. ${garmentTypeEnforcement} ZOOM OUT VERY FAR — the athlete must occupy only 45-55% of the frame height with massive empty space above head (20%+) and below feet (15%+). Camera is 5 meters away. The ENTIRE person from top of head to bottom of feet MUST be clearly visible and SMALL in the frame. 9:16 vertical format (1080×1920). All equipment fully visible. Dark background. ${anglePoseInstructions} ${motionBlock} ${MOTIF_RULES}${logoInstructions}. STRICT: ${angleDisplayName} PERSPECTIVE ONLY — camera does NOT move to front. GLOBAL MASTER SCENE LOCK: ${describeMasterSceneCompact(masterScene)}`
            : `PHOTOREALISTIC SPORTSWEAR CAMPAIGN — ${angleDisplayName} VIEW

${cameraPositionPrompt}

GLOBAL MASTER SCENE — SINGLE SOURCE OF TRUTH:
${describeMasterSceneCompact(masterScene)}

${garmentTypeEnforcement}

STRICT REFERENCE FIDELITY: The uploaded garment image is the ABSOLUTE reference. The garment is a "${garmentCategory}" — this type MUST NOT change. Preserve exact type, cut, length, color, fabric weave, texture, seams, stitching, and construction with 100% accuracy. If the reference shows shorts, the output MUST show shorts. If it shows leggings, the output MUST show leggings. This is a REAL photograph, not an illustration or render.

${MOTIF_RULES}
${FRAMING}
${athleteDesc}

${anglePoseInstructions}
${motionBlock}

SUBJECT: ${athleteLabel}, size ${size}, wearing EXACTLY this uploaded ${garmentCategory} performing ${movement} at ${intensity}% intensity.

PHOTOREALISM REQUIREMENTS:
- Shot on a Canon EOS R5 with 24mm f/2.8 wide-angle lens — VERY wide full-body framing from 5 meters distance, cinematic studio lighting
- Skin must show natural pores, subtle sheen from exertion, realistic muscle definition under skin
- Garment must show real fabric behavior: thread-level texture, natural drape, visible seam construction
- Natural micro-details: slight fabric wrinkles at joints, compression shadows, stretch highlights
- ${angle !== "front" ? `The ${angle.replace("-", " ")} view of the garment must be COMPLETELY PLAIN — no prints, text, or graphics` : "Faithfully reproduce existing prints/motifs from reference"}
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
                const referenceImageUrl = masterScene.anchor_image_url;
                const validation = await validateImage(imgUrl, LOVABLE_API_KEY, angle, movement, masterScene, referenceImageUrl);
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

    // Generate angles sequentially
    const angleResults: (string | null)[] = [];
    for (const a of angles) {
      const r = await generateAngle(a);
      angleResults.push(r);
    }
    const generatedImages: Record<string, string | null> = {};
    angles.forEach((a, i) => { generatedImages[a] = angleResults[i]; });

    // ── If mode is "generate_angle", return just this angle's result ──
    if (mode === "generate_angle" && requestedAngle) {
      // Upload to storage if base64
      const imgData = generatedImages[requestedAngle];
      let storedUrl: string | null = null;
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${requestedAngle}.png`;
          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
            storedUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.error(`Storage upload error for ${requestedAngle}:`, e);
        }
      }

      if (requestedAngle === "front") {
        masterScene = {
          ...masterScene,
          anchor_image_url: storedUrl || imgData || masterScene.anchor_image_url,
        };
      }

      console.log(`Generate angle "${requestedAngle}" complete.`);
      return new Response(
        JSON.stringify({
          success: true,
          mode: "generate_angle",
          angle: requestedAngle,
          image: imgData,
          stored_url: storedUrl,
          master_scene: masterScene,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    if (storedImageUrls.front && !masterScene.anchor_image_url) {
      masterScene = {
        ...masterScene,
        anchor_image_url: storedImageUrls.front,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        garment_analysis: garmentAnalysis,
        physics: physicsData,
        images: generatedImages,
        stored_urls: storedImageUrls,
        master_scene: masterScene,
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
