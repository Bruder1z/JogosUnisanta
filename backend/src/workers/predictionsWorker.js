const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de previsões (bolão)
 */
function startPredictionsWorker() {
  const channel = getChannel();

  // ── PREDICTIONS_SAVE ──────────────────────────────────────────────────────────
  channel.consume(QUEUES.PREDICTIONS_SAVE, async (msg) => {
    if (!msg) return;
    try {
      const { rows } = JSON.parse(msg.content.toString());

      const { error } = await supabase
        .from('predictions')
        .upsert(rows, { onConflict: 'user_email,match_id' });

      if (error) console.error('[Worker:PREDICTIONS_SAVE] Erro:', error);
      else console.log(`[Worker:PREDICTIONS_SAVE] ${rows.length} previsões salvas`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:PREDICTIONS_SAVE] Exceção:', err.message);
      channel.nack(msg, false, true); // requeue para retry
    }
  });

  console.log('[Worker] Predictions worker iniciado');
}

module.exports = { startPredictionsWorker };
