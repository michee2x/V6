-- 1. Add has_seen_welcome_modal column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS has_seen_welcome_modal BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Update the handle_new_user trigger to give 30 free credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits_remaining, credits_total)
  VALUES (new.id, new.email, 30, 30)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Retroactively give 30 credits to any existing users who have 0 credits
UPDATE public.users
  SET credits_remaining = 30, credits_total = 30
  WHERE credits_remaining = 0 AND credits_total = 0 AND plan = 'free';

-- 4. Log the retroactive free credit grant as a transaction (optional but useful for auditing)
INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, note)
  SELECT id, 'welcome_gift', 30, 30, 'Retroactive 30-credit welcome gift'
  FROM public.users
  WHERE credits_remaining = 30 AND credits_total = 30 AND plan = 'free'
  ON CONFLICT DO NOTHING;
