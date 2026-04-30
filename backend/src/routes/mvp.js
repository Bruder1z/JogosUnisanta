const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAuth } = require('../middleware/auth');

// ── GET /mvp/candidates ───────────────────────────────────────────────────────
router.get('/candidates', async (req, res) => {
  const { data, error } = await supabase
    .from('match_mvp_candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MVP] Erro ao buscar candidatos:', error);
    return res.status(500).json({ error: 'Erro ao buscar candidatos MVP' });
  }

  const candidates = data.map((row) => ({
    id: row.id,
    matchId: row.match_id,
    sport: row.sport,
    playerName: row.player_name,
    teamId: row.team_id,
    teamName: row.team_name,
    institution: row.institution,
    course: row.course,
    points: row.points || 0,
    votes: row.votes || 0,
  }));

  return res.json(candidates);
});

// ── GET /mvp/candidates/:matchId ──────────────────────────────────────────────
router.get('/candidates/:matchId', async (req, res) => {
  const { data, error } = await supabase
    .from('match_mvp_candidates')
    .select('*')
    .eq('match_id', req.params.matchId);

  if (error) {
    console.error('[MVP] Erro ao buscar candidatos da partida:', error);
    return res.status(500).json({ error: 'Erro ao buscar candidatos MVP' });
  }

  const candidates = data.map((row) => ({
    id: row.id,
    matchId: row.match_id,
    sport: row.sport,
    playerName: row.player_name,
    teamId: row.team_id,
    teamName: row.team_name,
    institution: row.institution,
    course: row.course,
    points: row.points || 0,
    votes: row.votes || 0,
  }));

  return res.json(candidates);
});

// ── POST /mvp/candidates/ensure ───────────────────────────────────────────────
router.post('/candidates/ensure', requireAuth, (req, res) => {
  const { candidates } = req.body;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: 'Lista de candidatos inválida' });
  }

  publish(QUEUES.MVP_CANDIDATES_ENSURE, { candidates });
  return res.status(202).json({ success: true, message: 'Candidatos sendo sincronizados' });
});

// ── GET /mvp/votes ────────────────────────────────────────────────────────────
router.get('/votes', async (req, res) => {
  const { data, error } = await supabase
    .from('match_mvp_votes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MVP] Erro ao buscar votos:', error);
    return res.status(500).json({ error: 'Erro ao buscar votos MVP' });
  }

  const votes = data.map((row) => ({
    id: row.id,
    matchId: row.match_id,
    candidateId: row.candidate_id,
    voterUserId: row.voter_user_id,
    voterEmail: row.voter_email || null,
  }));

  return res.json(votes);
});

// ── POST /mvp/vote ────────────────────────────────────────────────────────────
router.post('/vote', requireAuth, async (req, res) => {
  const { candidateId, currentVotes, matchId } = req.body;
  const voterUserId = String(req.user.id);
  const voterEmail = req.user.email || null;

  if (!candidateId || !matchId) {
    return res.status(400).json({ error: 'candidateId e matchId são obrigatórios' });
  }

  // Verifica se já votou (leitura síncrona para evitar duplicatas)
  const { data: existingVote } = await supabase
    .from('match_mvp_votes')
    .select('id')
    .eq('match_id', matchId)
    .eq('voter_user_id', voterUserId)
    .maybeSingle();

  if (existingVote) {
    return res.status(409).json({ success: false, reason: 'already-voted' });
  }

  // Insere o voto de forma síncrona para garantir unicidade
  const { data: voteInsert, error: voteError } = await supabase
    .from('match_mvp_votes')
    .insert([
      {
        match_id: matchId,
        candidate_id: candidateId,
        voter_user_id: voterUserId,
        voter_email: voterEmail,
      },
    ])
    .select('*')
    .single();

  if (voteError) {
    const isDuplicate =
      voteError.code === '23505' ||
      voteError.message.toLowerCase().includes('duplicate');

    if (isDuplicate) {
      return res.status(409).json({ success: false, reason: 'already-voted' });
    }

    console.error('[MVP] Erro ao inserir voto:', voteError);
    return res.status(500).json({ success: false, reason: 'error' });
  }

  // Atualiza contagem de votos via fila (fire-and-forget)
  const nextVotes = (currentVotes || 0) + 1;
  publish(QUEUES.MVP_VOTE, { candidateId, nextVotes });

  return res.json({
    success: true,
    vote: {
      id: voteInsert.id,
      matchId: voteInsert.match_id,
      candidateId: voteInsert.candidate_id,
      voterUserId: voteInsert.voter_user_id,
      voterEmail: voteInsert.voter_email || null,
    },
  });
});

module.exports = router;
