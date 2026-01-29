import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get leaderboard - only shows highest streak and avg completion (no habit details)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { metric = 'completion', limit = 50 } = req.query;
    const userId = req.userId;
    const displayLimit = Math.min(parseInt(limit) || 50, 50); // Cap at 50
    
    // Get all users
    const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name');
    
    if (usersError) throw usersError;
    
    // Get all habits and logs
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*');
    
    if (habitsError) throw habitsError;
    
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('completed', true);
    
    if (logsError) throw logsError;
    
    const { data: freezes, error: freezesError } = await supabase
      .from('streak_freezes')
      .select('*');
    
    if (freezesError) throw freezesError;

    // Build leaderboard data for each user
    const leaderboardData = users.map(user => {
      const userHabits = habits.filter(h => h.user_id === user.id);
      const userLogs = logs.filter(l => l.user_id === user.id);
      const userFreezes = freezes.filter(f => f.user_id === user.id);
      
      // Calculate highest streak across all habits
      let highestStreak = 0;
      userHabits.forEach(habit => {
        const habitLogs = userLogs.filter(l => l.habit_id === habit.id).map(l => l.date).sort();
        const habitFreezes = userFreezes.filter(f => f.habit_id === habit.id).map(f => f.date);
        
        const completedOrFrozen = new Set([...habitLogs, ...habitFreezes]);
        
        if (completedOrFrozen.size > 0) {
          const sortedDates = Array.from(completedOrFrozen).sort();
          const cursor = new Date(sortedDates[0]);
          const lastDate = new Date(sortedDates[sortedDates.length - 1]);
          let tempStreak = 0;
          
          while (cursor <= lastDate) {
            const dateStr = cursor.toISOString().slice(0, 10);
            if (completedOrFrozen.has(dateStr)) {
              tempStreak++;
              if (tempStreak > highestStreak) highestStreak = tempStreak;
            } else {
              tempStreak = 0;
            }
            cursor.setDate(cursor.getDate() + 1);
          }
        }
      });
      
      // Calculate average completion %
      let totalCompletion = 0;
      let habitCount = 0;
      
      userHabits.forEach(habit => {
        const today = new Date().toISOString().slice(0, 10);
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        const monthStartStr = monthStart.toISOString().slice(0, 10);
        const monthEndStr = monthEnd.toISOString().slice(0, 10);
        
        const completedDates = new Set(
          userLogs
            .filter(l => l.habit_id === habit.id && l.date >= monthStartStr && l.date <= monthEndStr)
            .map(l => l.date)
        );
        
        userFreezes
          .filter(f => f.habit_id === habit.id && f.date >= monthStartStr && f.date <= monthEndStr)
          .forEach(f => completedDates.add(f.date));
        
        let totalScheduledDays;
        if ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.custom_days && habit.custom_days.length > 0) {
          let scheduledDaysCount = 0;
          const checkDate = new Date(monthStart);
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
        
        const percentage = totalScheduledDays > 0 ? Math.round((completedDates.size / totalScheduledDays) * 100) : 0;
        totalCompletion += percentage;
        habitCount++;
      });
      
      const avgCompletion = habitCount > 0 ? Math.round(totalCompletion / habitCount) : 0;
      
      return {
        userId: user.id,
        name: user.name || 'User',
        highestStreak,
        avgCompletion,
        habitCount: userHabits.length,
      };
    });

    // Sort by metric
    let sorted = leaderboardData;
    if (metric === 'streak') {
      sorted = leaderboardData.sort((a, b) => b.highestStreak - a.highestStreak);
    } else {
      sorted = leaderboardData.sort((a, b) => b.avgCompletion - a.avgCompletion);
    }
    
    // Add rank
    const withRank = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Return top 50 + user's rank if outside top 50
    const topUsers = withRank.slice(0, displayLimit);
    const response = { users: topUsers, userRank: null };

    // If userId provided and not in top 50, include their full rank info
    if (userId) {
      const userRankInfo = withRank.find(entry => entry.userId === userId);
      if (userRankInfo && userRankInfo.rank > displayLimit) {
        response.userRank = userRankInfo;
      }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
