const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');

const TOKEN_EXPIRY_MINUTES = 15;
const generateResetToken = () => String(Math.floor(10000 + Math.random() * 90000));

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(404).json({ error: 'E-mail não encontrado' });

  const resetToken = generateResetToken();

  const { error: updateError } = await supabase
    .from('users')
    .update({ resettoken: resetToken })
    .eq('email', email);

  if (updateError) return res.status(500).json({ error: 'Erro ao gerar código' });

  // Envia email via fila
  publish(QUEUES.USER_REGISTER, {
    email,
    loginToken: resetToken,
    expiryMinutes: TOKEN_EXPIRY_MINUTES,
    templateId: 'template_lg0yza4',
    templateParams: { email, code: resetToken },
  });

  return res.json({ success: true });
});

// ── POST /auth/verify-reset-code ──────────────────────────────────────────────
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email e código são obrigatórios' });

  const { data: user, error } = await supabase
    .from('users')
    .select('resettoken')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.resettoken !== code) return res.status(400).json({ error: 'Código inválido' });

  return res.json({ success: true });
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  // Verifica código novamente
  const { data: user, error } = await supabase
    .from('users')
    .select('resettoken')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.resettoken !== code) return res.status(400).json({ error: 'Código inválido' });

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword, resettoken: null })
    .eq('email', email);

  if (updateError) return res.status(500).json({ error: 'Erro ao redefinir senha' });

  return res.json({ success: true });
});

module.exports = router;
