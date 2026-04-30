const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de MVP (candidatos e votos)
 */
function startMvpWorker() {
  const channel = getChannel();

  // ── MVP_CANDIDATES_ENSURE ─────────────────────────────────────────────────────
  channel.consume(QUEUES.MVP_CANDIDATES_ENSURE, async (msg) => {
    if (!msg) return;
    try {
      const { candidates } = JSON.parse(msg.content.toString());

      // Deduplica por matchId + teamId + playerName
      const unique = Array.from(
        new Map(
          candidates.map((c) => [
            `${c.matchId}::${c.teamId}::${c.playerName.toLowerCase()}`,
            c,
          ]),
        ).values(),
      );

      const payload = unique.map((c) => ({
        match_id: c.matchId,
        sport: c.sport,
        player_name: c.playerName,
        team_id: c.teamId,
        team_name: c.teamName,
        institution: c.institution,
        course: c.course,
        points: c.points || 0,
      }));

      const { error } = await supabase
        .from('match_mvp_candidates')
        .upsert(payload, { onConflict: 'match_id,player_name,team_id' });

      if (error) {
        // Fallback para insert se não houver constraint
        const needsConstraint = (error.message || '')
          .toLowerCase()
          .includes('no unique or exclusion constraint');

        if (!needsConstraint) {
          console.error('[Worker:MVP_CANDIDATES_ENSURE] Erro:', error);
        } else {
          await supabase.from('match_mvp_candidates').insert(payload);
        }
      } else {
        console.log(`[Worker:MVP_CANDIDATES_ENSURE] ${payload.length} candidatos sincronizados`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MVP_CANDIDATES_ENSURE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── MVP_VOTE (atualiza contagem de votos) ─────────────────────────────────────
  channel.consume(QUEUES.MVP_VOTE, async (msg) => {
    if (!msg) return;
    try {
      const { candidateId, nextVotes } = JSON.parse(msg.content.toString());

      const { error } = await supabase
        .from('match_mvp_candidates')
        .update({ votes: nextVotes })
        .eq('id', candidateId);

      if (error) console.error('[Worker:MVP_VOTE] Erro ao atualizar votos:', error);
      else console.log(`[Worker:MVP_VOTE] Candidato ${candidateId} agora tem ${nextVotes} votos`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:MVP_VOTE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] MVP worker iniciado');
}

module.exports = { startMvpWorker };
