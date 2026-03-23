/**
 * Intelligence & Quality Engine
 * 
 * 3-stage generation pipeline: Plan → Generate → Validate+Correct
 * Multi-pass generation with automatic quality scoring and auto-correction.
 */

export interface ScenePlan {
  planId: string;
  createdAt: string;
  athleteSummary: string;
  movementSummary: string;
  environmentSummary: string;
  cameraAngles: string[];
  motionPhase: string;
  lightingSetup: string;
  composition: string;
  qualityTarget: number;
  maxPasses: number;
  enhancementPass: boolean;
}

export interface QualityReport {
  angleScores: Record<string, AngleQuality>;
  overallScore: number;
  passed: boolean;
  issues: string[];
  passNumber: number;
  autoCorrections: string[];
}

export interface AngleQuality {
  realism: number;
  motionAccuracy: number;
  consistency: number;
  garmentBehavior: number;
  overall: number;
  issues: string[];
}

export interface PipelineState {
  stage: "planning" | "generating" | "validating" | "enhancing" | "complete" | "failed";
  plan: ScenePlan | null;
  currentPass: number;
  maxPasses: number;
  qualityReport: QualityReport | null;
  stageMessage: string;
}

export interface MaxRealismConfig {
  enabled: boolean;
  qualityThreshold: number;
  maxPasses: number;
  enhancementPass: boolean;
  stricterValidation: boolean;
}

export const MAX_REALISM_ON: MaxRealismConfig = {
  enabled: true,
  qualityThreshold: 90,
  maxPasses: 3,
  enhancementPass: true,
  stricterValidation: true,
};

export const MAX_REALISM_OFF: MaxRealismConfig = {
  enabled: false,
  qualityThreshold: 80,
  maxPasses: 2,
  enhancementPass: false,
  stricterValidation: false,
};

// Build the planning prompt for Stage 1
export function buildPlanningPrompt(opts: {
  athlete: string;
  movement: string;
  environment: string;
  intensity: number;
  garmentCategory: string;
  angles: string[];
  maxRealism: boolean;
}): string {
  return `SCENE PLANNING — STAGE 1 OF 3-STAGE PIPELINE

You are the planning engine for a professional sportswear visualization system.
Create a detailed scene plan before any image generation begins.

INPUTS:
- Athlete: ${opts.athlete}
- Movement: ${opts.movement} at ${opts.intensity}% intensity
- Environment: ${opts.environment}
- Garment: ${opts.garmentCategory}
- Camera Angles: ${opts.angles.join(", ")}
- Quality Mode: ${opts.maxRealism ? "MAX REALISM (strictest quality)" : "Standard"}

OUTPUT (JSON):
{
  "motion_phase": "exact phase description (e.g. 'mid-squat descent, thighs approaching parallel')",
  "lighting_setup": "precise 3-point lighting description with direction and intensity",
  "composition": "camera distance, framing, negative space ratios",
  "athlete_pose_details": "exact joint angles and body position for the chosen phase",
  "garment_behavior": "expected fabric stretch, compression, fold points for this phase",
  "environment_details": "floor material, background depth, atmosphere",
  "quality_notes": "areas requiring extra attention for realism"
}

Return ONLY valid JSON.`;
}

// Build the validation prompt for Stage 3
export function buildValidationPrompt(opts: {
  angle: string;
  movement: string;
  plan: ScenePlan;
  maxRealism: boolean;
}): string {
  const threshold = opts.maxRealism ? 90 : 80;
  return `QUALITY VALIDATION — STAGE 3 OF 3-STAGE PIPELINE

Evaluate this generated image against the scene plan.
Quality threshold: ${threshold}/100. Score BELOW this = FAIL (must regenerate).

SCENE PLAN:
- Motion Phase: ${opts.plan.motionPhase}
- Lighting: ${opts.plan.lightingSetup}
- Composition: ${opts.plan.composition}
- Angle: ${opts.angle}
- Movement: ${opts.movement}

SCORE EACH DIMENSION (0-100):
1. realism — does this look like a real photograph? Check skin texture, lighting physics, muscle definition
2. motion_accuracy — is the biomechanical form correct for ${opts.movement}? Joint angles, weight distribution
3. consistency — does it match the master scene plan? Environment, lighting direction, athlete identity
4. garment_behavior — is fabric stretching/compressing naturally? No distortion, no type change

OUTPUT (JSON):
{
  "realism": <number>,
  "motion_accuracy": <number>,
  "consistency": <number>,
  "garment_behavior": <number>,
  "overall": <number>,
  "passed": <boolean>,
  "issues": ["list of specific problems found"],
  "auto_corrections": ["suggested fixes if score < ${threshold}"]
}

Be STRICT. Real photography standards. Return ONLY valid JSON.`;
}

// Build enhancement prompt for the final detail pass
export function buildEnhancementPrompt(movement: string, angle: string): string {
  return `DETAIL ENHANCEMENT PASS — FINAL STAGE

Apply professional-grade finishing to this sportswear campaign image:

1. GARMENT TEXTURES: Sharpen fabric weave, thread-level detail, seam visibility
2. LIGHTING REALISM: Ensure 3-point lighting creates proper highlights and shadows on fabric and skin
3. SKIN QUALITY: Natural pores, subtle sweat sheen proportional to movement intensity, realistic muscle definition
4. DEPTH & CONTRAST: Professional depth-of-field, proper foreground/background separation
5. MICRO-DETAILS: Chalk marks, shoe wear, floor shadows, ambient occlusion
6. COLOR ACCURACY: Ensure garment colors match reference exactly — no color drift

Movement: ${movement}, Angle: ${angle}

Enhance the image to be indistinguishable from a real Canon EOS R5 photograph. Keep the subject, pose, garment, and composition EXACTLY the same. Only improve visual quality and detail.`;
}

// Create initial pipeline state
export function createPipelineState(maxRealism: MaxRealismConfig): PipelineState {
  return {
    stage: "planning",
    plan: null,
    currentPass: 0,
    maxPasses: maxRealism.maxPasses,
    qualityReport: null,
    stageMessage: "Planning scene...",
  };
}

// Pipeline stage messages for UI
export const PIPELINE_MESSAGES: Record<string, string[]> = {
  planning: [
    "Analyzing scene requirements...",
    "Computing optimal motion phase...",
    "Planning lighting & composition...",
    "Building scene plan...",
  ],
  generating: [
    "Generating from scene plan...",
    "Rendering with Master Scene lock...",
    "Applying biomechanical constraints...",
    "Processing fabric physics...",
  ],
  validating: [
    "Validating realism quality...",
    "Checking biomechanical accuracy...",
    "Verifying identity consistency...",
    "Scoring garment behavior...",
  ],
  enhancing: [
    "Enhancing garment textures...",
    "Improving lighting realism...",
    "Sharpening micro-details...",
    "Final quality polish...",
  ],
};

// Compute overall quality from angle scores
export function computeOverallQuality(angleScores: Record<string, AngleQuality>): number {
  const scores = Object.values(angleScores);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s.overall, 0) / scores.length);
}
