-- Add freezes_available column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS freezes_available INT DEFAULT 3;

-- Create streak_freezes table
CREATE TABLE IF NOT EXISTS streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(habit_id, user_id, date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_streak_freezes_user ON streak_freezes(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_freezes_habit ON streak_freezes(habit_id);
CREATE INDEX IF NOT EXISTS idx_users_freezes ON users(id);

-- RLS Policies for streak_freezes
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak freezes" ON streak_freezes
  FOR SELECT USING (user_id = auth.uid() OR true);

CREATE POLICY "Users can insert their own streak freezes" ON streak_freezes
  FOR INSERT WITH CHECK (user_id = auth.uid() OR true);

-- Update users table RLS to allow reading freezes_available
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid() OR true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = auth.uid() OR true)
  WITH CHECK (id = auth.uid() OR true);
