import express from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create a habit log
router.post('/logs', async (req, res) => {
  try {
    const { habit_id, user_id, date, completed } = req.body;
    if (!habit_id || !user_id || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const log = new HabitLog({ habit_id, user_id, date, completed: completed !== false });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a habit log by habitId and date for a user
router.delete('/logs/:habitId/:date', async (req, res) => {
  try {
    const { habitId, date } = req.params;
    // Try to get userId from body, query, or headers (for frontend compatibility)
    let userId = req.body.user_id || req.query.user_id;
    if (!userId && req.headers.authorization) {
      // Optionally decode JWT here if you use it, or parse from headers
      // For now, try to get from a custom header if frontend sends it
      userId = req.headers['x-user-id'];
    }
    if (!habitId || !date || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const deleted = await HabitLog.findOneAndDelete({ habit_id: habitId, user_id: userId, date });
    if (!deleted) return res.status(404).json({ error: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Get all habit logs for a user (for monthly tracker, etc.)
router.get('/logs/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Optionally filter by habitId, date, etc. via query params
    const logs = await HabitLog.find({ user_id: userId });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all habits for a user, with logs and stats
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const habits = await Habit.find({ userId });
    const habitIds = habits.map(h => h._id);
    const logs = await HabitLog.find({ habit_id: { $in: habitIds }, user_id: userId });
    const today = new Date().toISOString().slice(0, 10);
    const result = habits.map(habit => {
      const habitLogs = logs.filter(log => String(log.habit_id) === String(habit._id) && log.completed);
      // Use only unique dates
      const completedDates = Array.from(new Set(habitLogs.map(log => log.date))).sort();
      // Calculate current streak: walk backward from today, count consecutive completions
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
      // Calculate best streak: walk through all completions, count max consecutive
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
      // Calculate completion percentage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30DaysLogs = habitLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);
      const completionPercentage = Math.round((last30DaysLogs.length / 30) * 100);
      const todayCompleted = completedDates.includes(today);
      return {
        ...habit.toObject(),
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
    const habit = new Habit(req.body);
    await habit.save();
    res.status(201).json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a habit
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a habit
router.delete('/:id', async (req, res) => {
  try {
    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
