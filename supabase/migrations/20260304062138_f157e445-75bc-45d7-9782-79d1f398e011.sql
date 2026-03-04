
-- Create athlete_profiles table
CREATE TABLE public.athlete_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'male',
  height_cm INTEGER NOT NULL DEFAULT 175,
  weight_kg INTEGER NOT NULL DEFAULT 75,
  body_type TEXT NOT NULL DEFAULT 'aesthetic',
  muscle_density INTEGER NOT NULL DEFAULT 5,
  body_fat_pct INTEGER NOT NULL DEFAULT 15,
  skin_tone TEXT NOT NULL DEFAULT 'medium',
  face_structure TEXT NOT NULL DEFAULT 'angular',
  hair_style TEXT NOT NULL DEFAULT 'short fade',
  brand_vibe TEXT NOT NULL DEFAULT 'aesthetic',
  identity_seed TEXT,
  reference_portrait_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: brand owners and team members can manage athletes
CREATE POLICY "Athlete access via brand"
ON public.athlete_profiles
FOR ALL
USING (
  (EXISTS (SELECT 1 FROM brands WHERE brands.id = athlete_profiles.brand_id AND brands.owner_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM team_members WHERE team_members.brand_id = athlete_profiles.brand_id AND team_members.user_id = auth.uid()))
);

-- Trigger for updated_at
CREATE TRIGGER update_athlete_profiles_updated_at
BEFORE UPDATE ON public.athlete_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
