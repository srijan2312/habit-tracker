import express from 'express';
import crypto from 'crypto';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's referral info (code, total referrals, referral list)
router.get('/info', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const db = supabaseAdmin || supabase;

    // Get user's referral code and total referrals
    let { data: users, error: userError } = await db
      .from('users')
      .select('id, referral_code, total_referrals, email')
      .eq('id', userId);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let user = users[0];

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

    console.log(`\n=== REFERRAL APPLY START ===`);
    console.log(`Code: ${referralCode}, NewUserId: ${newUserId}`);

    if (!referralCode) {
      console.log('❌ No referral code provided');
      return res.status(400).json({ error: 'Referral code is required' });
    }

    // Ensure new user exists in public.users table and has referral code
    const { data: newUser, error: newUserCheckError } = await db
      .from('users')
      .select('id, referral_code')
      .eq('id', newUserId);

    if (newUserCheckError) {
      console.error('❌ Error checking new user:', newUserCheckError);
      throw newUserCheckError;
    }

    if (!newUser || newUser.length === 0) {
      // User doesn't exist, create one with default password hash
      console.log('ℹ️ New user not in public.users, creating...');
      const defaultPasswordHash = '$2a$10$' + crypto.randomBytes(53).toString('base64').substring(0, 53);
      const { error: createError } = await db
        .from('users')
        .insert({
          id: newUserId,
          email: req.user?.email || `user_${newUserId}@habitly.app`,
          password: defaultPasswordHash,
          referral_code: generateReferralCode(newUserId),
        });
      
      if (createError) {
        console.error('❌ Error creating new user:', createError);
        throw createError;
      }
      console.log('✅ New user created');
    } else if (!newUser[0].referral_code) {
      // User exists but no referral code, generate one
      console.log('ℹ️ New user exists but no referral code, generating...');
      const { error: updateError } = await db
        .from('users')
        .update({ referral_code: generateReferralCode(newUserId) })
        .eq('id', newUserId);
      
      if (updateError) {
        console.error('❌ Error generating referral code:', updateError);
        throw updateError;
      }
      console.log('✅ Referral code generated for new user');
    }

    // Find referrer by code
    console.log(`\nℹ️ Looking up referrer with code: ${referralCode.toUpperCase()}`);
    const { data: referrers, error: referrerError } = await db
      .from('users')
      .select('id, freezes_available, total_referrals, email')
      .eq('referral_code', referralCode.toUpperCase());

    if (referrerError) {
      console.error('❌ Error finding referrer:', referrerError);
      throw referrerError;
    }

    if (!referrers || referrers.length === 0) {
      console.error('❌ Referrer not found with code:', referralCode.toUpperCase());
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const referrer = referrers[0];
    console.log(`✅ Found referrer: ${referrer.email}`);
    console.log(`   Current freezes: ${referrer.freezes_available}, referrals: ${referrer.total_referrals}`);

    // Prevent self-referral
    if (referrer.id === newUserId) {
      console.log('❌ Self-referral attempt');
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Check if this referral already exists
    console.log(`\nℹ️ Checking for existing referral...`);
    const { data: existingReferrals, error: existingCheckError } = await db
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_user_id', newUserId);

    if (existingCheckError) {
      console.error('❌ Error checking existing referral:', existingCheckError);
      throw existingCheckError;
    }

    if (existingReferrals && existingReferrals.length > 0) {
      console.log('❌ Referral already exists');
      return res.status(400).json({ error: 'Referral already applied' });
    }
    console.log('✅ No existing referral found');

    // Create referral record
    console.log(`\nℹ️ Creating referral record...`);
    const { data: createdReferral, error: referralError } = await db
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        freeze_tokens_awarded: 5,
      })
      .select();

    if (referralError) {
      console.error('❌ Error creating referral:', referralError);
      throw referralError;
    }
    console.log('✅ Referral record created');

    // Update referrer: add 5 freeze tokens and increment total_referrals
    const newFreezeCount = (referrer.freezes_available || 0) + 5;
    const newTotalReferrals = (referrer.total_referrals || 0) + 1;

    console.log(`\nℹ️ Updating referrer...`);
    console.log(`   New freezes: ${referrer.freezes_available} → ${newFreezeCount}`);
    console.log(`   New referrals: ${referrer.total_referrals} → ${newTotalReferrals}`);

    const { data: updatedReferrer, error: updateError } = await db
      .from('users')
      .update({
        freezes_available: newFreezeCount,
        total_referrals: newTotalReferrals,
      })
      .eq('id', referrer.id)
      .select();

    if (updateError) {
      console.error('❌ Error updating referrer:', updateError);
      throw updateError;
    }
    console.log('✅ Referrer updated successfully');

    // Update new user's referred_by field
    console.log(`\nℹ️ Updating new user with referrer info...`);
    const { data: updatedNewUser, error: newUserError } = await db
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId)
      .select();

    if (newUserError) {
      console.error('❌ Error updating new user:', newUserError);
      throw newUserError;
    }
    console.log('✅ New user updated');

    console.log(`\n=== REFERRAL APPLY SUCCESS ===\n`);

    res.json({
      success: true,
      message: 'Referral applied successfully',
      tokensAwarded: 5,
      referrerEmail: referrer.email,
      referrerNewFreezeCount: newFreezeCount,
    });
  } catch (err) {
    console.error(`\n❌ REFERRAL APPLY ERROR:`, err);
    console.error(err.stack);
    console.log(`=== REFERRAL APPLY FAILED ===\n`);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Helper function to generate referral code
function generateReferralCode(userId) {
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
