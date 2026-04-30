const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../config/supabase');
const { publish, QUEUES } = require('../config/rabbitmq');
const { requireAuth } = require('../middleware/auth');

// Multer em memória para upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  },
});

// ── GET /torcida/posts ────────────────────────────────────────────────────────
router.get('/posts', async (req, res) => {
  const { data, error } = await supabase
    .from('torcida_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Torcida] Erro ao buscar posts:', error);
    return res.status(500).json({ error: 'Erro ao buscar posts' });
  }

  return res.json(data);
});

// ── POST /torcida/posts ───────────────────────────────────────────────────────
router.post('/posts', requireAuth, upload.single('image'), async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  const userName = `${req.user.name || ''} ${req.user.surname || ''}`.trim() || req.user.email;

  if (!content && !req.file) {
    return res.status(400).json({ error: 'Conteúdo ou imagem são obrigatórios' });
  }

  let imageUrl = null;

  // Upload da imagem para o Supabase Storage (síncrono, precisa da URL antes de criar o post)
  if (req.file) {
    const ext = req.file.mimetype.split('/')[1];
    const path = `posts/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('torcida-images')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Torcida] Erro ao fazer upload da imagem:', uploadError);
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }

    const { data: urlData } = supabase.storage
      .from('torcida-images')
      .getPublicUrl(path);

    imageUrl = urlData.publicUrl;
  }

  // Insere o post de forma síncrona para retornar o ID
  const { data: post, error: postError } = await supabase
    .from('torcida_posts')
    .insert([
      {
        user_id: String(userId),
        user_name: userName,
        content: content || '',
        likes_count: 0,
        image_url: imageUrl,
      },
    ])
    .select('*')
    .single();

  if (postError) {
    console.error('[Torcida] Erro ao criar post:', postError);
    return res.status(500).json({ error: 'Erro ao criar post' });
  }

  // Notifica admins via fila (fire-and-forget)
  publish(QUEUES.TORCIDA_NOTIFICATION_INSERT, {
    type: 'notify_admins',
    actorId: userId,
    actorName: userName,
    postId: post.id,
  });

  return res.status(201).json(post);
});

// ── DELETE /torcida/posts/:id ─────────────────────────────────────────────────
router.delete('/posts/:id', requireAuth, async (req, res) => {
  const postId = req.params.id;

  // Verifica se o post pertence ao usuário ou se é admin
  const { data: post } = await supabase
    .from('torcida_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post) return res.status(404).json({ error: 'Post não encontrado' });

  const isOwner = String(post.user_id) === String(req.user.id);
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Sem permissão para deletar este post' });
  }

  publish(QUEUES.TORCIDA_POST_DELETE, { postId });
  return res.status(202).json({ success: true, message: 'Post sendo removido' });
});

// ── GET /torcida/posts/:postId/comments ───────────────────────────────────────
router.get('/posts/:postId/comments', async (req, res) => {
  const { data, error } = await supabase
    .from('torcida_comments')
    .select('*')
    .eq('post_id', req.params.postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Torcida] Erro ao buscar comentários:', error);
    return res.status(500).json({ error: 'Erro ao buscar comentários' });
  }

  return res.json(data);
});

// ── POST /torcida/posts/:postId/comments ──────────────────────────────────────
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  const { content } = req.body;
  const postId = req.params.postId;
  const userId = req.user.id;
  const userName = `${req.user.name || ''} ${req.user.surname || ''}`.trim() || req.user.email;

  if (!content) return res.status(400).json({ error: 'Conteúdo é obrigatório' });

  const { data: comment, error } = await supabase
    .from('torcida_comments')
    .insert([
      {
        post_id: postId,
        user_id: String(userId),
        user_name: userName,
        content,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('[Torcida] Erro ao criar comentário:', error);
    return res.status(500).json({ error: 'Erro ao criar comentário' });
  }

  // Notifica o autor do post via fila
  const { data: postData } = await supabase
    .from('torcida_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (postData) {
    publish(QUEUES.TORCIDA_NOTIFICATION_INSERT, {
      type: 'comment',
      recipientId: postData.user_id,
      actorId: userId,
      actorName: userName,
      postId,
    });
  }

  return res.status(201).json(comment);
});

// ── DELETE /torcida/comments/:id ──────────────────────────────────────────────
router.delete('/comments/:id', requireAuth, async (req, res) => {
  const { data: comment } = await supabase
    .from('torcida_comments')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });

  const isOwner = String(comment.user_id) === String(req.user.id);
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Sem permissão para deletar este comentário' });
  }

  publish(QUEUES.TORCIDA_COMMENT_DELETE, { commentId: req.params.id });
  return res.status(202).json({ success: true, message: 'Comentário sendo removido' });
});

// ── GET /torcida/likes ────────────────────────────────────────────────────────
// Retorna os post_ids curtidos pelo usuário autenticado
router.get('/likes', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('torcida_likes')
    .select('post_id')
    .eq('user_id', String(req.user.id));

  if (error) {
    console.error('[Torcida] Erro ao buscar likes:', error);
    return res.status(500).json({ error: 'Erro ao buscar likes' });
  }

  return res.json((data || []).map((l) => l.post_id));
});

// ── POST /torcida/posts/:postId/like ──────────────────────────────────────────
router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  const postId = req.params.postId;
  const userId = String(req.user.id);
  const userName = `${req.user.name || ''} ${req.user.surname || ''}`.trim() || req.user.email;

  // Verifica se já curtiu
  const { data: existing } = await supabase
    .from('torcida_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Descurtir
    publish(QUEUES.TORCIDA_LIKE_TOGGLE, { action: 'unlike', postId, userId });
    return res.json({ liked: false });
  }

  // Curtir
  publish(QUEUES.TORCIDA_LIKE_TOGGLE, { action: 'like', postId, userId });

  // Notifica o autor do post
  const { data: postData } = await supabase
    .from('torcida_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (postData) {
    publish(QUEUES.TORCIDA_NOTIFICATION_INSERT, {
      type: 'like',
      recipientId: postData.user_id,
      actorId: userId,
      actorName: userName,
      postId,
    });
  }

  return res.json({ liked: true });
});

// ── GET /torcida/notifications ────────────────────────────────────────────────
router.get('/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('torcida_notifications')
    .select('*')
    .eq('user_id', String(req.user.id))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Torcida] Erro ao buscar notificações:', error);
    return res.status(500).json({ error: 'Erro ao buscar notificações' });
  }

  return res.json(data);
});

// ── POST /torcida/notifications/read-all ──────────────────────────────────────
router.post('/notifications/read-all', requireAuth, async (req, res) => {
  await supabase
    .from('torcida_notifications')
    .update({ read: true })
    .eq('user_id', String(req.user.id))
    .eq('read', false);

  return res.json({ success: true });
});

// ── DELETE /torcida/notifications ─────────────────────────────────────────────
router.delete('/notifications', requireAuth, async (req, res) => {
  await supabase
    .from('torcida_notifications')
    .delete()
    .eq('user_id', String(req.user.id));

  return res.json({ success: true });
});

module.exports = router;
