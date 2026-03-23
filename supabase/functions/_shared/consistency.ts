export interface MasterScenePayload {
  scene_id: string;
  scene_seed: number;
  created_at: string;
  anchor_angle: "front";
  same_moment_id: string;
  athlete_lock: {
    name?: string;
    gender: string;
    body_type: string;
    height_cm?: number;
    weight_kg?: number;
    muscle_density?: number;
    body_fat_pct?: number;
    skin_tone?: string;
    face_structure?: string;
    hair_style?: string;
    hair_color?: string;
    identity_seed?: string | null;
  };
  garment_lock: {
    garment_name: string;
    garment_category: string;
    garment_descriptor: string;
    requested_size: string;
    logo_placement: string;
    notes: string[];
  };
  environment_lock: {
    location: string;
    background: string;
    floor: string;
    lighting: string;
    shadows: string;
    framing: string;
  };
  object_lock: {
    required_objects: string[];
    forbidden_objects: string[];
    lock_rules: string[];
  };
  motion_lock: {
    strategy: "skeletal_transform_only";
    motion_phase: string;
    motion_timestamp: string;
    allowed_changes: string[];
    forbidden_changes: string[];
  };
  multi_angle_lock: {
    same_moment: true;
    strategy: "camera_rotation_around_same_scene";
    required_angles: string[];
  };
  video_lock: {
    same_seed: number;
    continuous_sequence: true;
    temporal_consistency: true;
    transform_only: true;
  };
  validation_lock: {
    invalidates_on: string[];
    auto_regenerate: true;
    max_attempts: number;
  };
  anchor_image_url?: string;
}

interface FallbackOptions {
  garmentName: string;
  movement: string;
  size: string;
  gender: string;
  bodyType: string;
  athleteIdentity?: Record<string, unknown>;
  logoPosition?: { placement?: string } | null;
  environment?: {
    location: string;
    background: string;
    floor: string;
    lighting: string;
    shadows: string;
    framing: string;
  } | null;
}

const BODYWEIGHT_ONLY_MOVEMENTS = new Set([
  "squats",
  "push-ups",
  "lunges",
  "sprint",
  "burpees",
  "high knees",
  "squat jumps",
  "running",
  "jumping",
]);

const OBJECT_RULES: Record<string, { required: string[]; forbidden: string[] }> = {
  "deadlifts": {
    required: ["athletic training shoes", "olympic barbell"],
    forbidden: ["kettlebell", "jump rope", "battle ropes", "plyometric box", "bench"],
  },
  "bench press": {
    required: ["athletic training shoes", "flat weight bench", "olympic barbell"],
    forbidden: ["kettlebell", "jump rope", "battle ropes", "plyometric box", "pull-up bar"],
  },
  "pull-ups": {
    required: ["athletic training shoes", "pull-up bar"],
    forbidden: ["barbell", "bench", "kettlebell", "jump rope", "plyometric box"],
  },
  "jump rope": {
    required: ["athletic training shoes", "jump rope"],
    forbidden: ["barbell", "bench", "kettlebell", "battle ropes", "plyometric box"],
  },
  "box jumps": {
    required: ["athletic training shoes", "plyometric box"],
    forbidden: ["barbell", "bench", "kettlebell", "jump rope", "battle ropes"],
  },
  "battle ropes": {
    required: ["athletic training shoes", "battle ropes", "rope anchor"],
    forbidden: ["barbell", "bench", "kettlebell", "jump rope", "plyometric box"],
  },
  "kettlebell swings": {
    required: ["athletic training shoes", "kettlebell"],
    forbidden: ["barbell", "bench", "jump rope", "battle ropes", "plyometric box"],
  },
};

