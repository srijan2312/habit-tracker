import express from 'express';
import { sendFeedbackEmail } from '../utils/mailer.js';

const router = express.Router();

// POST /api/feedback
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    await sendFeedbackEmail({ name, email, message });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send feedback.' });
  }
});

export default router;