/**
 * Motion Intelligence Engine
 * 
 * Centralized biomechanical intelligence for all exercise movements.
 * Controls joint behavior, kinematic flow, force simulation, and quality scoring.
 */

// ── Movement Phase Definitions ──

export interface MotionPhase {
  label: string;
  position: string;
  joints: Record<string, string>;
  muscleEngagement: string[];
  tempo: string;
}

export interface MovementDefinition {
  id: string;
  name: string;
  category: "strength" | "cardio" | "hiit";
  phases: MotionPhase[];
  jointLimits: JointLimit[];
  forceProfile: ForceProfile;
  objectInteraction: ObjectInteraction;
  garmentSync: string[];
  qualityChecks: string[];
}

export interface JointLimit {
  joint: string;
  minAngle: number;
  maxAngle: number;
  criticalRule: string;
}

export interface ForceProfile {
  gravity: string;
  acceleration: string;
  deceleration: string;
  weightFeel: string;
}

export interface ObjectInteraction {
  requiredContact: string[];
  forbiddenBehavior: string[];
}

// ── Quality Score System ──

export interface MovementQualityScore {
  overall: number;
  biomechanics: number;
  smoothness: number;
  realism: number;
  objectInteraction: number;
  garmentBehavior: number;
  label: string;
  status: "excellent" | "good" | "acceptable" | "regenerate" | "reject";
}

export function computeQualityLabel(score: number): { label: string; status: MovementQualityScore["status"] } {
  if (score >= 95) return { label: "Competition Grade", status: "excellent" };
  if (score >= 85) return { label: "Professional", status: "good" };
  if (score >= 75) return { label: "Acceptable", status: "acceptable" };
  if (score >= 70) return { label: "Needs Improvement", status: "regenerate" };
  return { label: "Rejected", status: "reject" };
}

export function buildQualityScore(subscores: {
  biomechanics: number;
  smoothness: number;
  realism: number;
  objectInteraction: number;
  garmentBehavior: number;
}): MovementQualityScore {
  // Weighted average — biomechanics is most important
  const overall = Math.round(
    subscores.biomechanics * 0.35 +
    subscores.smoothness * 0.20 +
    subscores.realism * 0.20 +
    subscores.objectInteraction * 0.10 +
    subscores.garmentBehavior * 0.15
  );
  const { label, status } = computeQualityLabel(overall);
  return { overall, ...subscores, label, status };
}

// ── Trained Athlete Mode ──

export interface TrainedAthleteConfig {
  enabled: boolean;
  formPrecision: "strict" | "natural";
  tempoControl: "controlled" | "variable";
  techniqueLevel: "elite" | "intermediate";
}

export const TRAINED_ATHLETE_DEFAULTS: TrainedAthleteConfig = {
  enabled: true,
  formPrecision: "strict",
  tempoControl: "controlled",
  techniqueLevel: "elite",
};

export const CASUAL_ATHLETE_DEFAULTS: TrainedAthleteConfig = {
  enabled: false,
  formPrecision: "natural",
  tempoControl: "variable",
  techniqueLevel: "intermediate",
};

export function buildTrainedAthletePrompt(config: TrainedAthleteConfig): string {
  if (config.enabled) {
    return `TRAINED ATHLETE MODE (ACTIVE):
- Perfect biomechanical form — zero compromise on technique
- Controlled tempo: 2s controlled eccentric, 1.5s explosive concentric
- Elite-level movement quality: deliberate, powerful, precise
- Visible muscle engagement and proper activation patterns
- Rep quality over speed — every phase executed with textbook precision
- Natural breathing rhythm: exhale on exertion, inhale on reset
- Subtle micro-details: chalk on hands, slight grip adjustment, pre-lift ritual cues`;
  }
  return `NATURAL ATHLETE MODE:
- Slightly relaxed form with minor natural variation
- Variable tempo: natural rhythm without strict counting
- Good technique but with human imperfection
- Movement looks authentic and unscripted
- Natural slight asymmetry between reps
- Less rigid — more like training footage than a technique video`;
}

