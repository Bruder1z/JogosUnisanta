const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ── GET /leagues ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('leagues').select('*');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ── GET /leagues/:id ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Liga não encontrada' });
  return res.json(data);
});

// ── POST /leagues ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

  const creator = req.user.email.toLowerCase();

  // Verifica limite de 5 ligas
  const { data: allLeagues } = await supabase.from('leagues').select('id, participants');
  if (allLeagues) {
    const count = allLeagues.filter((l) => {
      const parts = Array.isArray(l.participants)
        ? l.participants
        : typeof l.participants === 'string'
          ? (() => { try { return JSON.parse(l.participants); } catch { return l.participants.split(',').map((p) => p.trim()); } })()
          : [];
      return parts.some((p) => p.toLowerCase() === creator);
    }).length;

    const automaticCount = 1 + (req.user.preferredCourse ? 1 : 0);
    if (count + automaticCount >= 5) {
      return res.status(409).json({ error: 'Limite de 5 ligas atingido' });
    }
  }

  const { data, error } = await supabase
    .from('leagues')
    .insert([{ name: name.trim(), description: description?.trim() || '', owner_email: creator, participants: [creator] }])
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// ── PUT /leagues/:id ──────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { name, description, participants } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (participants !== undefined) updates.participants = participants;

  const { error } = await supabase.from('leagues').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── DELETE /leagues/:id ───────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  // Remove requests first (FK)
  await supabase.from('league_requests').delete().eq('league_id', req.params.id);
  const { error, count } = await supabase
    .from('leagues')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(403).json({ error: 'Sem permissão para excluir esta liga' });
  return res.json({ success: true });
});

// ── POST /leagues/:id/join ────────────────────────────────────────────────────
router.post('/:id/join', requireAuth, async (req, res) => {
  const userEmail = req.user.email.toLowerCase();

  // Verifica limite
  const { data: allLeagues } = await supabase.from('leagues').select('id, participants');
  if (allLeagues) {
    const count = allLeagues.filter((l) => {
      const parts = Array.isArray(l.participants)
        ? l.participants
        : typeof l.participants === 'string'
          ? (() => { try { return JSON.parse(l.participants); } catch { return l.participants.split(',').map((p) => p.trim()); } })()
          : [];
      return parts.some((p) => p.toLowerCase() === userEmail);
    }).length;
    const automaticCount = 1 + (req.user.preferredCourse ? 1 : 0);
    if (count + automaticCount >= 5) {
      return res.status(409).json({ error: 'Limite de 5 ligas atingido' });
    }
  }

  // Busca liga
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (leagueErr || !league) return res.status(404).json({ error: 'Liga não encontrada' });

  let currentParticipants = [];
  if (Array.isArray(league.participants)) {
    currentParticipants = league.participants;
  } else if (typeof league.participants === 'string' && league.participants) {
    try { currentParticipants = JSON.parse(league.participants); }
    catch { currentParticipants = league.participants.split(',').map((p) => p.trim()); }
  }

  if (currentParticipants.some((p) => p.toLowerCase() === userEmail)) {
    return res.json({ success: true, alreadyMember: true });
  }

  const updatedParticipants = Array.from(new Set([...currentParticipants, userEmail]));
  const { data, error } = await supabase
    .from('leagues')
    .update({ participants: updatedParticipants })
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json({ error: error.message, code: error.code });
  return res.json({ success: true, league: data?.[0] });
});

// ── GET /leagues/:id/ranking ──────────────────────────────────────────────────
router.get('/:id/ranking', async (req, res) => {
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (leagueErr || !league) return res.status(404).json({ error: 'Liga não encontrada' });

  // Busca usuários conforme tipo da liga
  let usersQuery = supabase.from('users').select('email, name, surname, preferredcourse, role');
  if (league.type === 'course') {
    usersQuery = usersQuery.eq('preferredcourse', league.course);
  } else if (league.type !== 'global') {
    usersQuery = usersQuery.in('email', league.participants || []);
  }

  const { data: usersData } = await usersQuery;
  const { data: predsData } = await supabase.from('predictions').select('*');
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, score_a, score_b, status')
    .eq('status', 'finished');

  const finishedMatches = matchesData || [];
  const validPreds = predsData || [];
  const scores = {};

  (usersData || []).forEach((u) => {
    const isSuperAdmin = u.role === 'superadmin' || u.role === 'admin';
    scores[u.email] = {
      email: u.email,
      name: isSuperAdmin ? 'Mestre' : `${u.name} ${u.surname || ''}`.trim(),
      course: u.preferredcourse,
      points: 0,
      exactMatches: 0,
      winnerMatches: 0,
    };
  });

  validPreds.forEach((pred) => {
    const match = finishedMatches.find((m) => m.id === pred.match_id);
    if (match && scores[pred.user_email]) {
      const predA = Number(pred.score_a);
      const predB = Number(pred.score_b);
      const actualA = match.score_a;
      const actualB = match.score_b;
      const isExact = predA === actualA && predB === actualB;
      const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
      const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';
      if (isExact) { scores[pred.user_email].points += 3; scores[pred.user_email].exactMatches += 1; }
      else if (predWinner === actualWinner) { scores[pred.user_email].points += 1; scores[pred.user_email].winnerMatches += 1; }
    }
  });

  const sorted = Object.values(scores).sort((a, b) => b.points - a.points);
  return res.json(sorted);
});

