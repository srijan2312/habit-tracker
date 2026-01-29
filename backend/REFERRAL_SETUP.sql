-- Referral System Setup for Habitly

-- 1. Add referral tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- 2. Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freeze_tokens_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_user_id)
);

-- 3. Generate referral codes for existing users (8-character alphanumeric)
UPDATE users 
SET referral_code = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8)
)
WHERE referral_code IS NULL;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);

-- 5. Row Level Security policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals
CREATE POLICY referrals_select_own ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Policy: Allow inserting referrals (will be controlled by backend)
CREATE POLICY referrals_insert_policy ON referrals
  FOR INSERT
  WITH CHECK (true);

-- 6. Function to automatically generate referral code on user creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON users;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Verification queries
-- SELECT id, email, referral_code, total_referrals FROM users LIMIT 10;
-- SELECT * FROM referrals;
