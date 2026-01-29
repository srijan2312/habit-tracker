-- Add habit notes table and columns

-- Add notes column to habits table
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Create habit_logs table for tracking completions with notes
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(habit_id, user_id, completed_date)
);

-- Ensure columns exist if table already existed with older schema
ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS completed_date DATE,
  ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_date ON public.habit_logs(completed_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_created_at ON public.habit_logs(created_at);

-- RLS Policies
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs"
ON public.habit_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own habit logs"
ON public.habit_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own habit logs"
ON public.habit_logs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own habit logs"
ON public.habit_logs FOR DELETE
USING (user_id = auth.uid());

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