// ── GET /leagues/bolao/ranking ────────────────────────────────────────────────
router.get('/bolao/ranking', async (req, res) => {
  const { data: usersData } = await supabase
    .from('users')
    .select('email, name, surname, preferredcourse, role');
  const { data: predsData } = await supabase.from('predictions').select('*');
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, score_a, score_b, status')
    .eq('status', 'finished');

  const finishedMatches = matchesData || [];
  const validUsers = (usersData || []).filter((u) => u.role !== 'superadmin');
  const userScores = {};

  validUsers.forEach((u) => {
    const isSuperAdmin = u.role === 'admin';
    userScores[u.email] = {
      email: u.email,
      name: isSuperAdmin ? 'Mestre' : (u.name || u.email),
      surname: isSuperAdmin ? '' : u.surname,
      preferredCourse: u.preferredcourse,
      points: 0,
      exactMatches: 0,
      winnerMatches: 0,
    };
  });

  (predsData || []).forEach((pred) => {
    const match = finishedMatches.find((m) => m.id === pred.match_id);
    if (match && userScores[pred.user_email]) {
      const predA = Number(pred.score_a);
      const predB = Number(pred.score_b);
      const actualA = match.score_a;
      const actualB = match.score_b;
      const isExact = predA === actualA && predB === actualB;
      const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
      const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';
      if (isExact) { userScores[pred.user_email].points += 3; userScores[pred.user_email].exactMatches += 1; }
      else if (predWinner === actualWinner) { userScores[pred.user_email].points += 1; userScores[pred.user_email].winnerMatches += 1; }
    }
  });

  const sorted = Object.values(userScores).sort((a, b) => b.points - a.points);
  return res.json(sorted);
});

// ── GET /leagues/bolao/user-predictions/:email ────────────────────────────────
router.get('/bolao/user-predictions/:email', async (req, res) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_email', req.params.email);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// ── GET /leagues/:id/requests ─────────────────────────────────────────────────
router.get('/:id/requests', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('league_requests')
    .select('*')
    .eq('league_id', req.params.id)
    .eq('status', 'pending');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// ── POST /leagues/:id/requests ────────────────────────────────────────────────
router.post('/:id/requests', requireAuth, async (req, res) => {
  const { user_name } = req.body;
  const { error } = await supabase.from('league_requests').insert([{
    league_id: req.params.id,
    user_email: req.user.email.toLowerCase(),
    user_name: user_name || req.user.name || req.user.email,
    status: 'pending',
  }]);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ success: true });
});

// ── PUT /leagues/requests/:requestId ─────────────────────────────────────────
router.put('/requests/:requestId', requireAuth, async (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  if (status === 'approved') {
    // Busca o request para pegar league_id e user_email
    const { data: reqData } = await supabase
      .from('league_requests')
      .select('*')
      .eq('id', req.params.requestId)
      .single();

    if (reqData) {
      const { data: league } = await supabase
        .from('leagues')
        .select('participants')
        .eq('id', reqData.league_id)
        .single();

      if (league) {
        const current = Array.isArray(league.participants) ? league.participants : [];
        const updated = Array.from(new Set([...current, reqData.user_email]));
        await supabase.from('leagues').update({ participants: updated }).eq('id', reqData.league_id);
      }
    }
  }

  const { error } = await supabase
    .from('league_requests')
    .update({ status })
    .eq('id', req.params.requestId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── GET /leagues/user/my-requests ─────────────────────────────────────────────
router.get('/user/my-requests', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('league_requests')
    .select('*')
    .eq('user_email', req.user.email.toLowerCase());
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

module.exports = router;
