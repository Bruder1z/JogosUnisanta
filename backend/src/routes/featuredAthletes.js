const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAdmin } = require('../middleware/auth');

// ── GET /featured-athletes ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('featured_athletes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FeaturedAthletes] Erro ao buscar atletas em destaque:', error);
    return res.status(500).json({ error: 'Erro ao buscar atletas em destaque' });
  }

  return res.json(data);
});

// ── POST /featured-athletes ───────────────────────────────────────────────────
router.post('/', requireAdmin, (req, res) => {
  const { id, name, institution, course, sport, reason } = req.body;

  if (!name || !institution || !course || !sport) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  publish(QUEUES.FEATURED_ATHLETE_CREATE, { id, name, institution, course, sport, reason });
  return res.status(202).json({ success: true, message: 'Atleta em destaque sendo criado' });
});

// ── DELETE /featured-athletes/:id ─────────────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  publish(QUEUES.FEATURED_ATHLETE_DELETE, { id: req.params.id });
  return res.status(202).json({ success: true, message: 'Atleta em destaque sendo removido' });
});

module.exports = router;
