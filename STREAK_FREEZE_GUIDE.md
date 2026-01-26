# Streak Freeze Feature - Setup Guide

## Overview
The Streak Freeze feature allows users to protect their habit streaks when they miss a day. Each user gets **3 freeze tokens** by default, which can be used to protect their streak for any missed day.

## Database Setup

Run the SQL from `STREAK_FREEZE_SETUP.sql` in your Supabase SQL Editor:

1. Go to **Supabase Dashboard → SQL Editor**
2. Create a new query
3. Copy and paste the contents of `STREAK_FREEZE_SETUP.sql`
4. Click "Run"

This will:
- Add `freezes_available` column to the `users` table (defaults to 3)
- Create `streak_freezes` table to track used freezes
- Set up Row Level Security policies
- Create indexes for performance

## How It Works

### For Users
1. View your available freeze tokens in the header (lightning bolt icon)
2. If you miss a habit, you can use a freeze token to protect your streak
3. The freeze covers the missed day as if it were completed
4. Once all freezes are used, no more can be applied until reset by admin

### For Backend
- **GET** `/api/habits/info/:userId` - Get user's freeze token count
- **POST** `/api/habits/freeze/:habitId` - Use a freeze token
  - Body: `{ user_id, date }`
  - Checks if user has tokens available
  - Prevents duplicate freezes on same date
  - Decrements user's `freezes_available`

### For Frontend
- **StreakFreezeCounter** component shows available tokens in header
- **StreakFreezeButton** component allows users to use a freeze
- Habit streaks now include freeze days in calculation
- HabitCard displays number of freezes used per habit

## User Stories

### Scenario 1: Using a Freeze
1. User has a 5-day streak on "Drink Water"
2. User misses day 6 (falls asleep before checking app)
3. User sees streak at risk, clicks "Use Freeze"
4. Streak continues at 6 days (freeze day counts)
5. Freeze token count decreases from 3 → 2

### Scenario 2: No Tokens Left
1. User has already used all 3 freezes
2. User misses another day
3. "Use Freeze" button is disabled with message "No freeze tokens available"
4. Streak breaks

## Admin Features

### Reset User's Freezes
You can manually reset a user's freezes in Supabase:

```sql
UPDATE users SET freezes_available = 3 WHERE id = '<user_id>';
```

### View Freeze Usage
```sql
SELECT habit_id, user_id, date, created_at 
FROM streak_freezes 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check User's Freeze Count
```sql
SELECT email, freezes_available 
FROM users 
WHERE freezes_available < 3;
```

## Frontend Components

### StreakFreezeCounter
Shows in header, displays current freeze count with lightning icon

```tsx
<StreakFreezeCounter />
```

### StreakFreezeButton
Used to apply a freeze to a missed day

```tsx
<StreakFreezeButton 
  habitId={habitId} 
  missedDate={date}
  onFreezeUsed={() => refetchHabits()}
/>
```

## Testing

1. **Test freeze usage:**
   - Create a habit
   - Mark it complete for a few days
   - Miss one day
   - Use a freeze token
   - Verify streak continues

2. **Test token limits:**
   - Use all 3 freezes
   - Try to use a 4th freeze
   - Verify it's disabled

3. **Test backend validation:**
   - Try to use freeze twice on same date
   - Verify error: "Freeze already used for this date"

## Future Enhancements

- [ ] Admin dashboard to manage freeze tokens
- [ ] Monthly freeze token reset
- [ ] Earn extra freezes by maintaining long streaks
- [ ] Freeze analytics dashboard
- [ ] Streak recovery points system
