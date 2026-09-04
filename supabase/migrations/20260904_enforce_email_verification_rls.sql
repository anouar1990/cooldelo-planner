-- Migration: 20260904_enforce_email_verification_rls.sql
-- Description: Enforce email verification RLS policies for write operations on protected tables.

-- Helper function to check if the current user's email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    (auth.jwt() ->> 'email_confirmed_at') IS NOT NULL 
    OR ((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean IS TRUE)
  );
$$;

-- Enable RLS on protected tables if not already enabled
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.machine_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_time_logs ENABLE ROW LEVEL SECURITY;

-- Policy helper updates for PROJECTS
DROP POLICY IF EXISTS "Verified users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Verified users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Verified users can delete projects" ON public.projects;

CREATE POLICY "Verified users can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

-- Policy helper updates for MATERIALS
DROP POLICY IF EXISTS "Verified users can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Verified users can update materials" ON public.materials;
DROP POLICY IF EXISTS "Verified users can delete materials" ON public.materials;

CREATE POLICY "Verified users can insert materials"
ON public.materials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can update materials"
ON public.materials FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can delete materials"
ON public.materials FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

-- Policy helper updates for CLIENTS
DROP POLICY IF EXISTS "Verified users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Verified users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Verified users can delete clients" ON public.clients;

CREATE POLICY "Verified users can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

-- Policy helper updates for MACHINE PROFILES
DROP POLICY IF EXISTS "Verified users can insert machine_profiles" ON public.machine_profiles;
DROP POLICY IF EXISTS "Verified users can update machine_profiles" ON public.machine_profiles;
DROP POLICY IF EXISTS "Verified users can delete machine_profiles" ON public.machine_profiles;

CREATE POLICY "Verified users can insert machine_profiles"
ON public.machine_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can update machine_profiles"
ON public.machine_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can delete machine_profiles"
ON public.machine_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

-- Policy helper updates for INVOICES
DROP POLICY IF EXISTS "Verified users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Verified users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Verified users can delete invoices" ON public.invoices;

CREATE POLICY "Verified users can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());

CREATE POLICY "Verified users can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_email_verified());
