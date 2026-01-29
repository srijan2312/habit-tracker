import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's daily signin reward status
router.get('/daily-signin/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Get from verified token, ignore URL param

    // Get user's daily signin reward record
    const { data: reward, error } = await supabase
      .from('daily_signin_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    // If no record exists, user is brand new - return day 1
    if (!reward) {
      return res.json({
        currentDay: 1,
        lastClaimedDate: null,
        totalPoints: 0,
        freezeTokens: 0,
        canClaimToday: true,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastClaimed = reward.last_claimed_date;
    
    // Check if user already claimed today
    const canClaimToday = lastClaimed !== today;
    
    // Determine current day in streak
    let currentDay = 1;
    if (lastClaimed) {
      const lastClaimedDate = new Date(lastClaimed);
      const todayDate = new Date(today);
      const daysDifference = Math.floor((todayDate - lastClaimedDate) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 1) {
        // Consecutive day - increment streak
        currentDay = (reward.current_day % 7) + 1;
      } else if (daysDifference > 1) {
        // Streak broken - reset to day 1
        currentDay = 1;
      } else if (daysDifference === 0) {
        // Same day - don't change
        currentDay = reward.current_day;
      }
    }

    res.json({
      currentDay,
      lastClaimedDate: lastClaimed,
      totalPoints: reward.total_points || 0,
      freezeTokens: reward.freeze_tokens || 0,
      canClaimToday,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim daily signin reward
router.post('/daily-signin/claim/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Get from verified token, ignore URL param
    const today = new Date().toISOString().slice(0, 10);

    // Get current reward record
    const { data: existingReward } = await supabase
      .from('daily_signin_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    let currentDay = 1;
    let newPoints = 10;
    let newFreezeTokens = 0;

    if (existingReward) {
      const lastClaimed = existingReward.last_claimed_date;
      const lastClaimedDate = new Date(lastClaimed);
      const todayDate = new Date(today);
      const daysDifference = Math.floor((todayDate - lastClaimedDate) / (1000 * 60 * 60 * 24));

      if (daysDifference === 1) {
        // Consecutive day
        currentDay = (existingReward.current_day % 7) + 1;
      } else if (daysDifference === 0) {
        // Already claimed today
        return res.status(400).json({ error: 'Already claimed reward today' });
      } else {
        // Streak broken, reset to day 1
        currentDay = 1;
      }

      newPoints = existingReward.total_points + 10;

      // Day 7 reward - freeze token
      if (currentDay === 1 && existingReward.current_day === 7) {
        newFreezeTokens = existingReward.freeze_tokens + 1;
      } else {
        newFreezeTokens = existingReward.freeze_tokens;
      }
    }

    // Day 7 gets freeze token
    if (currentDay === 7) {
      newFreezeTokens = (existingReward?.freeze_tokens || 0) + 1;
    }

    // Upsert reward record
    const { data: updated, error } = await supabase
      .from('daily_signin_rewards')
      .upsert(
        {
          user_id: userId,
          current_day: currentDay,
          last_claimed_date: today,
          total_points: newPoints,
          freeze_tokens: newFreezeTokens,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (error) throw error;

    const reward = updated[0];

    res.json({
      success: true,
      currentDay: reward.current_day,
      pointsEarned: 10,
      freezeTokenEarned: currentDay === 7 ? 1 : 0,
      totalPoints: reward.total_points,
      totalFreezeTokens: reward.freeze_tokens,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
