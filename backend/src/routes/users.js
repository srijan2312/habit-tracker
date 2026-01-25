
import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResetEmail } from '../utils/sendgrid.js';

// Forgot Password (SendGrid)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No user with that email' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

// Forgot Password endpoint removed (no email sending)

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});


// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
