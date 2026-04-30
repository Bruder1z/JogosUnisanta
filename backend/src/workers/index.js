require('dotenv').config();
const { connect } = require('../config/rabbitmq');
const { startAuthWorker } = require('./authWorker');
const { startMatchWorker } = require('./matchWorker');
const { startCourseWorker } = require('./courseWorker');
const { startAthleteWorker } = require('./athleteWorker');
const { startMvpWorker } = require('./mvpWorker');
const { startTorcidaWorker } = require('./torcidaWorker');
const { startPredictionsWorker } = require('./predictionsWorker');

async function startAllWorkers() {
  console.log('[Workers] Conectando ao RabbitMQ...');
  await connect();

  startAuthWorker();
  startMatchWorker();
  startCourseWorker();
  startAthleteWorker();
  startMvpWorker();
  startTorcidaWorker();
  startPredictionsWorker();

  console.log('[Workers] Todos os workers iniciados e aguardando mensagens');
}

startAllWorkers().catch((err) => {
  console.error('[Workers] Falha ao iniciar workers:', err.message);
  process.exit(1);
});
