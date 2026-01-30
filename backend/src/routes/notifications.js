import express from 'express';
import { sendDailyReminders, sendWeeklyDigest } from '../jobs/notifications.js';

const router = express.Router();

// Test endpoint to manually trigger daily reminders
router.post('/test/daily-reminders', async (req, res) => {
  try {
    console.log('🔔 Manual trigger: Sending daily reminders...');
    await sendDailyReminders();
    res.json({ 
      success: true, 
      message: 'Daily reminders sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error sending daily reminders:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint to manually trigger weekly digest
router.post('/test/weekly-digest', async (req, res) => {
  try {
    console.log('📊 Manual trigger: Sending weekly digest...');
    await sendWeeklyDigest();
    res.json({ 
      success: true, 
      message: 'Weekly digest sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error sending weekly digest:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
