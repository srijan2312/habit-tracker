# Supabase User Migration Guide

## Problem
Users are not seeing their data because there's a mismatch between `auth.users` (authentication) and `public.users` (application data).

## Solution
Run the migration script to sync all auth users with the users table.

## Steps to Run Migration

### 1. Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run Migration Script
1. Copy the contents of `backend/supabase-user-migration.sql`
2. Paste into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`

### 3. Execute Step by Step (Recommended)

**Step 1: Check for Missing Users**
```sql
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
```
This shows which users are missing from the `users` table.

**Step 2: Insert Missing Users**
```sql
INSERT INTO public.users (
    id,
    email,
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
    COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)) as name,
    au.created_at,
    true,
    true,
    false,
    0,
    10
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```
This inserts all missing users with default values.

**Step 3: Verify Migration**
```sql
SELECT 
    COUNT(*) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users,
    COUNT(*) - (SELECT COUNT(*) FROM public.users) as difference
FROM auth.users;
```
`difference` should be `0` if migration was successful.

### 4. Setup Auto-Sync Trigger (Important!)

This prevents future issues by automatically creating `users` table entries when someone signs up:

```sql
-- Create function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
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
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.created_at,
        true,
        true,
        false,
        0,
        10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## Expected Results

### Before Migration
- Auth users: 50
- Public users: 30
- **Missing: 20 users** ❌

### After Migration
- Auth users: 50
- Public users: 50
- **Missing: 0 users** ✅

## Verification

### Check Missing Users Count
```sql
SELECT COUNT(*) as missing_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```
Should return `0`.

### List Recently Migrated Users
```sql
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: "Permission denied"
**Solution:** Make sure you're logged in as the Supabase project owner or have admin access.

### Issue: "Duplicate key violation"
**Solution:** Some users might already exist. The script uses `LEFT JOIN` to avoid duplicates, but if you get this error, it means the user already exists (which is good!).

### Issue: Users still can't see data
**Possible causes:**
1. Check if RLS (Row Level Security) policies are correct
2. Verify the user is logged in with the correct email
3. Check browser console for auth errors
4. Verify the token is being sent in API requests

### Check RLS Policies
```sql
-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- If needed, create select policy
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- If needed, create update policy
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id);
```

## After Migration

1. **Test login** with affected users
2. **Verify dashboard loads** with user data
3. **Check habits are visible**
4. **Confirm notifications preferences** are set

## Rollback (If Needed)

If something goes wrong, you can remove the migrated users:

```sql
-- DANGER: Only run if you need to rollback
-- This removes users that were just added

DELETE FROM public.users
WHERE id IN (
    SELECT u.id 
    FROM public.users u
    WHERE u.created_at > NOW() - INTERVAL '5 minutes'
);
```

## Need Help?

If issues persist:
1. Check Supabase logs in Dashboard → Logs
2. Check backend server logs on Render
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
