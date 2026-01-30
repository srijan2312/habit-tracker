import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

// Middleware to verify token and extract user ID
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.error('❌ No token provided');
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    // Create a temporary Supabase client with the user's access token
    const tempClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the token by calling getUser() which uses the token from headers
    const { data: { user }, error } = await tempClient.auth.getUser();
    
    if (error || !user) {
      console.error('❌ Token verification failed:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('✅ Token verified for user:', user.id);
    req.userId = user.id;
    req.userEmail = user.email;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Token verification exception:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
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
