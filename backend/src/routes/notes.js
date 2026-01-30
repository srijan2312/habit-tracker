import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  req.token = token;
  next();
};

// Get all notes for a habit
router.get('/habit/:habitId', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { habitId } = req.params;

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Get notes error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Retrieved ${data.length} notes for habit ${habitId}`);
    res.json({ notes: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add or update note for a specific date
router.post('/habit/:habitId/add', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { habitId } = req.params;
    const { completedDate, note } = req.body;

    if (!completedDate) {
      return res.status(400).json({ error: 'Completed date is required' });
    }

    // First, check if a log exists for this date
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('date', completedDate)
      .single();

    let result;
    if (existingLog) {
      // Update existing log with note
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ note: note || '', updated_at: new Date().toISOString() })
        .eq('id', existingLog.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new log
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          date: completedDate,
          completed: true,
          note: note || '',
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log(`✅ Note added for habit ${habitId} on ${completedDate}`);
    res.json({ log: result });
  } catch (err) {
    console.error('❌ Add note error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update note
router.put('/:logId', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { logId } = req.params;
    const { note } = req.body;

    const { data, error } = await supabase
      .from('habit_logs')
      .update({ note, updated_at: new Date().toISOString() })
      .eq('id', logId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update note error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Note updated: ${logId}`);
    res.json({ log: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
router.delete('/:logId', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { logId } = req.params;

    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Delete note error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Note deleted: ${logId}`);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent notes (across all habits)
router.get('/recent/all', verifyToken, async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 10 } = req.query;
    const safeLimit = Number.parseInt(String(limit), 10) || 10;

    const { data, error } = await supabase
      .from('habit_logs')
      .select(`
        *,
        habits:habit_id(title)
      `)
      .eq('user_id', user.id)
      .not('note', 'is', null)
      .neq('note', '')
      .gte('date', '2020-01-01') // Filter out invalid dates
      .order('date', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('❌ Get recent notes error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Retrieved ${data.length} recent notes`);
    res.json({ notes: data });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
