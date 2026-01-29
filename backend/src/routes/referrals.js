import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's referral info (code, total referrals, referral list)
router.get('/info', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const db = supabaseAdmin || supabase;

    // Get user's referral code and total referrals
    const { data: user, error: userError } = await db
      .from('users')
      .select('referral_code, total_referrals')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get list of users they referred
    const { data: referrals, error: referralsError } = await db
      .from('referrals')
      .select(`
        id,
        created_at,
        freeze_tokens_awarded,
        referred_user:users!referrals_referred_user_id_fkey(email, created_at)
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (referralsError) throw referralsError;

    res.json({
      referralCode: user.referral_code,
      totalReferrals: user.total_referrals || 0,
      referrals: referrals || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate a referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const db = supabaseAdmin || supabase;

    const { data: user, error } = await db
      .from('users')
      .select('id, email, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !user) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrerId: user.id,
      message: `Valid referral code from ${user.email}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply referral (called after new user signs up via Supabase Auth)
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { referralCode } = req.body;
    const newUserId = req.userId; // The newly signed up user
    const db = supabaseAdmin || supabase;

    if (!referralCode) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await db
      .from('users')
      .select('id, freezes_available, total_referrals')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Check if this referral already exists
    const { data: existingReferral } = await db
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_user_id', newUserId)
      .single();

    if (existingReferral) {
      return res.status(400).json({ error: 'Referral already applied' });
    }

    // Create referral record
    const { error: referralError } = await db
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        freeze_tokens_awarded: 5,
      });

    if (referralError) throw referralError;

    // Update referrer: add 5 freeze tokens and increment total_referrals
    const newFreezeCount = (referrer.freezes_available || 0) + 5;
    const newTotalReferrals = (referrer.total_referrals || 0) + 1;

    const { error: updateError } = await db
      .from('users')
      .update({
        freezes_available: newFreezeCount,
        total_referrals: newTotalReferrals,
      })
      .eq('id', referrer.id);

    if (updateError) throw updateError;

    // Update new user's referred_by field
    const { error: newUserError } = await db
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    if (newUserError) throw newUserError;

    res.json({
      success: true,
      message: 'Referral applied successfully',
      tokensAwarded: 5,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get referral leaderboard (top referrers)
router.get('/leaderboard', async (req, res) => {
  try {
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('users')
      .select('email, total_referrals')
      .gt('total_referrals', 0)
      .order('total_referrals', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
