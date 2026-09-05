-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow insert by anyone (anonymous)
CREATE POLICY "Enable insert for anonymous" ON public.contact_messages 
FOR INSERT WITH CHECK (true);

-- Add attachment_url column to contact_messages
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create contact_attachments bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contact_attachments', 'contact_attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Enable public uploads (anyone can upload an attachment)
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contact_attachments');

-- Enable public reads (admin can view the attachments)
CREATE POLICY "Allow public reads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contact_attachments');
