-- Create activity_log table to track all habit completions

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'completed', 'created', 'deleted', 'edited'
  habit_name VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_habit_id ON public.activity_log(habit_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- RLS Policies
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity log"
ON public.activity_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own activity"
ON public.activity_log FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Grant access
GRANT SELECT, INSERT ON public.activity_log TO authenticated;

-- Create notification_settings table (for reminder preferences)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_reminders BOOLEAN DEFAULT false,
  email_digest BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '08:00:00',
  digest_day VARCHAR(10) DEFAULT 'Monday',
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
ON public.notification_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings FOR UPDATE
USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
