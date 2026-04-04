
ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS appearance_preset text NOT NULL DEFAULT 'Custom',
  ADD COLUMN IF NOT EXISTS face_style text NOT NULL DEFAULT 'Athletic',
  ADD COLUMN IF NOT EXISTS age_feel text NOT NULL DEFAULT 'athletic adult',
  ADD COLUMN IF NOT EXISTS expression_style text NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS hair_type text NOT NULL DEFAULT 'straight',
  ADD COLUMN IF NOT EXISTS hair_length text NOT NULL DEFAULT 'short';
