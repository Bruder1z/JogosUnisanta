const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAdmin } = require('../middleware/auth');

// ── GET /athletes ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('athletes').select('*');

  if (error) {
    console.error('[Athletes] Erro ao buscar atletas:', error);
    return res.status(500).json({ error: 'Erro ao buscar atletas' });
  }

  const athletes = data.map((a) => ({
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    institution: a.institution,
    course: a.course,
    sports: a.sports,
    sex: a.sex,
  }));

  return res.json(athletes);
});

// ── POST /athletes ────────────────────────────────────────────────────────────
router.post('/', requireAdmin, (req, res) => {
  const { id, firstName, lastName, institution, course, sports, sex } = req.body;

  if (!firstName || !lastName || !institution || !course) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  publish(QUEUES.ATHLETE_CREATE, { id, firstName, lastName, institution, course, sports, sex });
  return res.status(202).json({ success: true, message: 'Atleta sendo criado' });
});

// ── DELETE /athletes/:id ──────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  publish(QUEUES.ATHLETE_DELETE, { id: req.params.id });
  return res.status(202).json({ success: true, message: 'Atleta sendo removido' });
});

module.exports = router;
