
-- Admin allowlist table
CREATE TABLE public.admin_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_allowlist WHERE email = lower(check_email)
  )
$$;

-- RLS: only admins can see the allowlist
CREATE POLICY "Admins can view allowlist"
ON public.admin_allowlist
FOR SELECT
TO authenticated
USING (public.is_admin_email((SELECT auth.jwt()->>'email')));

-- RLS: only admins can insert
CREATE POLICY "Admins can add to allowlist"
ON public.admin_allowlist
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_email((SELECT auth.jwt()->>'email')));

-- RLS: only admins can delete
CREATE POLICY "Admins can remove from allowlist"
ON public.admin_allowlist
FOR DELETE
TO authenticated
USING (public.is_admin_email((SELECT auth.jwt()->>'email')));

-- Seed the first admin
INSERT INTO public.admin_allowlist (email) VALUES ('emil@rajala.eu');
