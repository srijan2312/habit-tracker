import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Create a habit log
router.post('/logs', async (req, res) => {
  try {
    const { habit_id, user_id, date, completed } = req.body;
    if (!habit_id || !user_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Use upsert to avoid duplicate key errors
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id, user_id, date, completed: completed !== false })
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a habit log by habitId and date for a user
router.delete('/logs/:habitId/:date', async (req, res) => {
  try {
    const { habitId, date } = req.params;
    let userId = req.body.user_id || req.query.user_id;
    if (!userId && req.headers.authorization) {
      userId = req.headers['x-user-id'];
    }
    if (!habitId || !date || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', date);
    
    if (error) throw error;
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all habit logs for a user (for monthly tracker, etc.)
router.get('/logs/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all habits for a user, with logs and stats
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
    
    if (habitsError) throw habitsError;
    
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);
    
    if (logsError) throw logsError;

    // Get streak freezes
    const { data: freezes, error: freezesError } = await supabase
      .from('streak_freezes')
      .select('*')
      .eq('user_id', userId);
    
    if (freezesError) throw freezesError;
    
    const today = new Date().toISOString().slice(0, 10);

    // Build a quick lookup for freezes per habit
    const freezeMap = freezes.reduce((acc, curr) => {
      const list = acc.get(curr.habit_id) || [];
      list.push(curr.date);
      acc.set(curr.habit_id, list);
      return acc;
    }, new Map());

    const result = habits.map(habit => {
      const habitLogs = logs.filter(log => log.habit_id === habit.id && log.completed);
      const completedDates = Array.from(new Set(habitLogs.map(log => log.date))).sort();
      const habitFreezes = freezeMap.get(habit.id) || [];
      
      // Helper to check if date is scheduled for custom habits
      const isScheduledDay = (date, habit) => {
        if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.custom_days && habit.custom_days.length > 0) {
          const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          return habit.custom_days.includes(dayOfWeek);
        }
        return true; // Daily counts all days
      };

      let currentStreak = 0;
      if (completedDates.length > 0) {
        let streak = 0;
        let checkDate = new Date(today);
        let dateSet = new Set(completedDates);
        let freezeSet = new Set(habitFreezes);
        
        while (true) {
          const dateStr = checkDate.toISOString().slice(0, 10);
          // Only count scheduled days for streak
          if (isScheduledDay(checkDate, habit)) {
            if (dateSet.has(dateStr) || freezeSet.has(dateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          } else {
            // Skip unscheduled days
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
        currentStreak = streak;
      }
      
      let longestStreak = 0;
      let tempStreak = 1;
      if (completedDates.length > 0) {
        longestStreak = 1;
        for (let i = 1; i < completedDates.length; i++) {
          const prevDate = new Date(completedDates[i - 1]);
          const currDate = new Date(completedDates[i]);
          const diff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        }
      }
      
      // Calculate percentage based on current month (matching monthly tracker)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthStartStr = monthStart.toISOString().slice(0, 10);
      const monthEndStr = monthEnd.toISOString().slice(0, 10);

      // Count unique completed days in the full current month window
      const completedDatesInMonth = new Set(
        habitLogs.filter(log => log.date >= monthStartStr && log.date <= monthEndStr).map(log => log.date)
      );
      
      // Add freeze dates as protected completions
      habitFreezes.forEach(dateStr => {
        if (dateStr >= monthStartStr && dateStr <= monthEndStr) {
          completedDatesInMonth.add(dateStr);
        }
      });
      
      // For custom/weekly frequency habits, total scheduled days across the whole month
      let totalScheduledDays;
      if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.custom_days && habit.custom_days.length > 0) {
        let scheduledDaysCount = 0;
        let checkDate = new Date(monthStart);
        while (checkDate <= monthEnd) {
          if (habit.custom_days.includes(checkDate.getDay())) {
            scheduledDaysCount++;
          }
          checkDate.setDate(checkDate.getDate() + 1);
        }
        totalScheduledDays = scheduledDaysCount;
      } else {
        totalScheduledDays = Math.floor((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const completionPercentage = totalScheduledDays > 0 ? Math.round((completedDatesInMonth.size / totalScheduledDays) * 100) : 0;
      const todayCompleted = completedDates.includes(today);
      
      return {
        ...habit,
        currentStreak,
        longestStreak,
        completionPercentage,
        isCompletedToday: todayCompleted,
        logs: habitLogs,
        freezesUsed: habitFreezes.length,
        freezeDates: habitFreezes,
      };
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new habit
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a habit
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a habit
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Use a freeze token for a habit
router.post('/freeze/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const { user_id, date } = req.body;
    
    if (!user_id || !date) {
      return res.status(400).json({ error: 'Missing user_id or date' });
    }

    // Check if user has freeze tokens available
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('freezes_available')
      .eq('id', user_id)
      .single();
    
    if (userError) throw userError;
    
    if (!user || user.freezes_available < 1) {
      return res.status(400).json({ error: 'No freeze tokens available' });
    }

    // Check if freeze already exists for this habit on this date
    const { data: existingFreeze } = await supabase
      .from('streak_freezes')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user_id)
      .eq('date', date)
      .single();
    
    if (existingFreeze) {
      return res.status(400).json({ error: 'Freeze already used for this date' });
    }

    // Add freeze record
    const { data: freeze, error: freezeError } = await supabase
      .from('streak_freezes')
      .insert([{ habit_id: habitId, user_id, date }])
      .select();
    
    if (freezeError) throw freezeError;

    // Decrement user's freeze tokens
    const { error: updateError } = await supabase
      .from('users')
      .update({ freezes_available: user.freezes_available - 1 })
      .eq('id', user_id);
    
    if (updateError) throw updateError;

    res.json({ message: 'Freeze applied', freeze: freeze[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user freeze tokens count
router.get('/info/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('freezes_available')
      .eq('id', req.params.userId)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
