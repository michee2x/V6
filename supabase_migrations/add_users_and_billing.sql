-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 0,
  credits_total INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger to automatically create a public.users row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists and drop it to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- e.g., 'monthly_reset', 'generation_video', 'generation_image'
  amount INTEGER NOT NULL, -- positive for added, negative for deducted
  balance_after INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Credit Transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credit transactions." ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- 4. Create Anonymous Usage Table
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  fingerprint TEXT,
  runs_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by fingerprint/ip
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_fingerprint ON public.anonymous_usage(fingerprint);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip ON public.anonymous_usage(ip_address);

-- Enable RLS for Anonymous Usage (Only service role / server can read/write)
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;
