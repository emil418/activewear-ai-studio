
-- Extend brand_kits with full brand kit fields
ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS logo_primary_url text,
  ADD COLUMN IF NOT EXISTS logo_secondary_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#00FF85',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#00E5FF',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#FF3D6E',
  ADD COLUMN IF NOT EXISTS font_primary text DEFAULT 'Satoshi',
  ADD COLUMN IF NOT EXISTS font_secondary text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS vibe text DEFAULT 'aesthetic',
  ADD COLUMN IF NOT EXISTS overlay_style text DEFAULT 'subtle',
  ADD COLUMN IF NOT EXISTS watermark_opacity numeric DEFAULT 0.3;

-- Create templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  athlete_id uuid REFERENCES public.athlete_profiles(id) ON DELETE SET NULL,
  movement_set jsonb DEFAULT '[]'::jsonb,
  phase_set jsonb DEFAULT '[]'::jsonb,
  intensity integer DEFAULT 50,
  camera_presets jsonb DEFAULT '["front","side","back"]'::jsonb,
  brand_kit_id uuid REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  output_type text DEFAULT 'campaign',
  influencer_locked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS: brand owners + team members
CREATE POLICY "Template access via brand"
  ON public.templates
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = templates.brand_id AND brands.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.brand_id = templates.brand_id AND team_members.user_id = auth.uid())
  );

-- Storage bucket for brand kit assets (fonts, secondary logos)
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for brand-assets bucket
CREATE POLICY "Brand assets upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Brand assets read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Brand assets delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets');
