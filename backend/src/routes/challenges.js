import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const buildChallengeResponse = (challengeRows = [], participantRows = []) => {
  const participantsByChallenge = participantRows.reduce((acc, row) => {
    const key = row.challenge_id;
    acc[key] = acc[key] || [];
    acc[key].push({
      id: row.id,
      userId: row.user_id,
      name: row.display_name,
      score: row.score || 0,
      updatedAt: row.updated_at,
    });
    return acc;
  }, {});

  return challengeRows.map((ch) => ({
    id: ch.id,
    code: ch.code,
    name: ch.name,
    status: ch.status,
    createdAt: ch.created_at,
    ownerId: ch.owner_id,
    participants: participantsByChallenge[ch.id] || [],
  }));
};

router.get('/', verifyToken, async (req, res) => {
  const userId = req.userId; // Get from verified token

  try {
    const { data: memberRows, error: memberErr } = await supabase
      .from('friend_challenge_participants')
      .select('challenge_id')
      .eq('user_id', userId);

    if (memberErr) throw memberErr;
    if (!memberRows || memberRows.length === 0) {
      return res.json({ challenges: [] });
    }

    const challengeIds = Array.from(new Set(memberRows.map((r) => r.challenge_id)));

    const { data: challengeRows, error: challengeErr } = await supabase
      .from('friend_challenges')
      .select('*')
      .in('id', challengeIds);
    if (challengeErr) throw challengeErr;

    const { data: participantRows, error: partErr } = await supabase
      .from('friend_challenge_participants')
      .select('*')
      .in('challenge_id', challengeIds);
    if (partErr) throw partErr;

    return res.json({ challenges: buildChallengeResponse(challengeRows, participantRows) });
  } catch (error) {
    console.error('Error fetching challenges', error);
    return res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { userName, name } = req.body || {};
  const userId = req.userId; // Get from verified token

  const now = new Date().toISOString();
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();

  try {
    const { data: challengeRow, error: challengeErr } = await supabase
      .from('friend_challenges')
      .insert([
        {
          code,
          name: name || 'New Challenge',
          status: 'active',
          owner_id: userId,
          created_at: now,
        },
      ])
      .select('*')
      .single();

    if (challengeErr) throw challengeErr;

    const { data: participantRow, error: participantErr } = await supabase
      .from('friend_challenge_participants')
      .insert([
        {
          challenge_id: challengeRow.id,
          user_id: userId,
          display_name: userName || 'You',
          score: 0,
          updated_at: now,
        },
      ])
      .select('*')
      .single();

    if (participantErr) throw participantErr;

    const challenge = buildChallengeResponse([challengeRow], [participantRow])[0];
    return res.status(201).json({ challenge });
  } catch (error) {
    console.error('Error creating challenge', error);
    return res.status(500).json({ error: 'Failed to create challenge' });
  }
});

router.post('/join', verifyToken, async (req, res) => {
  const { code, userName } = req.body || {};
  const userId = req.userId; // Get from verified token
  
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const { data: challengeRow, error: findErr } = await supabase
      .from('friend_challenges')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (findErr || !challengeRow) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const { data: existingParticipant, error: existingErr } = await supabase
      .from('friend_challenge_participants')
      .select('*')
      .eq('challenge_id', challengeRow.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (!existingParticipant) {
      const { error: insertErr } = await supabase
        .from('friend_challenge_participants')
        .insert([
          {
            challenge_id: challengeRow.id,
            user_id: userId,
            display_name: userName || 'Friend',
            score: 0,
            updated_at: new Date().toISOString(),
          },
        ]);
      if (insertErr) throw insertErr;
    }

    const { data: participants, error: partErr } = await supabase
      .from('friend_challenge_participants')
      .select('*')
      .eq('challenge_id', challengeRow.id);
    if (partErr) throw partErr;

    const challenge = buildChallengeResponse([challengeRow], participants)[0];
    return res.json({ challenge });
  } catch (error) {
    console.error('Error joining challenge', error);
    return res.status(500).json({ error: 'Failed to join challenge' });
  }
});

router.post('/increment-score', verifyToken, async (req, res) => {
  const userId = req.userId; // Get from verified token

  try {
    const { data: participants, error: findErr } = await supabase
      .from('friend_challenge_participants')
      .select('*')
      .eq('user_id', userId);

    if (findErr) throw findErr;
    if (!participants || participants.length === 0) {
      return res.json({ updated: 0 });
    }

    const now = new Date().toISOString();
    const updatePromises = participants.map((p) =>
      supabase
        .from('friend_challenge_participants')
        .update({ score: (p.score || 0) + 1, updated_at: now })
        .eq('id', p.id)
    );

    await Promise.all(updatePromises);
    return res.json({ updated: participants.length });
  } catch (error) {
    console.error('Error incrementing challenge score', error);
    return res.status(500).json({ error: 'Failed to increment score' });
  }
});

router.delete('/:challengeId', verifyToken, async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.userId; // Get from verified token

  if (!challengeId) {
    return res.status(400).json({ error: 'challengeId is required' });
  }

  try {
    const { data: challenge, error: findErr } = await supabase
      .from('friend_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (findErr || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the challenge owner can delete it' });
    }

    const { error: deleteErr } = await supabase
      .from('friend_challenges')
      .delete()
      .eq('id', challengeId);

    if (deleteErr) throw deleteErr;

    return res.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    console.error('Error deleting challenge', error);
    return res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

export default router;
