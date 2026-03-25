CREATE TABLE public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  batch_type TEXT NOT NULL DEFAULT 'sizes_and_angles',
  requested_sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_angles JSONB NOT NULL DEFAULT '["front","side-left","side-right","back"]'::jsonb,
  request_payload JSONB NOT NULL,
  master_scene JSONB,
  current_size TEXT,
  current_angle TEXT,
  restart_count INTEGER NOT NULL DEFAULT 0,
  max_restarts INTEGER NOT NULL DEFAULT 2,
  processing_token UUID,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT generation_jobs_status_check CHECK (status IN ('queued', 'processing', 'regenerating', 'completed', 'failed'))
);

CREATE TABLE public.generation_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  angle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  inline_image TEXT,
  validation_passed BOOLEAN,
  last_error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT generation_job_items_status_check CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  CONSTRAINT generation_job_items_unique UNIQUE (job_id, size, angle)
);

CREATE INDEX idx_generation_jobs_status_created_at ON public.generation_jobs(status, created_at);
CREATE INDEX idx_generation_job_items_job_status ON public.generation_job_items(job_id, status);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generation jobs"
ON public.generation_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation jobs"
ON public.generation_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation jobs"
ON public.generation_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own generation job items"
ON public.generation_job_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generation_jobs jobs
    WHERE jobs.id = generation_job_items.job_id
      AND jobs.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.update_generation_job_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_generation_jobs_updated_at
BEFORE UPDATE ON public.generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_generation_job_timestamps();

CREATE TRIGGER update_generation_job_items_updated_at
BEFORE UPDATE ON public.generation_job_items
FOR EACH ROW
EXECUTE FUNCTION public.update_generation_job_timestamps();