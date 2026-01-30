import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

console.log('⚙️ === SETTINGS ROUTE INITIALIZATION ===');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables check:');
console.log('  SUPABASE_URL:', supabaseUrl ? `✅ ${supabaseUrl}` : '❌ MISSING');
console.log('  SUPABASE_KEY:', supabaseKey ? `✅ Set (${supabaseKey.substring(0, 20)}...)` : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseAdminKey ? `✅ Set (${supabaseAdminKey.substring(0, 20)}...)` : '❌ MISSING');
console.log('⚙️ === END INITIALIZATION ===\n');

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

// Middleware to verify token and extract user ID
const verifyToken = async (req, res, next) => {
  console.log('\n🔍 === TOKEN VERIFICATION START ===');
  
  const authHeader = req.headers.authorization;
  console.log('1️⃣ Auth header:', authHeader ? `Present (${authHeader.substring(0, 20)}...)` : '❌ MISSING');
  
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.error('❌ No token extracted from header');
    return res.status(401).json({ error: 'No token' });
  }
  
  console.log('2️⃣ Token extracted, length:', token.length);
  
  try {
    // Decode the JWT to extract user ID (without verification for now, just to get the user ID)
    console.log('3️⃣ Decoding JWT token...');
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sub) {
      console.error('❌ Invalid token - cannot decode or missing sub claim');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const userId = decoded.sub;
    console.log('4️⃣ User ID from token:', userId);
    console.log('5️⃣ Token email:', decoded.email || 'Not in token');
    console.log('6️⃣ Token expiry:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Not set');
    
    // Verify the user exists in our database
    console.log('7️⃣ Verifying user exists in database...');
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (dbError || !userData) {
      console.error('❌ User not found in database:', dbError?.message || 'No user data');
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('✅ User verified in database:', userData.email);
    console.log('🔍 === TOKEN VERIFICATION END ===\n');
    
    req.userId = userId;
    req.userEmail = userData.email;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Token verification exception:', error);
    console.error('   Stack:', error.stack);
    console.log('🔍 === TOKEN VERIFICATION END (ERROR) ===\n');
    return res.status(401).json({ error: 'Invalid token', exception: error.message });
  }
};

// Get user settings
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, total_referrals, freezes_available')
      .eq('id', req.userId)
      .single();

    if (error) {
      console.error('❌ Get profile error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Profile retrieved:', data.email);
    res.json({ profile: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile (name)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update profile error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Profile updated for user:', req.userId);
    res.json({ profile: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get user email from database
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password using auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: oldPassword,
    });

    if (signInError) {
      console.error('❌ Old password incorrect:', signInError);
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('❌ Update password error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    console.log('✅ Password changed for user:', req.userId);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update email preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { 
      email_reminders = false,
      email_digest = false,
      push_notifications = false,
    } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        email_reminders,
        email_digest,
        push_notifications,
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update preferences error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Preferences updated for user:', req.userId);
    res.json({ preferences: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get email preferences
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email_reminders, email_digest, push_notifications')
      .eq('id', req.userId)
      .single();

    if (error) {
      console.error('❌ Get preferences error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Preferences retrieved for user:', req.userId);
    res.json({ preferences: data || {} });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required to delete account' });
    }

    // Get user email from database
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    });

    if (signInError) {
      console.error('❌ Password incorrect:', signInError);
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // Delete user from users table
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.userId);

    if (deleteUserError) {
      console.error('❌ Delete user error:', deleteUserError);
      return res.status(400).json({ error: deleteUserError.message });
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(req.userId);

    if (deleteAuthError) {
      console.error('❌ Delete auth error:', deleteAuthError);
      return res.status(400).json({ error: deleteAuthError.message });
    }

    console.log('✅ Account deleted for user:', req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
