-- ProofFlow upgrades: ownership, share roles, replies, versions, notifications

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS share_mode text NOT NULL DEFAULT 'comment';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_share_mode_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_share_mode_check
  CHECK (share_mode IN ('comment', 'view'));

CREATE TABLE IF NOT EXISTS public.pin_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  author text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pin_replies_pin_id_idx ON public.pin_replies(pin_id);

CREATE TABLE IF NOT EXISTS public.project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_url text NOT NULL,
  label text NOT NULL DEFAULT 'Version',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_versions_project_id_idx
  ON public.project_versions(project_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pin_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read pin_replies" ON public.pin_replies;
DROP POLICY IF EXISTS "Allow public insert pin_replies" ON public.pin_replies;
CREATE POLICY "Allow public read pin_replies"
  ON public.pin_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert pin_replies"
  ON public.pin_replies FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read project_versions" ON public.project_versions;
DROP POLICY IF EXISTS "Allow public insert project_versions" ON public.project_versions;
CREATE POLICY "Allow public read project_versions"
  ON public.project_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert project_versions"
  ON public.project_versions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow insert notifications"
  ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
