-- Add settings columns to users table (run in Supabase SQL Editor)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_digest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email_reminders ON public.users(email_reminders);
CREATE INDEX IF NOT EXISTS idx_users_email_digest ON public.users(email_digest);

-- Grant access to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;
