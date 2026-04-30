const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAdmin } = require('../middleware/auth');

// ── GET /matches ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Matches] Erro ao buscar partidas:', error);
    return res.status(500).json({ error: 'Erro ao buscar partidas' });
  }

  const matches = data.map((m) => ({
    id: m.id,
    teamA: {
      id: m.team_a_id,
      name: m.team_a_name,
      course: m.team_a_course,
      faculty: m.team_a_faculty,
    },
    teamB: {
      id: m.team_b_id,
      name: m.team_b_name,
      course: m.team_b_course,
      faculty: m.team_b_faculty,
    },
    scoreA: m.score_a,
    scoreB: m.score_b,
    sport: m.sport,
    category: m.category,
    stage: m.stage,
    status: m.status,
    date: m.date,
    time: m.time,
    location: m.location,
    events: m.events || [],
    participants: m.participants || [],
    mvpVotingStartedAt: m.mvp_voting_started_at || null,
  }));

  return res.json(matches);
});

// ── GET /matches/:id ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Partida não encontrada' });

  return res.json({
    id: data.id,
    teamA: {
      id: data.team_a_id,
      name: data.team_a_name,
      course: data.team_a_course,
      faculty: data.team_a_faculty,
    },
    teamB: {
      id: data.team_b_id,
      name: data.team_b_name,
      course: data.team_b_course,
      faculty: data.team_b_faculty,
    },
    scoreA: data.score_a,
    scoreB: data.score_b,
    sport: data.sport,
    category: data.category,
    stage: data.stage,
    status: data.status,
    date: data.date,
    time: data.time,
    location: data.location,
    events: data.events || [],
    participants: data.participants || [],
    mvpVotingStartedAt: data.mvp_voting_started_at || null,
  });
});

// ── POST /matches ─────────────────────────────────────────────────────────────
router.post('/', requireAdmin, (req, res) => {
  const match = req.body;

  if (!match.id || !match.sport || !match.teamA || !match.teamB) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  publish(QUEUES.MATCH_CREATE, match);
  return res.status(202).json({ success: true, message: 'Partida sendo criada' });
});

// ── PUT /matches/:id ──────────────────────────────────────────────────────────
router.put('/:id', requireAdmin, (req, res) => {
  const match = { ...req.body, id: req.params.id };
  publish(QUEUES.MATCH_UPDATE, match);
  return res.status(202).json({ success: true, message: 'Partida sendo atualizada' });
});

// ── DELETE /matches/:id ───────────────────────────────────────────────────────
router.delete('/scheduled', requireAdmin, (req, res) => {
  publish(QUEUES.MATCH_DELETE_SCHEDULED, {});
  return res.status(202).json({ success: true, message: 'Partidas agendadas sendo removidas' });
});

router.delete('/:id', requireAdmin, (req, res) => {
  publish(QUEUES.MATCH_DELETE, { id: req.params.id });
  return res.status(202).json({ success: true, message: 'Partida sendo removida' });
});

module.exports = router;
