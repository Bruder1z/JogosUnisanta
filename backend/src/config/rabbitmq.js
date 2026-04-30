const amqp = require('amqplib');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

// Nomes das filas
const QUEUES = {
  // Auth
  USER_REGISTER: 'user.register',
  USER_UPDATE: 'user.update',
  USER_CONFIRM_EMAIL: 'user.confirm_email',
  USER_RESEND_CONFIRMATION: 'user.resend_confirmation',
  USER_PROMOTE: 'user.promote',
  USER_DEMOTE: 'user.demote',

  // Predictions
  PREDICTIONS_SAVE: 'predictions.save',

  // Matches
  MATCH_CREATE: 'match.create',
  MATCH_UPDATE: 'match.update',
  MATCH_DELETE: 'match.delete',
  MATCH_DELETE_SCHEDULED: 'match.delete_scheduled',

  // Courses
  COURSE_CREATE: 'course.create',
  COURSE_DELETE: 'course.delete',

  // Athletes
  ATHLETE_CREATE: 'athlete.create',
  ATHLETE_DELETE: 'athlete.delete',

  // Ranking
  RANKING_UPDATE: 'ranking.update',
  RANKING_RESET: 'ranking.reset',
  RANKING_RESTORE: 'ranking.restore',

  // Featured Athletes
  FEATURED_ATHLETE_CREATE: 'featured_athlete.create',
  FEATURED_ATHLETE_DELETE: 'featured_athlete.delete',

  // MVP
  MVP_CANDIDATES_ENSURE: 'mvp.candidates.ensure',
  MVP_VOTE: 'mvp.vote',

  // Torcida
  TORCIDA_POST_CREATE: 'torcida.post.create',
  TORCIDA_POST_DELETE: 'torcida.post.delete',
  TORCIDA_COMMENT_CREATE: 'torcida.comment.create',
  TORCIDA_COMMENT_DELETE: 'torcida.comment.delete',
  TORCIDA_LIKE_TOGGLE: 'torcida.like.toggle',
  TORCIDA_NOTIFICATION_INSERT: 'torcida.notification.insert',
};

let connection = null;
let channel = null;

/**
 * Conecta ao RabbitMQ com retry automático
 */
async function connect(retries = 5, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // Declara todas as filas como duráveis
      for (const queue of Object.values(QUEUES)) {
        await channel.assertQueue(queue, { durable: true });
      }

      // Prefetch: processa 1 mensagem por vez por worker
      channel.prefetch(1);

      connection.on('error', (err) => {
        console.error('[RabbitMQ] Erro na conexão:', err.message);
      });

      connection.on('close', () => {
        console.warn('[RabbitMQ] Conexão fechada. Reconectando em 5s...');
        setTimeout(() => connect(), 5000);
      });

      console.log('[RabbitMQ] Conectado com sucesso');
      return { connection, channel };
    } catch (err) {
      console.error(`[RabbitMQ] Tentativa ${attempt}/${retries} falhou:`, err.message);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw new Error('[RabbitMQ] Não foi possível conectar após todas as tentativas');
      }
    }
  }
}

function getChannel() {
  if (!channel) throw new Error('[RabbitMQ] Canal não inicializado. Chame connect() primeiro.');
  return channel;
}

/**
 * Publica uma mensagem em uma fila
 */
function publish(queue, payload) {
  const ch = getChannel();
  const message = JSON.stringify(payload);
  ch.sendToQueue(queue, Buffer.from(message), { persistent: true });
}

/**
 * Publica e aguarda resposta (RPC pattern)
 * Usado para operações que precisam retornar dados ao cliente
 */
async function publishRPC(queue, payload, timeoutMs = 10000) {
  const ch = getChannel();

  return new Promise(async (resolve, reject) => {
    const replyQueue = await ch.assertQueue('', { exclusive: true });
    const correlationId = require('uuid').v4();

    const timer = setTimeout(() => {
      ch.deleteQueue(replyQueue.queue);
      reject(new Error(`[RabbitMQ] Timeout na fila ${queue}`));
    }, timeoutMs);

    ch.consume(
      replyQueue.queue,
      (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          clearTimeout(timer);
          const response = JSON.parse(msg.content.toString());
          resolve(response);
        }
      },
      { noAck: true },
    );

    ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      correlationId,
      replyTo: replyQueue.queue,
    });
  });
}

module.exports = { connect, getChannel, publish, publishRPC, QUEUES };
