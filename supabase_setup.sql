-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  fetched_content TEXT NOT NULL,
  focus_hint TEXT,
  basic_insight TEXT,
  advanced_insight TEXT,
  brief TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration: add focus_hint to existing tables (run once if table already exists)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS focus_hint TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Allow reading sessions that are either anonymous (user_id IS NULL) or belong to the current user
CREATE POLICY "Enable read access for own or anonymous" ON public.sessions 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow creating sessions that are either anonymous (user_id IS NULL) or belong to the current user
CREATE POLICY "Enable insert for own or anonymous" ON public.sessions 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow updating sessions that are either anonymous (user_id IS NULL) or belong to the current user
CREATE POLICY "Enable update for own or anonymous" ON public.sessions 
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
