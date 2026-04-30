const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAdmin } = require('../middleware/auth');

// ── GET /ranking ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('ranking').select('*');

  if (error) {
    console.error('[Ranking] Erro ao buscar ranking:', error);
    return res.status(500).json({ error: 'Erro ao buscar ranking' });
  }

  return res.json(data);
});

// ── PUT /ranking/:course ──────────────────────────────────────────────────────
router.put('/:course', requireAdmin, (req, res) => {
  const { points } = req.body;
  const course = decodeURIComponent(req.params.course);

  if (points === undefined || points === null) {
    return res.status(400).json({ error: 'Pontos são obrigatórios' });
  }

  publish(QUEUES.RANKING_UPDATE, { course, points });
  return res.status(202).json({ success: true, message: 'Ranking sendo atualizado' });
});

// ── POST /ranking/reset ───────────────────────────────────────────────────────
router.post('/reset', requireAdmin, (req, res) => {
  publish(QUEUES.RANKING_RESET, {});
  return res.status(202).json({ success: true, message: 'Ranking sendo zerado' });
});

// ── POST /ranking/restore ─────────────────────────────────────────────────────
router.post('/restore', requireAdmin, (req, res) => {
  publish(QUEUES.RANKING_RESTORE, {});
  return res.status(202).json({ success: true, message: 'Ranking oficial sendo restaurado' });
});

module.exports = router;
