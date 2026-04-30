const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { generateToken, requireAuth } = require('../middleware/auth');

const TOKEN_EXPIRY_MINUTES = 15;
const generateConfirmToken = () => String(Math.floor(10000 + Math.random() * 90000));
const tokenExpiresAt = () =>
  new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(401).json({ status: 'invalid' });
  if (!data.password) return res.status(401).json({ status: 'invalid' });

  const isValid = await bcrypt.compare(password, data.password);
  if (!isValid) return res.status(401).json({ status: 'invalid' });

  if (data.logintoken) return res.status(403).json({ status: 'unconfirmed' });

  const user = {
    id: data.id,
    email: data.email,
    name: data.name,
    surname: data.surname,
    preferredCourse: data.preferredcourse,
    favoriteTeam: data.favoriteteam,
    role: data.role,
  };

  const token = generateToken(user);
  return res.json({ status: 'ok', user, token });
});

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, name, surname, preferredCourse, favoriteTeam, password } = req.body;

  if (!email || !name || !surname || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  // Verifica se email já existe
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const loginToken = generateConfirmToken();

  const { error } = await supabase.from('users').insert([
    {
      email,
      name,
      surname,
      preferredcourse: preferredCourse,
      favoriteteam: favoriteTeam,
      password: hash,
      role: 'cliente',
      logintoken: loginToken,
      logintoken_expires_at: tokenExpiresAt(),
    },
  ]);

  if (error) {
    console.error('[Auth] Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'Erro ao criar conta' });
  }

  // Publica na fila para envio de email de confirmação (fire-and-forget)
  publish(QUEUES.USER_REGISTER, {
    email,
    loginToken,
    expiryMinutes: TOKEN_EXPIRY_MINUTES,
  });

  return res.status(201).json({ success: true, pendingEmail: email });
});

// ── POST /auth/confirm-email ──────────────────────────────────────────────────
router.post('/confirm-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email e código são obrigatórios' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('logintoken, logintoken_expires_at')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(404).json({ success: false });
  if (data.logintoken !== code) return res.status(400).json({ success: false, reason: 'invalid_code' });
  if (!data.logintoken_expires_at || new Date() > new Date(data.logintoken_expires_at)) {
    return res.status(400).json({ success: false, reason: 'expired' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ logintoken: null })
    .eq('email', email);

  if (updateError) return res.status(500).json({ success: false });

  const { data: fullUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError || !fullUser) return res.status(500).json({ success: false });

  const user = {
    id: fullUser.id,
    email: fullUser.email,
    name: fullUser.name,
    surname: fullUser.surname,
    preferredCourse: fullUser.preferredcourse,
    favoriteTeam: fullUser.favoriteteam,
    role: fullUser.role,
  };

  const token = generateToken(user);
  return res.json({ success: true, user, token });
});

// ── POST /auth/resend-confirmation ────────────────────────────────────────────
router.post('/resend-confirmation', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const { data, error } = await supabase
    .from('users')
    .select('logintoken')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(404).json({ success: false });
  if (!data.logintoken) return res.status(400).json({ success: false, reason: 'already_confirmed' });

  const newToken = generateConfirmToken();

  const { error: updateError } = await supabase
    .from('users')
    .update({ logintoken: newToken, logintoken_expires_at: tokenExpiresAt() })
    .eq('email', email);

  if (updateError) return res.status(500).json({ success: false });

  // Publica na fila para envio de email
  publish(QUEUES.USER_RESEND_CONFIRMATION, {
    email,
    loginToken: newToken,
    expiryMinutes: TOKEN_EXPIRY_MINUTES,
  });

  return res.json({ success: true });
});

// ── PUT /auth/profile ─────────────────────────────────────────────────────────
router.put('/profile', requireAuth, async (req, res) => {
  const { name, preferredCourse, favoriteTeam } = req.body;
  const email = req.user.email;

  const dbUpdates = {};
  if (name !== undefined) dbUpdates.name = name;
  if (preferredCourse !== undefined) dbUpdates.preferredcourse = preferredCourse;
  if (favoriteTeam !== undefined) dbUpdates.favoriteteam = favoriteTeam;

  if (Object.keys(dbUpdates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }

  // Publica na fila (operação de escrita assíncrona)
  publish(QUEUES.USER_UPDATE, { email, updates: dbUpdates });

  return res.json({ success: true });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, surname, preferredcourse, favoriteteam, role')
    .eq('email', req.user.email)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Usuário não encontrado' });

  return res.json({
    id: data.id,
    email: data.email,
    name: data.name,
    surname: data.surname,
    preferredCourse: data.preferredcourse,
    favoriteTeam: data.favoriteteam,
    role: data.role,
  });
});

module.exports = router;
