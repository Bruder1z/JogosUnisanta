const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireSuperAdmin } = require('../middleware/auth');

// ── GET /admin/users ──────────────────────────────────────────────────────────
router.get('/users', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, surname, email, role')
    .in('role', ['admin', 'superadmin']);

  if (error) {
    console.error('[Admin] Erro ao buscar admins:', error);
    return res.status(500).json({ error: 'Erro ao buscar administradores' });
  }

  return res.json(data);
});

// ── POST /admin/promote ───────────────────────────────────────────────────────
router.post('/promote', requireSuperAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Usuário não encontrado' });

  publish(QUEUES.USER_PROMOTE, { userId: data.id });
  return res.status(202).json({ success: true, message: 'Usuário sendo promovido a admin' });
});

// ── POST /admin/demote/:id ────────────────────────────────────────────────────
router.post('/demote/:id', requireSuperAdmin, (req, res) => {
  publish(QUEUES.USER_DEMOTE, { id: req.params.id });
  return res.status(202).json({ success: true, message: 'Admin sendo rebaixado' });
});

module.exports = router;
