const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de cursos e ranking
 */
function startCourseWorker() {
  const channel = getChannel();

  // ── COURSE_CREATE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.COURSE_CREATE, async (msg) => {
    if (!msg) return;
    try {
      const { id, name, university, emblem_url } = JSON.parse(msg.content.toString());

      const payload = { id: id || require('uuid').v4(), name, university };
      if (emblem_url) payload.emblem_url = emblem_url;

      const { error } = await supabase.from('courses').insert([payload]);
      if (error) {
        console.error('[Worker:COURSE_CREATE] Erro ao criar curso:', error);
      } else {
        // Inicializa ranking para o novo curso
        const courseString = `${name} - ${university}`;
        await supabase.from('ranking').insert([{ course: courseString, points: 0 }]);
        console.log(`[Worker:COURSE_CREATE] Curso "${name} - ${university}" criado`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:COURSE_CREATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── COURSE_DELETE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.COURSE_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { name, university } = JSON.parse(msg.content.toString());

      await supabase.from('courses').delete().match({ name, university });
      await supabase.from('ranking').delete().match({ course: `${name} - ${university}` });

      console.log(`[Worker:COURSE_DELETE] Curso "${name} - ${university}" removido`);
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:COURSE_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── RANKING_UPDATE ────────────────────────────────────────────────────────────
  channel.consume(QUEUES.RANKING_UPDATE, async (msg) => {
    if (!msg) return;
    try {
      const { course, points } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('ranking').update({ points }).eq('course', course);

      if (error) console.error('[Worker:RANKING_UPDATE] Erro:', error);
      else console.log(`[Worker:RANKING_UPDATE] Ranking de "${course}" atualizado para ${points}`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:RANKING_UPDATE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── RANKING_RESET ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.RANKING_RESET, async (msg) => {
    if (!msg) return;
    try {
      // Zera todos os pontos
      const { error } = await supabase
        .from('ranking')
        .update({ points: 0 })
        .neq('course', 'xyz_never_match_this');

      if (error) console.error('[Worker:RANKING_RESET] Erro:', error);
      else console.log('[Worker:RANKING_RESET] Ranking zerado');

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:RANKING_RESET] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── RANKING_RESTORE ───────────────────────────────────────────────────────────
  channel.consume(QUEUES.RANKING_RESTORE, async (msg) => {
    if (!msg) return;
    try {
      // Lógica de restauração do ranking oficial
      // Aqui você pode implementar a lógica específica do projeto
      // Por ora, apenas loga — implemente conforme necessário
      console.log('[Worker:RANKING_RESTORE] Restauração do ranking oficial solicitada');
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:RANKING_RESTORE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] Course worker iniciado');
}

module.exports = { startCourseWorker };
