-- Create complaints bucket in storage if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaints', 
  'complaints', 
  true, 
  52428800, -- 50MB in bytes
  ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they exist to prevent migration conflicts
DROP POLICY IF EXISTS "Allow public select on complaints bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous upload on complaints bucket" ON storage.objects;

-- Create Policy: Allow anyone (public/anonymous) to download/view files from this bucket
CREATE POLICY "Allow public select on complaints bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaints');

-- Create Policy: Allow anyone (anonymous or authenticated) to upload files to this bucket
CREATE POLICY "Allow anonymous upload on complaints bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaints');
