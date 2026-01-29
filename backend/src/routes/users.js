import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendResetEmail } from '../utils/sendgrid.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('users')
      .insert([{ email, password: hashedPassword, name: fullName }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Token expires in 1 hour for security
    const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: data.id, name: data.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      // Avoid user enumeration
      return res.json({ message: 'Password reset email sent' });
    }
    
    const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await sendResetEmail({
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
    });
    
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const db = supabaseAdmin || supabase;
    const { error } = await db
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', decoded.userId);
    
    if (error) throw error;
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

export default router;
