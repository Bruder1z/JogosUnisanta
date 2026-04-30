require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connect } = require('./config/rabbitmq');

// Rotas
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const courseRoutes = require('./routes/courses');
const athleteRoutes = require('./routes/athletes');
const rankingRoutes = require('./routes/ranking');
const predictionsRoutes = require('./routes/predictions');
const featuredAthletesRoutes = require('./routes/featuredAthletes');
const mvpRoutes = require('./routes/mvp');
const torcidaRoutes = require('./routes/torcida');
const adminRoutes = require('./routes/admin');
const leaguesRoutes = require('./routes/leagues');
const forgotPasswordRoutes = require('./routes/forgotPassword');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Segurança ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use(limiter);

// Rate limiting mais restrito para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 200,
  message: { error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.' },
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'jogosunisanta-backend',
  });
});

// ── Rotas ─────────────────────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes);
app.use('/auth', forgotPasswordRoutes);
app.use('/matches', matchRoutes);
app.use('/courses', courseRoutes);
app.use('/athletes', athleteRoutes);
app.use('/ranking', rankingRoutes);
app.use('/predictions', predictionsRoutes);
app.use('/featured-athletes', featuredAthletesRoutes);
app.use('/mvp', mvpRoutes);
app.use('/torcida', torcidaRoutes);
app.use('/admin', adminRoutes);
app.use('/leagues', leaguesRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server] Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ── Inicialização ─────────────────────────────────────────────────────────────
async function start() {
  try {
    console.log('[Server] Conectando ao RabbitMQ...');
    await connect();
    console.log('[Server] RabbitMQ conectado');

    // Inicia os workers no mesmo processo (alternativa: rodar separado com npm run worker)
    require('./workers/authWorker').startAuthWorker();
    require('./workers/matchWorker').startMatchWorker();
    require('./workers/courseWorker').startCourseWorker();
    require('./workers/athleteWorker').startAthleteWorker();
    require('./workers/mvpWorker').startMvpWorker();
    require('./workers/torcidaWorker').startTorcidaWorker();
    require('./workers/predictionsWorker').startPredictionsWorker();

    app.listen(PORT, () => {
      console.log(`[Server] Rodando em http://localhost:${PORT}`);
      console.log(`[Server] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
