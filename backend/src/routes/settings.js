import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  req.token = token;
  next();
};

// Get user settings
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, total_referrals, freezes_available')
      .eq('id', user.id)
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update profile error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Profile updated for:', user.email);
    res.json({ profile: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify old password using auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      console.error('❌ Old password incorrect:', signInError);
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('❌ Update password error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    console.log('✅ Password changed for:', user.email);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update email preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update preferences error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Preferences updated for:', user.email);
    res.json({ preferences: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get email preferences
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('email_reminders, email_digest, push_notifications')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Get preferences error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Preferences retrieved for:', user.email);
    res.json({ preferences: data || {} });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required to delete account' });
    }

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
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
      .eq('id', user.id);

    if (deleteUserError) {
      console.error('❌ Delete user error:', deleteUserError);
      return res.status(400).json({ error: deleteUserError.message });
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('❌ Delete auth error:', deleteAuthError);
      return res.status(400).json({ error: deleteAuthError.message });
    }

    console.log('✅ Account deleted for:', user.email);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
