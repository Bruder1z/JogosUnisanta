const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAdmin } = require('../middleware/auth');

// ── GET /courses ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*');

  if (error) {
    console.error('[Courses] Erro ao buscar cursos:', error);
    return res.status(500).json({ error: 'Erro ao buscar cursos' });
  }

  return res.json(data);
});

// ── POST /courses ─────────────────────────────────────────────────────────────
router.post('/', requireAdmin, (req, res) => {
  const { id, name, university, emblem_url } = req.body;

  if (!name || !university) {
    return res.status(400).json({ error: 'Nome e universidade são obrigatórios' });
  }

  publish(QUEUES.COURSE_CREATE, { id, name, university, emblem_url });
  return res.status(202).json({ success: true, message: 'Curso sendo criado' });
});

// ── DELETE /courses ───────────────────────────────────────────────────────────
router.delete('/', requireAdmin, (req, res) => {
  const { name, university } = req.body;

  if (!name || !university) {
    return res.status(400).json({ error: 'Nome e universidade são obrigatórios' });
  }

  publish(QUEUES.COURSE_DELETE, { name, university });
  return res.status(202).json({ success: true, message: 'Curso sendo removido' });
});

module.exports = router;