function normalizeMovementKey(movement: string) {
  return movement.toLowerCase().replace(/-/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function createServerSceneSeed() {
  return Math.floor(Math.random() * 4_294_967_295);
}

function createServerSceneId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `scene_${Date.now()}_${random}`;
}

function getObjectRules(movement: string) {
  const key = normalizeMovementKey(movement);
  if (OBJECT_RULES[key]) return OBJECT_RULES[key];
  if (BODYWEIGHT_ONLY_MOVEMENTS.has(key)) {
    return {
      required: ["athletic training shoes"],
      forbidden: ["barbell", "bench", "kettlebell", "jump rope", "battle ropes", "plyometric box", "pull-up bar"],
    };
  }

  return {
    required: ["athletic training shoes"],
    forbidden: [],
  };
}

export function buildServerMasterSceneFallback({
  garmentName,
  movement,
  size,
  gender,
  bodyType,
  athleteIdentity,
  logoPosition,
  environment,
}: FallbackOptions): MasterScenePayload {
  const objectRules = getObjectRules(movement);
  const sceneSeed = createServerSceneSeed();
  const envLock = environment || {
    location: "ActiveForge campaign studio",
    background: "Dark charcoal seamless sports studio background",
    floor: "Matte dark performance floor",
    lighting: "Locked 3-point athletic campaign lighting",
    shadows: "Soft grounded contact shadows with fixed direction and density",
    framing: "Wide full-body vertical composition with generous negative space",
  };
  return {
    scene_id: createServerSceneId(),
    scene_seed: sceneSeed,
    created_at: new Date().toISOString(),
    anchor_angle: "front",
    same_moment_id: `moment_${sceneSeed}`,
    athlete_lock: {
      name: typeof athleteIdentity?.name === "string" ? athleteIdentity.name : undefined,
      gender: typeof athleteIdentity?.gender === "string" ? athleteIdentity.gender : gender,
      body_type: typeof athleteIdentity?.body_type === "string" ? athleteIdentity.body_type : bodyType,
      height_cm: typeof athleteIdentity?.height_cm === "number" ? athleteIdentity.height_cm : undefined,
      weight_kg: typeof athleteIdentity?.weight_kg === "number" ? athleteIdentity.weight_kg : undefined,
      muscle_density: typeof athleteIdentity?.muscle_density === "number" ? athleteIdentity.muscle_density : undefined,
      body_fat_pct: typeof athleteIdentity?.body_fat_pct === "number" ? athleteIdentity.body_fat_pct : undefined,
      skin_tone: typeof athleteIdentity?.skin_tone === "string" ? athleteIdentity.skin_tone : undefined,
      face_structure: typeof athleteIdentity?.face_structure === "string" ? athleteIdentity.face_structure : undefined,
      hair_style: typeof athleteIdentity?.hair_style === "string" ? athleteIdentity.hair_style : undefined,
      hair_color: typeof athleteIdentity?.hair_color === "string" ? athleteIdentity.hair_color : undefined,
      identity_seed: typeof athleteIdentity?.identity_seed === "string" ? athleteIdentity.identity_seed : null,
    },
    garment_lock: {
      garment_name: garmentName,
      garment_category: "unknown",
      garment_descriptor: "",
      requested_size: size,
      logo_placement: logoPosition?.placement || "none",
      notes: [
        "The uploaded garment is a FIXED PHYSICAL OBJECT. Its type (shorts, leggings, t-shirt, etc.) must NEVER change.",
        "Exact color, seams, logo placement, silhouette, cut, length, and fabric texture are locked.",
        "Only body-driven deformation (stretch, compression, folds from movement) is allowed.",
        "If the garment is shorts, it MUST remain shorts. If leggings, it MUST remain leggings. No garment type changes allowed.",
      ],
    },
    environment_lock: envLock,
    object_lock: {
      required_objects: unique(objectRules.required),
      forbidden_objects: unique(objectRules.forbidden),
      lock_rules: [
        "All objects must keep identical color, scale, material, shape, and relative position across outputs.",
        "No new props, people, or background elements may appear.",
      ],
    },
    motion_lock: {
      strategy: "skeletal_transform_only",
      motion_phase: "mid-to-peak",
      motion_timestamp: `t_${sceneSeed % 1000}`,
      allowed_changes: [
        "skeletal pose",
        "natural garment stretch",
        "natural garment compression",
        "natural garment folds caused by motion",
      ],
      forbidden_changes: [
        "scene regeneration",
        "background drift",
        "lighting changes",
        "identity drift",
        "hair color shift",
        "object swaps",
        "garment redesign",
      ],
    },
    multi_angle_lock: {
      same_moment: true,
      strategy: "camera_rotation_around_same_scene",
      required_angles: ["front", "side-left", "side-right", "back"],
    },
    video_lock: {
      same_seed: sceneSeed,
      continuous_sequence: true,
      temporal_consistency: true,
      transform_only: true,
    },
    validation_lock: {
      invalidates_on: [
        "background change",
        "lighting mismatch",
        "object appearance drift",
        "garment type change (e.g. shorts becoming pants)",
        "garment structure drift",
        "athlete identity drift",
      ],
      auto_regenerate: true,
      max_attempts: 3,
    },
  };
}

export function normalizeMasterScene(raw: unknown, fallbackOptions: FallbackOptions): MasterScenePayload {
  const fallback = buildServerMasterSceneFallback(fallbackOptions);

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const candidate = raw as Partial<MasterScenePayload>;

  return {
    ...fallback,
    ...candidate,
    athlete_lock: {
      ...fallback.athlete_lock,
      ...(candidate.athlete_lock || {}),
    },
    garment_lock: {
      ...fallback.garment_lock,
      ...(candidate.garment_lock || {}),
      notes: unique([...(fallback.garment_lock.notes || []), ...((candidate.garment_lock?.notes as string[] | undefined) || [])]),
    },
    environment_lock: {
      ...fallback.environment_lock,
      ...(candidate.environment_lock || {}),
    },
    object_lock: {
      ...fallback.object_lock,
      ...(candidate.object_lock || {}),
      required_objects: unique([...(fallback.object_lock.required_objects || []), ...((candidate.object_lock?.required_objects as string[] | undefined) || [])]),
      forbidden_objects: unique([...(fallback.object_lock.forbidden_objects || []), ...((candidate.object_lock?.forbidden_objects as string[] | undefined) || [])]),
      lock_rules: unique([...(fallback.object_lock.lock_rules || []), ...((candidate.object_lock?.lock_rules as string[] | undefined) || [])]),
    },
    motion_lock: {
      ...fallback.motion_lock,
      ...(candidate.motion_lock || {}),
      allowed_changes: unique([...(fallback.motion_lock.allowed_changes || []), ...((candidate.motion_lock?.allowed_changes as string[] | undefined) || [])]),
      forbidden_changes: unique([...(fallback.motion_lock.forbidden_changes || []), ...((candidate.motion_lock?.forbidden_changes as string[] | undefined) || [])]),
    },
    multi_angle_lock: {
      ...fallback.multi_angle_lock,
      ...(candidate.multi_angle_lock || {}),
      required_angles: unique([...(fallback.multi_angle_lock.required_angles || []), ...((candidate.multi_angle_lock?.required_angles as string[] | undefined) || [])]),
      same_moment: true,
      strategy: "camera_rotation_around_same_scene",
    },
    video_lock: {
      ...fallback.video_lock,
      ...(candidate.video_lock || {}),
      same_seed: typeof candidate.video_lock?.same_seed === "number" ? candidate.video_lock.same_seed : fallback.video_lock.same_seed,
      continuous_sequence: true,
      temporal_consistency: true,
      transform_only: true,
    },
    validation_lock: {
      ...fallback.validation_lock,
      ...(candidate.validation_lock || {}),
      invalidates_on: unique([...(fallback.validation_lock.invalidates_on || []), ...((candidate.validation_lock?.invalidates_on as string[] | undefined) || [])]),
      auto_regenerate: true,
      max_attempts: typeof candidate.validation_lock?.max_attempts === "number" ? candidate.validation_lock.max_attempts : fallback.validation_lock.max_attempts,
    },
  };
}

export function describeMasterScene(scene: MasterScenePayload) {
  return `GLOBAL MASTER SCENE — SINGLE SOURCE OF TRUTH
SCENE ID: ${scene.scene_id}
SCENE SEED: ${scene.scene_seed}
SAME MOMENT LOCK: ${scene.same_moment_id}
ATHLETE IDENTITY LOCK: ${scene.athlete_lock.gender}, ${scene.athlete_lock.body_type}${scene.athlete_lock.skin_tone ? `, ${scene.athlete_lock.skin_tone} skin` : ""}${scene.athlete_lock.face_structure ? `, ${scene.athlete_lock.face_structure} face` : ""}${scene.athlete_lock.hair_style ? `, ${scene.athlete_lock.hair_style} hair` : ""}${scene.athlete_lock.identity_seed ? `, seed ${scene.athlete_lock.identity_seed}` : ""}
GARMENT LOCK (CRITICAL — GARMENT TYPE MUST NEVER CHANGE): ${scene.garment_lock.garment_category} "${scene.garment_lock.garment_name}", size ${scene.garment_lock.requested_size}, logo at ${scene.garment_lock.logo_placement}. ${scene.garment_lock.garment_descriptor ? `LOCKED DESCRIPTOR: ${scene.garment_lock.garment_descriptor}. ` : ""}${scene.garment_lock.notes.join(" ")}
ENVIRONMENT LOCK: ${scene.environment_lock.location}. Background: ${scene.environment_lock.background}. Floor: ${scene.environment_lock.floor}. Lighting: ${scene.environment_lock.lighting}. Shadows: ${scene.environment_lock.shadows}. Framing: ${scene.environment_lock.framing}.
OBJECT LOCK: Required objects -> ${scene.object_lock.required_objects.join(", ") || "none"}. Forbidden objects -> ${scene.object_lock.forbidden_objects.join(", ") || "none"}. ${scene.object_lock.lock_rules.join(" ")}
MOTION SYSTEM: ${scene.motion_lock.strategy}. Allowed changes -> ${scene.motion_lock.allowed_changes.join(", ")}. Forbidden -> ${scene.motion_lock.forbidden_changes.join(", ")}.
MULTI-ANGLE: ${scene.multi_angle_lock.strategy}. SAME exact moment in time across ${scene.multi_angle_lock.required_angles.join(", ")}.
VIDEO LOCK: same seed ${scene.video_lock.same_seed}, continuous sequence, temporal consistency enabled, transform only.
VALIDATION: If any of these drift, the output is INVALID and must be regenerated: ${scene.validation_lock.invalidates_on.join(", ")}.`;
}

export function describeMasterSceneCompact(scene: MasterScenePayload) {
  const garmentDesc = scene.garment_lock.garment_descriptor
    ? `GARMENT TYPE LOCK: ${scene.garment_lock.garment_category} — ${scene.garment_lock.garment_descriptor}. This garment type is IMMUTABLE — shorts stay shorts, leggings stay leggings, t-shirts stay t-shirts. NEVER change the garment type, length, or cut.`
    : `GARMENT TYPE LOCK: ${scene.garment_lock.garment_category}. This garment type is IMMUTABLE — NEVER change it.`;
  return `Scene seed ${scene.scene_seed}. ${garmentDesc} Same locked studio environment: ${scene.environment_lock.background}, ${scene.environment_lock.floor}, ${scene.environment_lock.lighting}. Same athlete identity, same garment structure and logo placement, same object set (${scene.object_lock.required_objects.join(", ") || "none"}). Multi-angle outputs are camera rotations around the same moment, and video is one continuous temporally consistent sequence.`;
}

export function buildConsistencyValidationPrompt(scene: MasterScenePayload, options: { angle: string; movement: string; hasReferenceImage: boolean }) {
  return `Validate this generated ActiveForge output against the locked master scene. ${options.hasReferenceImage ? "The FIRST image is the anchor reference from the same scene. The SECOND image is the candidate to validate." : "The only image is the candidate to validate."}

Check ALL of these failure cases:
1. BACKGROUND / ENVIRONMENT DRIFT: background, floor, lighting, shadow direction, or overall studio setup changes.
2. OBJECT DRIFT: equipment, shoes, ropes, bars, boxes, benches, props, or their color/size/material/position change. Objects must not appear or disappear randomly.
3. GARMENT TYPE DRIFT (CRITICAL): The garment MUST be a "${scene.garment_lock.garment_category}". ${scene.garment_lock.garment_descriptor ? `It must match: ${scene.garment_lock.garment_descriptor}.` : ""} If shorts become pants, or a t-shirt becomes a tank top, or the garment type/length/cut changes in ANY way — this is an IMMEDIATE FAIL.
4. IDENTITY DRIFT: face, hair, skin tone, body proportions, or athlete identity change.
5. ANGLE / MOMENT FAILURE: for ${options.angle}, the view does not look like a camera rotation around the same locked scene and same moment for movement "${options.movement}".
6. CROPPING / ANATOMY FAILURE: the full body or required object is cropped, or there are obvious anatomy errors.
7. BIOMECHANICAL FAILURE (CRITICAL): Check for physically impossible poses — hyperextended joints beyond anatomical limits, spine bending unnaturally, limb proportions distorting, impossible balance/weight distribution, or poses that defy gravity. The movement "${options.movement}" must look biomechanically correct for a trained athlete.
8. BODY DISTORTION: Arms or legs that look unnaturally stretched, shrunk, or rubber-like. Hands with wrong number of fingers. Head-to-body ratio that looks inhuman. Any body part that appears melted, warped, or AI-artifact-like.
9. OBJECT PHYSICS FAILURE: Equipment (barbells, kettlebells, ropes, boxes) must move correctly with the athlete, show realistic weight, and follow physics. A barbell must look heavy, a rope must show gravity sag, a box must be stable.
10. GARMENT BEHAVIOR FAILURE: Clothing must react naturally to the movement — stretching at tension points, compressing at fold points. Garment must NOT flicker, change shape randomly, or behave as if weightless.

MASTER SCENE:
${describeMasterScene(scene)}

Return strict JSON only:
{"valid": true/false, "issues": ["issue1", "issue2"]}

Mark invalid if ANY of these failure categories appear. GARMENT TYPE changes and BIOMECHANICAL FAILURES are the HIGHEST priority failures.`;
}
