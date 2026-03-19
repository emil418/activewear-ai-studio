export interface Environment {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // emoji placeholder for now
  background: string;
  floor: string;
  lighting: string;
  shadows: string;
  atmosphere: string;
  framing: string;
}

export const PREDEFINED_ENVIRONMENTS: Environment[] = [
  {
    id: "dark-performance-gym",
    name: "Dark Performance Gym",
    description: "Black background with dramatic spotlighting. Premium athletic look.",
    thumbnail: "🏋️",
    background: "Deep black seamless gym background with subtle dark charcoal gradient",
    floor: "Matte black rubber gym floor with subtle texture",
    lighting: "Dramatic 3-point athletic lighting — strong key light from 45° above-right, soft fill from left, rim light from behind for edge separation",
    shadows: "Deep grounded contact shadows with sharp directional contrast, fixed direction and density",
    atmosphere: "Dark, intense, premium performance atmosphere",
    framing: "Wide full-body vertical composition with generous negative space",
  },
  {
    id: "bright-studio",
    name: "Bright Studio",
    description: "Clean white/grey studio with even lighting. E-commerce ready.",
    thumbnail: "📸",
    background: "Clean white-to-light-grey seamless studio cyclorama",
    floor: "Smooth light grey studio floor with soft gradient into background",
    lighting: "Even, diffused 4-point studio lighting — large softboxes from both sides, overhead fill, subtle backlight for depth",
    shadows: "Soft, diffused contact shadows with minimal contrast, natural and even",
    atmosphere: "Bright, clean, professional commercial studio",
    framing: "Wide full-body vertical composition with generous negative space",
  },
  {
    id: "outdoor-training",
    name: "Outdoor Training",
    description: "Neutral outdoor daylight on flat ground. Natural feel.",
    thumbnail: "🌤️",
    background: "Outdoor neutral blurred background — soft-focus trees and sky, shallow depth of field",
    floor: "Flat concrete or packed earth training ground, neutral tone",
    lighting: "Natural outdoor daylight — golden hour warm tone, soft directional sunlight from above-left, natural ambient fill",
    shadows: "Natural outdoor ground shadows, soft edges, consistent sun direction",
    atmosphere: "Open-air, natural daylight, outdoor athletic training ground",
    framing: "Wide full-body vertical composition with generous negative space",
  },
  {
    id: "minimal-black-studio",
    name: "Minimal Black Studio",
    description: "Premium fashion-grade look. Pure black with refined lighting.",
    thumbnail: "🖤",
    background: "Pure matte black seamless studio backdrop — zero texture, zero gradient, absolute dark",
    floor: "Polished dark reflective floor with subtle mirror-like surface",
    lighting: "Refined 2-point fashion lighting — large beauty dish key light from front-above, subtle edge light from behind for silhouette definition",
    shadows: "Minimal, controlled shadows with soft falloff, slight floor reflection",
    atmosphere: "Ultra-premium, fashion editorial, minimal luxury",
    framing: "Wide full-body vertical composition with generous negative space",
  },
];

export function getEnvironmentById(id: string): Environment {
  return PREDEFINED_ENVIRONMENTS.find(e => e.id === id) || PREDEFINED_ENVIRONMENTS[0];
}

export function environmentToLock(env: Environment) {
  return {
    location: env.name,
    background: env.background,
    floor: env.floor,
    lighting: env.lighting,
    shadows: env.shadows,
    framing: env.framing,
  };
}
