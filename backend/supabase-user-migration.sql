-- =====================================================
-- Supabase User Migration Script
-- =====================================================
-- This script syncs auth.users with public.users table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check for missing users
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING in users table'
        ELSE 'EXISTS in users table'
    END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Step 2: Insert missing users into public.users table
INSERT INTO public.users (
    id,
    email,
    password,
    name,
    created_at,
    email_reminders,
    email_digest,
    push_notifications,
    total_referrals,
    freezes_available
)
SELECT 
    au.id,
    au.email,
    'supabase_auth', -- Placeholder - actual auth is in auth.users
    COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)) as name,
    au.created_at,
    true,  -- email_reminders default
    true,  -- email_digest default
    false, -- push_notifications default
    0,     -- total_referrals default
    10     -- freezes_available default
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = COALESCE(public.users.name, EXCLUDED.name),
    email_reminders = COALESCE(public.users.email_reminders, EXCLUDED.email_reminders),
    email_digest = COALESCE(public.users.email_digest, EXCLUDED.email_digest);

-- Step 3: Verify the migration
SELECT 
    COUNT(*) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users,
    COUNT(*) - (SELECT COUNT(*) FROM public.users) as difference
FROM auth.users;

-- Step 4: Show recently added users
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at,
    u.email_reminders,
    u.email_digest
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- Optional: Update existing users' email preferences
-- =====================================================
-- Uncomment below to enable email notifications for all existing users

-- UPDATE public.users
-- SET 
--     email_reminders = true,
--     email_digest = true
-- WHERE email_reminders IS NULL OR email_digest IS NULL;

-- =====================================================
-- Optional: Create trigger for automatic sync
-- =====================================================
-- This ensures new auth users automatically get a users table entry

-- Create function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        password,
        name,
        created_at,
        email_reminders,
        email_digest,
        push_notifications,
        total_referrals,
        freezes_available
    )
    VALUES (
        NEW.id,
        NEW.email,
        'supabase_auth', -- Placeholder - actual auth is in auth.users
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.created_at,
        true,
        true,
        false,
        0,
        10
    )
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        name = COALESCE(public.users.name, EXCLUDED.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if any auth users are still missing from users table
SELECT 
    COUNT(*) as missing_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- List all users with their auth status
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at,
    u.email_reminders,
    u.email_digest,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Active'
        ELSE 'Auth Missing'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;
