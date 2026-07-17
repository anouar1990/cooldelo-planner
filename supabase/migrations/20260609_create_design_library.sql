-- Create the designs table
CREATE TABLE IF NOT EXISTS public.designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the user_downloads table to track downloads
CREATE TABLE IF NOT EXISTS public.user_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for fast querying
CREATE INDEX IF NOT EXISTS designs_category_idx ON public.designs(category);
CREATE INDEX IF NOT EXISTS designs_file_type_idx ON public.designs(file_type);
CREATE INDEX IF NOT EXISTS designs_tags_idx ON public.designs USING GIN (tags);

-- Setup Row Level Security (RLS)
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read designs (or restrict to authenticated users if needed)
-- For a SaaS, usually only authenticated users can view the library.
CREATE POLICY "Allow authenticated users to view designs" 
ON public.designs FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to insert/update/delete designs
-- Checked via JWT user_metadata 'is_admin' = 'true'
CREATE POLICY "Allow admins to insert designs" 
ON public.designs FOR INSERT 
TO authenticated 
WITH CHECK (((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true');

CREATE POLICY "Allow admins to update designs" 
ON public.designs FOR UPDATE 
TO authenticated 
USING (((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true');

CREATE POLICY "Allow admins to delete designs" 
ON public.designs FOR DELETE 
TO authenticated 
USING (((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true');

-- Allow authenticated users to view their own downloads
CREATE POLICY "Allow users to view their own downloads" 
ON public.user_downloads FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own downloads
CREATE POLICY "Allow users to log downloads" 
ON public.user_downloads FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- RPC for safely incrementing download count
CREATE OR REPLACE FUNCTION increment_download_count(target_design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET downloads_count = downloads_count + 1
  WHERE id = target_design_id;
END;
$$;
