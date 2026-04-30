const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de partidas
 */
function startMatchWorker() {
  const channel = getChannel();

  // ── MATCH_CREATE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.MATCH_CREATE, async (msg) => {
    if (!msg) return;
    try {
      const match = JSON.parse(msg.content.toString());

      const { error } = await supabase.from('matches').insert([
        {
          id: match.id,
          team_a_id: match.teamA.id,
          team_a_name: match.teamA.name,
          team_a_course: match.teamA.course,
          team_a_faculty: match.teamA.faculty,
          team_b_id: match.teamB.id,
          team_b_name: match.teamB.name,
          team_b_course: match.teamB.course,
          team_b_faculty: match.teamB.faculty,
          score_a: match.scoreA ?? null,
          score_b: match.scoreB ?? null,
          sport: match.sport,
          category: match.category,
          stage: match.stage,
          status: match.status || 'scheduled',
          date: match.date,
          time: match.time,
          location: match.location,
          events: match.events || [],
          participants: match.participants || [],
          mvp_voting_started_at: match.mvpVotingStartedAt || null,
        },
      ]);

      if (error) console.error('[Worker:MATCH_CREATE] Erro:', error);
      else console.log(`[Worker:MATCH_CREATE] Partida ${match.id} criada`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MATCH_CREATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── MATCH_UPDATE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.MATCH_UPDATE, async (msg) => {
    if (!msg) return;
    try {
      const match = JSON.parse(msg.content.toString());

      const updatePayload = {};
      if (match.scoreA !== undefined) updatePayload.score_a = match.scoreA;
      if (match.scoreB !== undefined) updatePayload.score_b = match.scoreB;
      if (match.status !== undefined) updatePayload.status = match.status;
      if (match.date !== undefined) updatePayload.date = match.date;
      if (match.time !== undefined) updatePayload.time = match.time;
      if (match.location !== undefined) updatePayload.location = match.location;
      if (match.events !== undefined) updatePayload.events = match.events;
      if (match.participants !== undefined) updatePayload.participants = match.participants;
      if (match.stage !== undefined) updatePayload.stage = match.stage;
      if (match.mvpVotingStartedAt !== undefined) updatePayload.mvp_voting_started_at = match.mvpVotingStartedAt;

      const { error } = await supabase.from('matches').update(updatePayload).match({ id: match.id });

      if (error) console.error('[Worker:MATCH_UPDATE] Erro:', error);
      else console.log(`[Worker:MATCH_UPDATE] Partida ${match.id} atualizada`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MATCH_UPDATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── MATCH_DELETE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.MATCH_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { id } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('matches').delete().match({ id });

      if (error) console.error('[Worker:MATCH_DELETE] Erro:', error);
      else console.log(`[Worker:MATCH_DELETE] Partida ${id} removida`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MATCH_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── MATCH_DELETE_SCHEDULED ────────────────────────────────────────────────────
  channel.consume(QUEUES.MATCH_DELETE_SCHEDULED, async (msg) => {
    if (!msg) return;
    try {
      const { error } = await supabase.from('matches').delete().eq('status', 'scheduled');

      if (error) console.error('[Worker:MATCH_DELETE_SCHEDULED] Erro:', error);
      else console.log('[Worker:MATCH_DELETE_SCHEDULED] Partidas agendadas removidas');

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MATCH_DELETE_SCHEDULED] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] Match worker iniciado');
}

module.exports = { startMatchWorker };
