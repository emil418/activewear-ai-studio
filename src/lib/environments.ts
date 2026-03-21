export interface Environment {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  background: string;
  floor: string;
  lighting: string;
  shadows: string;
  atmosphere: string;
  framing: string;
  pack: EnvironmentPack;
  sport: string[];
  allowedObjects: string[];
  forbiddenObjects: string[];
  useCases: string[];
  colorPalette: string;
}

export type EnvironmentPack = "strength" | "calisthenics" | "field-sports" | "lifestyle";

export const PACK_META: Record<EnvironmentPack, { label: string; emoji: string; description: string }> = {
  strength: { label: "Strength", emoji: "🏋️", description: "Gym & performance wear" },
  calisthenics: { label: "Calisthenics", emoji: "🤸", description: "Bodyweight & movement" },
  "field-sports": { label: "Field Sports", emoji: "⚽", description: "Football, athletics & outdoor" },
  lifestyle: { label: "Lifestyle / Brand", emoji: "✨", description: "Editorial & campaign" },
};

export const PREDEFINED_ENVIRONMENTS: Environment[] = [
  // ── Strength Pack ──
  {
    id: "dark-performance-gym",
    name: "Dark Performance Gym",
    description: "Black background with dramatic spotlighting. Premium athletic look.",
    thumbnail: "🏋️",
    pack: "strength",
    sport: ["gym", "strength", "powerlifting"],
    background: "Deep black seamless gym background with subtle dark charcoal gradient",
    floor: "Matte black rubber gym floor with subtle texture",
    lighting: "Dramatic 3-point athletic lighting — strong key light from 45° above-right, soft fill from left, rim light from behind for edge separation",
    shadows: "Deep grounded contact shadows with sharp directional contrast, fixed direction and density",
    atmosphere: "Dark, intense, premium performance atmosphere",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Black, charcoal, warm highlight accents",
    allowedObjects: ["barbell", "weight plates", "dumbbells", "kettlebell", "flat bench", "power rack"],
    forbiddenObjects: ["pull-up bar outdoors", "calisthenics park equipment", "grass", "turf", "sand"],
    useCases: ["product fit testing", "campaign visuals", "motion video", "e-commerce"],
  },
  {
    id: "minimal-black-studio",
    name: "Minimal Black Studio",
    description: "Premium fashion-grade look. Pure black with refined lighting.",
    thumbnail: "🖤",
    pack: "strength",
    sport: ["gym", "fashion", "editorial"],
    background: "Pure matte black seamless studio backdrop — zero texture, zero gradient, absolute dark",
    floor: "Polished dark reflective floor with subtle mirror-like surface",
    lighting: "Refined 2-point fashion lighting — large beauty dish key light from front-above, subtle edge light from behind for silhouette definition",
    shadows: "Minimal, controlled shadows with soft falloff, slight floor reflection",
    atmosphere: "Ultra-premium, fashion editorial, minimal luxury",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Pure black, silver highlights",
    allowedObjects: ["barbell", "weight plates", "dumbbells", "kettlebell"],
    forbiddenObjects: ["outdoor equipment", "grass", "turf", "sand", "calisthenics bars"],
    useCases: ["launch campaigns", "lookbooks", "product shots", "social media"],
  },
  {
    id: "industrial-training-space",
    name: "Industrial Training Space",
    description: "Raw concrete gym with exposed structure. Gritty and powerful.",
    thumbnail: "🏗️",
    pack: "strength",
    sport: ["gym", "crossfit", "strength"],
    background: "Raw concrete walls with exposed steel beams and industrial ceiling, muted grey tones",
    floor: "Worn concrete floor with rubber mat sections, dark grey",
    lighting: "Harsh overhead industrial lighting with warm tungsten tone, strong directional shadows",
    shadows: "Hard-edged industrial shadows from overhead fixtures, consistent direction",
    atmosphere: "Gritty, raw, underground training facility",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Concrete grey, warm tungsten, rust accents",
    allowedObjects: ["barbell", "weight plates", "kettlebell", "battle ropes", "tire", "chains"],
    forbiddenObjects: ["grass", "turf", "sand", "outdoor props", "studio backdrops"],
    useCases: ["campaign visuals", "motion video", "athlete content", "social media"],
  },

  // ── Calisthenics Pack ──
  {
    id: "outdoor-calisthenics-park",
    name: "Outdoor Calisthenics Park",
    description: "Open-air park with bars and structures. Clean daylight.",
    thumbnail: "🌳",
    pack: "calisthenics",
    sport: ["calisthenics", "bodyweight", "street workout"],
    background: "Outdoor park with blurred trees and open sky, shallow depth of field, natural green tones",
    floor: "Flat rubber safety surface or packed earth, neutral dark tone",
    lighting: "Natural outdoor daylight — bright overcast or golden hour, soft even illumination",
    shadows: "Natural outdoor ground shadows, soft edges, consistent sun direction",
    atmosphere: "Open-air, natural daylight, calisthenics training ground",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Natural greens, earth tones, sky blue",
    allowedObjects: ["pull-up bar", "parallel bars", "dip station"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "power rack", "dumbbells", "kettlebell"],
    useCases: ["athlete content", "campaign visuals", "motion video", "social media"],
  },
  {
    id: "urban-training-space",
    name: "Urban Training Space",
    description: "City rooftop or alley with concrete textures. Modern and edgy.",
    thumbnail: "🏙️",
    pack: "calisthenics",
    sport: ["calisthenics", "bodyweight", "urban fitness"],
    background: "Urban concrete environment — rooftop or alley with blurred city skyline, neutral grey tones",
    floor: "Flat concrete surface, clean and even, urban grey",
    lighting: "Natural directional daylight with slight warm tone, soft urban reflections",
    shadows: "Natural outdoor shadows with urban light bounce, consistent direction",
    atmosphere: "Modern, urban, street-level training atmosphere",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Concrete grey, warm stone, steel accents",
    allowedObjects: ["pull-up bar", "resistance bands"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "power rack", "kettlebell", "grass", "turf"],
    useCases: ["social media", "campaign visuals", "athlete content"],
  },
  {
    id: "minimal-outdoor-training",
    name: "Minimal Outdoor Training",
    description: "Clean neutral outdoor space. Distraction-free bodyweight training.",
    thumbnail: "🌤️",
    pack: "calisthenics",
    sport: ["calisthenics", "bodyweight", "yoga", "mobility"],
    background: "Outdoor neutral blurred background — soft-focus trees and sky, shallow depth of field",
    floor: "Flat concrete or packed earth training ground, neutral tone",
    lighting: "Natural outdoor daylight — golden hour warm tone, soft directional sunlight from above-left, natural ambient fill",
    shadows: "Natural outdoor ground shadows, soft edges, consistent sun direction",
    atmosphere: "Open-air, natural daylight, outdoor athletic training ground",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Warm earth, soft greens, sky tones",
    allowedObjects: ["athletic training shoes"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "power rack", "kettlebell", "battle ropes"],
    useCases: ["product fit testing", "campaign visuals", "e-commerce", "social media"],
  },

  // ── Field Sports Pack ──
  {
    id: "football-field",
    name: "Football Field",
    description: "Green turf pitch with markings. Stadium or training ground.",
    thumbnail: "⚽",
    pack: "field-sports",
    sport: ["football", "soccer", "rugby"],
    background: "Football pitch with blurred stadium seating or training field perimeter, shallow depth of field",
    floor: "Manicured green turf with white pitch markings visible",
    lighting: "Bright stadium floodlight or natural daylight, even high-key illumination",
    shadows: "Short, defined shadows from overhead lighting, consistent across field",
    atmosphere: "Professional sports field, competitive, high-energy",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Turf green, white markings, sky blue",
    allowedObjects: ["football", "cones", "training bibs"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells"],
    useCases: ["athlete content", "campaign visuals", "social media", "launch campaigns"],
  },
  {
    id: "track-and-field",
    name: "Track & Field",
    description: "Athletic running track with lane markings. Competition-ready.",
    thumbnail: "🏃",
    pack: "field-sports",
    sport: ["athletics", "sprinting", "running"],
    background: "Athletic track with blurred infield and stadium elements, shallow depth of field",
    floor: "Red or blue synthetic track surface with white lane markings",
    lighting: "Bright daylight or stadium lighting, high-key even illumination",
    shadows: "Short shadows from high overhead light, consistent direction",
    atmosphere: "Competitive athletics, speed, precision",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Track red/blue, white lines, sky tones",
    allowedObjects: ["starting blocks", "cones", "hurdles"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells"],
    useCases: ["athlete content", "campaign visuals", "motion video", "social media"],
  },
  {
    id: "outdoor-athletic-surface",
    name: "Outdoor Athletic Surface",
    description: "Generic outdoor training ground. Versatile for all field sports.",
    thumbnail: "🏟️",
    pack: "field-sports",
    sport: ["athletics", "football", "general outdoor"],
    background: "Open outdoor sports ground with blurred treeline or facility, shallow depth of field",
    floor: "Flat grass or synthetic turf surface, clean and even",
    lighting: "Natural bright daylight, soft directional sunlight, ambient fill",
    shadows: "Natural ground shadows from sunlight, soft edges, consistent direction",
    atmosphere: "Open-air athletic ground, versatile outdoor training",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Green grass, earth tones, sky blue",
    allowedObjects: ["cones", "agility ladder", "training bibs"],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells"],
    useCases: ["athlete content", "campaign visuals", "motion video"],
  },

  // ── Lifestyle / Brand Pack ──
  {
    id: "bright-studio",
    name: "Bright Studio",
    description: "Clean white/grey studio with even lighting. E-commerce ready.",
    thumbnail: "📸",
    pack: "lifestyle",
    sport: ["fashion", "editorial", "e-commerce"],
    background: "Clean white-to-light-grey seamless studio cyclorama",
    floor: "Smooth light grey studio floor with soft gradient into background",
    lighting: "Even, diffused 4-point studio lighting — large softboxes from both sides, overhead fill, subtle backlight for depth",
    shadows: "Soft, diffused contact shadows with minimal contrast, natural and even",
    atmosphere: "Bright, clean, professional commercial studio",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "White, light grey, neutral tones",
    allowedObjects: [],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells", "grass", "turf"],
    useCases: ["e-commerce", "product shots", "lookbooks", "launch campaigns"],
  },
  {
    id: "premium-lifestyle-outdoor",
    name: "Premium Lifestyle Outdoor",
    description: "Scenic outdoor setting with fashion-grade lighting. Campaign ready.",
    thumbnail: "🌅",
    pack: "lifestyle",
    sport: ["lifestyle", "fashion", "editorial"],
    background: "Premium outdoor location with blurred scenic backdrop — golden light, shallow depth of field",
    floor: "Natural stone path or manicured lawn, clean and even",
    lighting: "Golden hour fashion lighting — warm directional key, soft fill from environment bounce, cinematic rim light",
    shadows: "Warm, soft golden-hour shadows, long and directional",
    atmosphere: "Premium lifestyle, aspirational, editorial campaign",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Golden warmth, sage greens, soft neutrals",
    allowedObjects: [],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells"],
    useCases: ["launch campaigns", "lookbooks", "social media", "brand content"],
  },
  {
    id: "beach-coastal-training",
    name: "Beach / Coastal Training",
    description: "Sandy coastline with ocean backdrop. Fresh and aspirational.",
    thumbnail: "🏖️",
    pack: "lifestyle",
    sport: ["lifestyle", "beach fitness", "outdoor"],
    background: "Sandy beach with blurred ocean and sky, soft coastal tones, shallow depth of field",
    floor: "Firm wet sand near waterline, flat and even, warm natural tone",
    lighting: "Bright coastal daylight with warm sun, soft reflections from water, even ambient fill",
    shadows: "Soft coastal shadows from high sun, warm-toned, consistent direction",
    atmosphere: "Fresh, aspirational, coastal training lifestyle",
    framing: "Wide full-body vertical composition with generous negative space",
    colorPalette: "Sand beige, ocean blue, sky white",
    allowedObjects: [],
    forbiddenObjects: ["barbell", "weight plates", "bench", "pull-up bar", "kettlebell", "dumbbells", "gym equipment"],
    useCases: ["launch campaigns", "social media", "brand content", "lifestyle campaigns"],
  },
];

export function getEnvironmentById(id: string): Environment {
  return PREDEFINED_ENVIRONMENTS.find(e => e.id === id) || PREDEFINED_ENVIRONMENTS[0];
}

export function getEnvironmentsByPack(pack: EnvironmentPack): Environment[] {
  return PREDEFINED_ENVIRONMENTS.filter(e => e.pack === pack);
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

export function environmentToObjectPolicy(env: Environment) {
  return {
    allowedObjects: env.allowedObjects,
    forbiddenObjects: env.forbiddenObjects,
  };
}
