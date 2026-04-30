const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de atletas e atletas em destaque
 */
function startAthleteWorker() {
  const channel = getChannel();

  // ── ATHLETE_CREATE ────────────────────────────────────────────────────────────
  channel.consume(QUEUES.ATHLETE_CREATE, async (msg) => {
    if (!msg) return;
    try {
      const { id, firstName, lastName, institution, course, sports, sex } = JSON.parse(
        msg.content.toString(),
      );

      const { error } = await supabase.from('athletes').insert([
        {
          id: id || require('uuid').v4(),
          first_name: firstName,
          last_name: lastName,
          institution,
          course,
          sports: sports || [],
          sex,
        },
      ]);

      if (error) console.error('[Worker:ATHLETE_CREATE] Erro:', error);
      else console.log(`[Worker:ATHLETE_CREATE] Atleta "${firstName} ${lastName}" criado`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:ATHLETE_CREATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── ATHLETE_DELETE ────────────────────────────────────────────────────────────
  channel.consume(QUEUES.ATHLETE_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { id } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('athletes').delete().match({ id });

      if (error) console.error('[Worker:ATHLETE_DELETE] Erro:', error);
      else console.log(`[Worker:ATHLETE_DELETE] Atleta ${id} removido`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:ATHLETE_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── FEATURED_ATHLETE_CREATE ───────────────────────────────────────────────────
  channel.consume(QUEUES.FEATURED_ATHLETE_CREATE, async (msg) => {
    if (!msg) return;
    try {
      const { id, name, institution, course, sport, reason } = JSON.parse(msg.content.toString());

      const { error } = await supabase.from('featured_athletes').insert([
        {
          id: id || require('uuid').v4(),
          name,
          institution,
          course,
          sport,
          reason,
        },
      ]);

      if (error) console.error('[Worker:FEATURED_ATHLETE_CREATE] Erro:', error);
      else console.log(`[Worker:FEATURED_ATHLETE_CREATE] Atleta em destaque "${name}" criado`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:FEATURED_ATHLETE_CREATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── FEATURED_ATHLETE_DELETE ───────────────────────────────────────────────────
  channel.consume(QUEUES.FEATURED_ATHLETE_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { id } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('featured_athletes').delete().match({ id });

      if (error) console.error('[Worker:FEATURED_ATHLETE_DELETE] Erro:', error);
      else console.log(`[Worker:FEATURED_ATHLETE_DELETE] Atleta em destaque ${id} removido`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:FEATURED_ATHLETE_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] Athlete worker iniciado');
}

module.exports = { startAthleteWorker };