// ── Kinematic Flow Constraints ──

export function buildKinematicFlowPrompt(movement: string, intensity: number): string {
  const speed = intensity > 70 ? "explosive" : intensity > 40 ? "moderate" : "controlled";
  const cadence = intensity > 70
    ? "1.5s descent, 1s explosive drive"
    : intensity > 40
    ? "2s descent, 1.5s controlled drive"
    : "3s slow descent, 2s measured drive";

  return `KINEMATIC FLOW (MANDATORY — "${movement}"):
- Movement must be CONTINUOUS — no frozen transitions, no pose snapping
- Speed profile: ${speed} (intensity ${intensity}%)
- Cadence: ${cadence}
- Acceleration: gradual ramp-up at movement initiation
- Deceleration: controlled braking before direction change
- NO instant velocity changes — all motion follows natural curves
- Momentum must carry through transitions (no dead stops mid-rep)
- Joint velocities must be physically plausible for the load and body mass`;
}

// ── Force & Weight Simulation ──

export function buildForceSimulationPrompt(movement: string, hasEquipment: boolean): string {
  const base = `FORCE & WEIGHT SIMULATION:
- Gravity affects ALL body parts and objects at all times
- Ground contact shows appropriate pressure and weight distribution
- Heavier movements appear slower and more deliberate
- Explosive movements show rapid acceleration from loaded positions`;

  if (hasEquipment) {
    return `${base}
- Equipment shows realistic WEIGHT: slight bar flex under load, visible grip tension
- Object inertia: heavy objects do not change direction instantly
- Contact forces: hands show white-knuckle grip on loaded equipment
- Load path: force travels through body in biomechanically correct chain
- Equipment must NOT float, teleport, or change mass mid-movement`;
  }
  return `${base}
- Bodyweight creates visible ground reaction force
- Jumping shows appropriate takeoff and landing mechanics
- Push-off shows foot pressure and ground deformation cues`;
}

// ── Joint Control System ──

export const JOINT_CONTROL_SYSTEM = `JOINT CONTROL SYSTEM (STRICT ANATOMICAL LIMITS):
- Ankle: 0°-50° dorsiflexion, 0°-50° plantarflexion — NO hyperextension
- Knee: 0°-150° flexion — locked straight at 0°, deep squat at 150°, NEVER bend backward
- Hip: 0°-130° flexion, 0°-45° extension, 0°-45° abduction — NO impossible splits
- Spine: natural lordotic/kyphotic curves only — NO S-bends, NO 90° lateral bends
- Shoulder: 0°-180° flexion, 0°-60° extension, 0°-180° abduction — NEVER rotate 360°
- Elbow: 0°-150° flexion — straight at 0°, fully bent at 150°, NEVER hyperextend beyond 0°
- Wrist: 0°-80° flexion, 0°-70° extension — NO impossible rotations
All joints must transition SMOOTHLY between angles — no teleporting between positions`;

// ── Movement-specific equipment rules ──

const EQUIPMENT_MOVEMENTS = new Set([
  "deadlifts", "bench press", "pull-ups", "kettlebell swings",
  "battle ropes", "box jumps", "jump rope",
  "rowing machine", "assault airbike", "clean and jerk"
]);

export function movementHasEquipment(movement: string): boolean {
  return EQUIPMENT_MOVEMENTS.has(movement.toLowerCase().replace(/-/g, " ").trim());
}

// ── Build complete motion intelligence prompt ──

export function buildMotionIntelligencePrompt(
  movement: string,
  intensity: number,
  trainedAthlete: TrainedAthleteConfig
): string {
  const hasEquip = movementHasEquipment(movement);
  return [
    JOINT_CONTROL_SYSTEM,
    buildKinematicFlowPrompt(movement, intensity),
    buildForceSimulationPrompt(movement, hasEquip),
    buildTrainedAthletePrompt(trainedAthlete),
  ].join("\n\n");
}
