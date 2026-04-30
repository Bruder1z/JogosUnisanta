const { supabase } = require('../config/supabase');
const { getChannel, QUEUES } = require('../config/rabbitmq');

/**
 * Worker de autenticação e usuários
 * Processa operações de escrita assíncronas relacionadas a usuários
 */
function startAuthWorker() {
  const channel = getChannel();

  // ── USER_UPDATE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.USER_UPDATE, async (msg) => {
    if (!msg) return;
    try {
      const { email, updates } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('users').update(updates).eq('email', email);
      if (error) console.error('[Worker:USER_UPDATE] Erro:', error);
      else console.log(`[Worker:USER_UPDATE] Usuário ${email} atualizado`);
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:USER_UPDATE] Exceção:', err.message);
      channel.nack(msg, false, false); // descarta mensagem inválida
    }
  });

  // ── USER_REGISTER (envio de email de confirmação) ───────────────────────────
  channel.consume(QUEUES.USER_REGISTER, async (msg) => {
    if (!msg) return;
    try {
      const { email, loginToken, expiryMinutes } = JSON.parse(msg.content.toString());

      // Integração com EmailJS via fetch (server-side)
      const emailjsPayload = {
        service_id: process.env.EMAILJS_SERVICE,
        template_id: process.env.EMAILJS_CONFIRM_TEMPLATE,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          email,
          passcode: loginToken,
          time: `${expiryMinutes} minutos`,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailjsPayload),
      });

      if (!response.ok) {
        console.warn(`[Worker:USER_REGISTER] EmailJS retornou ${response.status} para ${email}`);
      } else {
        console.log(`[Worker:USER_REGISTER] Email de confirmação enviado para ${email}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:USER_REGISTER] Exceção:', err.message);
      channel.nack(msg, false, true); // requeue para retry
    }
  });

  // ── USER_RESEND_CONFIRMATION ────────────────────────────────────────────────
  channel.consume(QUEUES.USER_RESEND_CONFIRMATION, async (msg) => {
    if (!msg) return;
    try {
      const { email, loginToken, expiryMinutes } = JSON.parse(msg.content.toString());

      const emailjsPayload = {
        service_id: process.env.EMAILJS_SERVICE,
        template_id: process.env.EMAILJS_CONFIRM_TEMPLATE,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          email,
          passcode: loginToken,
          time: `${expiryMinutes} minutos`,
        },
      };

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailjsPayload),
      });

      console.log(`[Worker:USER_RESEND_CONFIRMATION] Email reenviado para ${email}`);
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:USER_RESEND_CONFIRMATION] Exceção:', err.message);
      channel.nack(msg, false, true);
    }
  });

  // ── USER_PROMOTE ────────────────────────────────────────────────────────────
  channel.consume(QUEUES.USER_PROMOTE, async (msg) => {
    if (!msg) return;
    try {
      const { userId } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
      if (error) console.error('[Worker:USER_PROMOTE] Erro:', error);
      else console.log(`[Worker:USER_PROMOTE] Usuário ${userId} promovido a admin`);
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:USER_PROMOTE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ── USER_DEMOTE ─────────────────────────────────────────────────────────────
  channel.consume(QUEUES.USER_DEMOTE, async (msg) => {
    if (!msg) return;
    try {
      const { id } = JSON.parse(msg.content.toString());
      const { error } = await supabase.from('users').update({ role: 'cliente' }).eq('id', id);
      if (error) console.error('[Worker:USER_DEMOTE] Erro:', error);
      else console.log(`[Worker:USER_DEMOTE] Admin ${id} rebaixado para cliente`);
      channel.ack(msg);
    } catch (err) {
      console.error('[Worker:USER_DEMOTE] Exceção:', err.message);
      channel.nack(msg, false, false);
    }
  });

  console.log('[Worker] Auth worker iniciado');
}

module.exports = { startAuthWorker };
