const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAuth } = require('../middleware/auth');

// ── GET /predictions ──────────────────────────────────────────────────────────
// Retorna as previsões do usuário autenticado
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_email', req.user.email);

  if (error) {
    console.error('[Predictions] Erro ao buscar previsões:', error);
    return res.status(500).json({ error: 'Erro ao buscar previsões' });
  }

  const predictions = {};
  (data || []).forEach((p) => {
    predictions[p.match_id] = {
      matchId: p.match_id,
      scoreA: p.score_a,
      scoreB: p.score_b,
    };
  });

  return res.json(predictions);
});

// ── POST /predictions ─────────────────────────────────────────────────────────
// Salva/atualiza previsões do usuário (upsert)
router.post('/', requireAuth, (req, res) => {
  const { predictions } = req.body;

  if (!predictions || typeof predictions !== 'object') {
    return res.status(400).json({ error: 'Previsões inválidas' });
  }

  const rows = Object.values(predictions).map((p) => ({
    user_email: req.user.email,
    match_id: p.matchId,
    score_a: p.scoreA === '' ? 0 : p.scoreA,
    score_b: p.scoreB === '' ? 0 : p.scoreB,
  }));

  if (rows.length === 0) return res.json({ success: true });

  publish(QUEUES.PREDICTIONS_SAVE, { rows });
  return res.status(202).json({ success: true, message: 'Previsões sendo salvas' });
});

module.exports = router;
