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
    let { data: user, error: userError } = await db
      .from('users')
      .select('id, referral_code, total_referrals, email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // If user doesn't have a referral code, generate one
    if (!user.referral_code) {
      console.log(`Generating referral code for user ${userId}`);
      const newCode = generateReferralCode(userId);
      const { error: updateError } = await db
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error generating referral code:', updateError);
      } else {
        user.referral_code = newCode;
      }
    }

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
    console.error('Error fetching referral info:', err);
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

    console.log(`Applying referral: code=${referralCode}, newUserId=${newUserId}`);

    // Ensure new user exists in public.users table and has referral code
    const { data: newUser, error: newUserCheckError } = await db
      .from('users')
      .select('id, referral_code')
      .eq('id', newUserId)
      .single();

    if (newUserCheckError?.code === 'PGRST116') {
      // User doesn't exist, create one
      console.log('New user not in public.users, creating...');
      const { error: createError } = await db
        .from('users')
        .insert({
          id: newUserId,
          email: req.user?.email || `user_${newUserId}@habitly.app`,
          referral_code: generateReferralCode(newUserId),
        });
      
      if (createError) {
        console.error('Error creating new user:', createError);
        throw createError;
      }
    } else if (newUserCheckError) {
      throw newUserCheckError;
    } else if (!newUser.referral_code) {
      // User exists but no referral code, generate one
      console.log('New user exists but no referral code, generating...');
      const { error: updateError } = await db
        .from('users')
        .update({ referral_code: generateReferralCode(newUserId) })
        .eq('id', newUserId);
      
      if (updateError) throw updateError;
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await db
      .from('users')
      .select('id, freezes_available, total_referrals, email')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      console.error('Referrer not found:', referrerError);
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    console.log(`Found referrer: ${referrer.email}, current freezes: ${referrer.freezes_available}`);

    // Prevent self-referral
    if (referrer.id === newUserId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Check if this referral already exists
    const { data: existingReferral, error: existingCheckError } = await db
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_user_id', newUserId)
      .single();

    if (existingReferral) {
      console.log('Referral already exists');
      return res.status(400).json({ error: 'Referral already applied' });
    }

    // Create referral record
    const { data: createdReferral, error: referralError } = await db
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        freeze_tokens_awarded: 5,
      })
      .select();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      throw referralError;
    }

    console.log('Referral record created:', createdReferral);

    // Update referrer: add 5 freeze tokens and increment total_referrals
    const newFreezeCount = (referrer.freezes_available || 0) + 5;
    const newTotalReferrals = (referrer.total_referrals || 0) + 1;

    console.log(`Updating referrer freezes: ${referrer.freezes_available} → ${newFreezeCount}, referrals: ${referrer.total_referrals} → ${newTotalReferrals}`);

    const { data: updatedReferrer, error: updateError } = await db
      .from('users')
      .update({
        freezes_available: newFreezeCount,
        total_referrals: newTotalReferrals,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referrer.id)
      .select();

    if (updateError) {
      console.error('Error updating referrer:', updateError);
      throw updateError;
    }

    console.log('Referrer updated:', updatedReferrer);

    // Update new user's referred_by field
    const { data: updatedNewUser, error: newUserError } = await db
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId)
      .select();

    if (newUserError) {
      console.error('Error updating new user:', newUserError);
      throw newUserError;
    }

    console.log('New user updated with referrer info');

    res.json({
      success: true,
      message: 'Referral applied successfully',
      tokensAwarded: 5,
      referrerEmail: referrer.email,
      referrerNewFreezeCount: newFreezeCount,
    });
  } catch (err) {
    console.error('Referral apply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate referral code
function generateReferralCode(userId) {
  const crypto = require('crypto');
  return crypto
    .createHash('md5')
    .update(Math.random().toString() + userId)
    .digest('hex')
    .toUpperCase()
    .substring(0, 8);
}

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
