import type { LogoPosition } from "@/components/LogoPlacer";

interface AthleteIdentityInput {
  name?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  body_type?: string;
  muscle_density?: number;
  body_fat_pct?: number;
  skin_tone?: string;
  face_structure?: string;
  hair_style?: string;
  identity_seed?: string | null;
}

export interface MasterScenePayload {
  scene_id: string;
  scene_seed: number;
  created_at: string;
  anchor_angle: "front";
  same_moment_id: string;
  athlete_lock: {
    name: string;
    gender: string;
    body_type: string;
    height_cm?: number;
    weight_kg?: number;
    muscle_density?: number;
    body_fat_pct?: number;
    skin_tone?: string;
    face_structure?: string;
    hair_style?: string;
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

interface BuildMasterSceneOptions {
  garmentName: string;
  size: string;
  movement: string;
  selectedGender: string;
  selectedBody: string;
  athleteIdentity?: AthleteIdentityInput;
  logoPosition?: LogoPosition | null;
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

function createSceneSeed() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

function createSceneId() {
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

export function buildMasterScene({
  garmentName,
  size,
  movement,
  selectedGender,
  selectedBody,
  athleteIdentity,
  logoPosition,
  environment,
}: BuildMasterSceneOptions): MasterScenePayload {
  const objectRules = getObjectRules(movement);
  const sceneSeed = createSceneSeed();

  return {
    scene_id: createSceneId(),
    scene_seed: sceneSeed,
    created_at: new Date().toISOString(),
    anchor_angle: "front",
    same_moment_id: `moment_${sceneSeed}`,
    athlete_lock: {
      name: athleteIdentity?.name || "Locked athlete",
      gender: athleteIdentity?.gender || selectedGender,
      body_type: athleteIdentity?.body_type || selectedBody,
      height_cm: athleteIdentity?.height_cm,
      weight_kg: athleteIdentity?.weight_kg,
      muscle_density: athleteIdentity?.muscle_density,
      body_fat_pct: athleteIdentity?.body_fat_pct,
      skin_tone: athleteIdentity?.skin_tone,
      face_structure: athleteIdentity?.face_structure,
      hair_style: athleteIdentity?.hair_style,
      identity_seed: athleteIdentity?.identity_seed || null,
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
        "If the garment is shorts, it MUST remain shorts in every angle and frame. It must NEVER become pants, leggings, or any other garment type.",
      ],
    },
    environment_lock: environment || {
      location: "ActiveForge campaign studio",
      background: "Dark charcoal seamless sports studio background",
      floor: "Matte dark performance floor",
      lighting: "Locked 3-point athletic campaign lighting",
      shadows: "Soft grounded contact shadows with fixed direction and density",
      framing: "Wide full-body vertical composition with generous negative space",
    },
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
