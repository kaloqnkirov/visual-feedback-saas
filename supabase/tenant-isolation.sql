-- Multi-tenant isolation: each freelancer sees only their own projects.
-- Share links still work via SECURITY DEFINER RPCs (by project id).
-- Run this once in Supabase SQL Editor.

-- Ensure RLS is on
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive policies if present
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('projects', 'pins', 'pin_replies', 'project_versions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ========== projects ==========
CREATE POLICY "owners_select_own_projects"
  ON public.projects FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owners_insert_own_projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners_update_own_projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners_delete_own_projects"
  ON public.projects FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ========== pins (owners only for direct table access) ==========
CREATE POLICY "owners_select_own_pins"
  ON public.pins FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_own_pins"
  ON public.pins FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_own_pins"
  ON public.pins FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_own_pins"
  ON public.pins FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.owner_id = auth.uid()
    )
  );

-- Public commenting on shared projects (clients via share link)
CREATE POLICY "anon_insert_pins_on_shared"
  ON public.pins FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.share_mode = 'comment'
    )
  );

CREATE POLICY "anon_update_pins_on_shared"
  ON public.pins FOR UPDATE TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.share_mode = 'comment'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pins.project_id AND p.share_mode = 'comment'
    )
  );

-- ========== pin_replies ==========
CREATE POLICY "owners_select_own_replies"
  ON public.pin_replies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pins pin
      JOIN public.projects p ON p.id = pin.project_id
      WHERE pin.id = pin_replies.pin_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "shared_insert_replies"
  ON public.pin_replies FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pins pin
      JOIN public.projects p ON p.id = pin.project_id
      WHERE pin.id = pin_replies.pin_id AND p.share_mode = 'comment'
    )
    OR EXISTS (
      SELECT 1
      FROM public.pins pin
      JOIN public.projects p ON p.id = pin.project_id
      WHERE pin.id = pin_replies.pin_id AND p.owner_id = auth.uid()
    )
  );

-- ========== project_versions ==========
CREATE POLICY "owners_select_own_versions"
  ON public.project_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_versions.project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_own_versions"
  ON public.project_versions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_versions.project_id AND p.owner_id = auth.uid()
    )
  );

-- ========== notifications (keep owner-scoped) ==========
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

-- ========== Share-link RPCs (no listing other tenants) ==========
CREATE OR REPLACE FUNCTION public.get_shared_project(p_id uuid)
RETURNS SETOF public.projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.projects WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_pins(p_project_id uuid)
RETURNS SETOF public.pins
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pins
  WHERE project_id = p_project_id
  ORDER BY created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_versions(p_project_id uuid)
RETURNS SETOF public.project_versions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.project_versions
  WHERE project_id = p_project_id
  ORDER BY created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_replies(p_pin_ids uuid[])
RETURNS SETOF public.pin_replies
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pin_replies
  WHERE pin_id = ANY (p_pin_ids)
  ORDER BY created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_project(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_pins(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_versions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_replies(uuid[]) TO anon, authenticated;
