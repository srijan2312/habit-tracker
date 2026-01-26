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
    
    const { data, error } = await supabase
      .from('habit_logs')
      .insert([{ habit_id, user_id, date, completed: completed !== false }])
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
    
    const today = new Date().toISOString().slice(0, 10);
    const result = habits.map(habit => {
      const habitLogs = logs.filter(log => log.habit_id === habit.id && log.completed);
      const completedDates = Array.from(new Set(habitLogs.map(log => log.date))).sort();
      
      let currentStreak = 0;
      if (completedDates.length > 0) {
        let streak = 0;
        let checkDate = new Date(today);
        let dateSet = new Set(completedDates);
        while (true) {
          const dateStr = checkDate.toISOString().slice(0, 10);
          if (dateSet.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
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
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30DaysLogs = habitLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);
      const completionPercentage = Math.round((last30DaysLogs.length / 30) * 100);
      const todayCompleted = completedDates.includes(today);
      
      return {
        ...habit,
        currentStreak,
        longestStreak,
        completionPercentage,
        isCompletedToday: todayCompleted,
        logs: habitLogs,
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

export default router;
