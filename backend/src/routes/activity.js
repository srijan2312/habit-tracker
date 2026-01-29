import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  req.token = token;
  next();
};

// Log activity helper
export const logActivity = async (userId, habitId, action, habitName, details = {}) => {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId,
      habit_id: habitId,
      action,
      habit_name: habitName,
      details,
    });
  } catch (err) {
    console.error('❌ Failed to log activity:', err);
  }
};

// Get activity log for user
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 50, offset = 0, action } = req.query;
    const safeLimit = Number.parseInt(String(limit), 10) || 50;
    const safeOffset = Number.parseInt(String(offset), 10) || 0;

    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Get activity log error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Retrieved ${data.length} activity logs for user`);
    res.json({ activities: data, total: count });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Count by action type
    const { data: actionCounts, error: actionError } = await supabase
      .from('activity_log')
      .select('action, count(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .group_by('action');

    if (actionError) throw actionError;

    // Count today's activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayCount, error: todayError } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .select('id');

    if (todayError) throw todayError;

    console.log('✅ Activity stats retrieved');
    res.json({
      stats: {
        actionCounts: actionCounts || [],
        activitiesThisWeek: todayCount.length,
        lastActivityDate: actionCounts?.[0]?.created_at,
      },
    });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export activity log as CSV
router.get('/export/csv', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert to CSV
    const headers = ['Date', 'Habit', 'Action', 'Details'];
    const rows = data.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.habit_name || 'N/A',
      log.action,
      log.details ? JSON.stringify(log.details) : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=habit-activity.csv');
    res.send(csv);

    console.log('✅ Activity log exported as CSV');
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export activity log as JSON
router.get('/export/json', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=habit-activity.json');
    res.json({ activities: data, exportedAt: new Date().toISOString() });

    console.log('✅ Activity log exported as JSON');
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
