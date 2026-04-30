const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker da Torcida (posts, comentários, likes, notificações)
 */
function startTorcidaWorker() {
  const channel = getChannel();

  // ── TORCIDA_POST_DELETE ───────────────────────────────────────────────────────
  channel.consume(QUEUES.TORCIDA_POST_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { postId } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('torcida_posts').delete().eq('id', postId);

      if (error) console.error('[Worker:TORCIDA_POST_DELETE] Erro:', error);
      else console.log(`[Worker:TORCIDA_POST_DELETE] Post ${postId} removido`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:TORCIDA_POST_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── TORCIDA_COMMENT_DELETE ────────────────────────────────────────────────────
  channel.consume(QUEUES.TORCIDA_COMMENT_DELETE, async (msg) => {
    if (!msg) return;
    try {
      const { commentId } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('torcida_comments').delete().eq('id', commentId);

      if (error) console.error('[Worker:TORCIDA_COMMENT_DELETE] Erro:', error);
      else console.log(`[Worker:TORCIDA_COMMENT_DELETE] Comentário ${commentId} removido`);

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:TORCIDA_COMMENT_DELETE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── TORCIDA_LIKE_TOGGLE ───────────────────────────────────────────────────────
  channel.consume(QUEUES.TORCIDA_LIKE_TOGGLE, async (msg) => {
    if (!msg) return;
    try {
      const { action, postId, userId } = JSON.parse(msg.content.toString());

      if (action === 'like') {
        // Insere like
        await supabase.from('torcida_likes').insert([{ post_id: postId, user_id: userId }]);
        // Incrementa contador via RPC
        await supabase.rpc('increment_likes', { post_id: postId });
        console.log(`[Worker:TORCIDA_LIKE_TOGGLE] Like adicionado: post ${postId} por ${userId}`);
      } else if (action === 'unlike') {
        // Remove like
        await supabase.from('torcida_likes').delete().eq('post_id', postId).eq('user_id', userId);
        // Decrementa contador via RPC
        await supabase.rpc('decrement_likes', { post_id: postId });
        console.log(`[Worker:TORCIDA_LIKE_TOGGLE] Like removido: post ${postId} por ${userId}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:TORCIDA_LIKE_TOGGLE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── TORCIDA_NOTIFICATION_INSERT ───────────────────────────────────────────────
  channel.consume(QUEUES.TORCIDA_NOTIFICATION_INSERT, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());

      if (payload.type === 'notify_admins') {
        // Notifica todos os superadmins sobre novo post
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'superadmin');

        if (admins && admins.length > 0) {
          const inserts = admins
            .filter((a) => String(a.id) !== String(payload.actorId))
            .map((a) => ({
              user_id: String(a.id),
              actor_name: payload.actorName,
              post_id: payload.postId,
              type: 'new_post',
            }));

          if (inserts.length > 0) {
            const { error } = await supabase.from('torcida_notifications').insert(inserts);
            if (error) console.error('[Worker:TORCIDA_NOTIFICATION_INSERT] Erro (admins):', error);
            else console.log(`[Worker:TORCIDA_NOTIFICATION_INSERT] ${inserts.length} admins notificados`);
          }
        }
      } else {
        // Notificação individual (like, comment)
        const { recipientId, actorId, actorName, postId, type } = payload;

        // Não notifica a si mesmo
        if (String(recipientId) === String(actorId)) {
          channel.ack(msg);
          return;
        }

        const { error } = await supabase.from('torcida_notifications').insert([
          {
            user_id: String(recipientId),
            actor_name: actorName,
            post_id: postId,
            type,
          },
        ]);

        if (error) console.error('[Worker:TORCIDA_NOTIFICATION_INSERT] Erro:', error);
        else console.log(`[Worker:TORCIDA_NOTIFICATION_INSERT] Notificação "${type}" enviada para ${recipientId}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:TORCIDA_NOTIFICATION_INSERT] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] Torcida worker iniciado');
}

module.exports = { startTorcidaWorker };
