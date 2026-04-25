import { type FC, useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/NotificationContext';
import { supabase } from '../services/supabaseClient';
import { Heart, MessageCircle, Trash2, Send, Users, Lock, Megaphone, ImagePlus, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  user_id: string | number;
  user_name: string;
  content: string;
  likes_count: number;
  image_url?: string;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string | number;
  user_name: string;
  content: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHr < 24) return `há ${diffHr}h`;
  if (diffDay === 1) return 'ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const sameId = (a: string | number | undefined, b: string | number | undefined) =>
  a !== undefined && b !== undefined && String(a) === String(b);

// ── Helpers de notificação ────────────────────────────────────────────────────

const insertNotification = async (
  recipientId: string | number,
  actorId: string | number,
  actorName: string,
  postId: string,
  type: 'like' | 'comment' | 'new_post',
) => {
  // Não notifica a si mesmo
  if (String(recipientId) === String(actorId)) return;
  await supabase.from('torcida_notifications').insert([{
    user_id: String(recipientId),
    actor_name: actorName,
    post_id: postId,
    type,
  }]);
};

const notifyAdmins = async (
  actorId: string | number,
  actorName: string,
  postId: string,
) => {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'superadmin');
  if (!admins) return;
  const inserts = admins
    .filter((a: { id: string | number }) => String(a.id) !== String(actorId))
    .map((a: { id: string | number }) => ({
      user_id: String(a.id),
      actor_name: actorName,
      post_id: postId,
      type: 'new_post',
    }));
  if (inserts.length > 0) {
    await supabase.from('torcida_notifications').insert(inserts);
  }
};

// ── CommentSection ────────────────────────────────────────────────────────────

interface CommentSectionProps {
  postId: string;
  postAuthorId: string | number;
  onOpenLogin: () => void;
}

const CommentSection: FC<CommentSectionProps> = ({ postId, postAuthorId, onOpenLogin }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'superadmin';
  const displayName = user ? [user.name, user.surname].filter(Boolean).join(' ') : undefined;

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('torcida_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (!error && data) setComments(data);
    setLoadingComments(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleAddComment = async () => {
    if (!user?.id || !displayName || !newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('torcida_comments').insert([{
      post_id: postId,
      user_id: user.id,
      user_name: displayName,
      content: newComment.trim(),
    }]);
    if (error) {
      showNotification('Erro ao comentar. Tente novamente.', 'error');
    } else {
      setNewComment('');
      fetchComments();
      insertNotification(postAuthorId, user.id, displayName, postId, 'comment');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('torcida_comments').delete().eq('id', commentId);
    if (error) {
      console.error('Erro ao excluir comentário:', error);
      showNotification(`Erro ao excluir: ${error.message}`, 'error');
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
      showNotification('Comentário excluído.', 'success');
    }
  };

  return (
    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
      {loadingComments ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
          Carregando comentários...
        </p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {comments.map(comment => {
            const canDeleteComment = isAdmin || sameId(comment.user_id, user?.id);
            return (
              <div key={comment.id} style={{
                background: 'var(--bg-hover)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {comment.user_name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {comment.content}
                  </p>
                </div>
                {canDeleteComment && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Excluir comentário"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px', flexShrink: 0, opacity: 0.7, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {user ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
            placeholder="Escreva um comentário..."
            maxLength={500}
            style={{
              flex: 1,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            title="Enviar comentário"
            style={{
              background: newComment.trim() ? 'var(--accent-color)' : 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: newComment.trim() ? 'white' : 'var(--text-secondary)',
              cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenLogin}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
        >
          <Lock size={12} /> Entre para comentar
        </button>
      )}
    </div>
  );
};

// ── PostCard ──────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  currentUserId?: string | number;
  currentUserName?: string;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLikeChange: (postId: string, liked: boolean) => void;
  onDelete: (postId: string) => void;
}

const PostCard: FC<PostCardProps> = ({
  post,
  isLiked: initialLiked,
  currentUserId,
  currentUserName,
  isAdmin,
  onOpenLogin,
  onLikeChange,
  onDelete,
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => { setLiked(initialLiked); }, [initialLiked]);

  const handleLike = async () => {
    if (!currentUserId) { onOpenLogin(); return; }
    if (likeLoading) return;
    setLikeLoading(true);

    if (liked) {
      const { error } = await supabase.from('torcida_likes').delete()
        .eq('post_id', post.id).eq('user_id', currentUserId);
      if (!error) {
        await supabase.rpc('decrement_likes', { post_id: post.id });
        setLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
        onLikeChange(post.id, false);
      } else {
        showNotification('Erro ao descurtir.', 'error');
      }
    } else {
      const { error } = await supabase.from('torcida_likes').insert([{ post_id: post.id, user_id: currentUserId }]);
      if (!error) {
        await supabase.rpc('increment_likes', { post_id: post.id });
        setLiked(true);
        setLikesCount(c => c + 1);
        onLikeChange(post.id, true);
        if (currentUserName) {
          insertNotification(post.user_id, currentUserId, currentUserName, post.id, 'like');
        }
      } else {
        showNotification('Erro ao curtir.', 'error');
      }
    }
    setLikeLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta publicação?')) return;
    const { error } = await supabase.from('torcida_posts').delete().eq('id', post.id);
    if (error) {
      console.error('Erro ao excluir post:', error);
      showNotification(`Erro ao excluir: ${error.message}`, 'error');
    } else {
      showNotification('Publicação excluída.', 'success');
      onDelete(post.id);
    }
  };

  // Usa sameId para evitar falha por diferença de tipo (string vs number)
  const canDelete = isAdmin || sameId(post.user_id, currentUserId);

  return (
    <div className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'var(--accent-color)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: '17px',
            color: 'white', flexShrink: 0, userSelect: 'none',
          }}>
            {getInitial(post.user_name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {post.user_name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {formatDate(post.created_at)}
            </div>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            title="Excluir publicação"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px', flexShrink: 0, opacity: 0.7, transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Texto */}
      {post.content && (
        <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </p>
      )}

      {/* Imagem */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Imagem do post"
          style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
        />
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleLike}
          disabled={likeLoading}
          title={liked ? 'Descurtir' : 'Curtir'}
          style={{
            background: 'none', border: 'none',
            cursor: likeLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: liked ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontSize: '14px', fontWeight: liked ? 700 : 400,
            padding: '8px 12px', borderRadius: '8px',
            transition: 'all 0.15s', opacity: likeLoading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!likeLoading) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <Heart size={18} fill={liked ? 'var(--accent-color)' : 'none'} strokeWidth={liked ? 0 : 2} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(prev => !prev)}
          title={showComments ? 'Fechar comentários' : 'Ver comentários'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: showComments ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '14px', fontWeight: showComments ? 600 : 400,
            padding: '8px 12px', borderRadius: '8px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <MessageCircle size={18} />
          <span>{showComments ? 'Fechar' : 'Comentários'}</span>
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} postAuthorId={post.user_id} onOpenLogin={onOpenLogin} />
      )}
    </div>
  );
};

// ── Torcida Page ──────────────────────────────────────────────────────────────

const Torcida: FC = () => {
  const { user, openLoginModal } = useAuth();
  const { showNotification } = useNotification();
  const [showRanking, setShowRanking] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [newPostContent, setNewPostContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'superadmin';
  const displayName = user ? [user.name, user.surname].filter(Boolean).join(' ') : undefined;

  const fetchPosts = useCallback(async () => {
    setLoadError('');
    const { data, error } = await supabase
      .from('torcida_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError('Erro ao carregar o feed. Tente novamente mais tarde.');
    } else {
      setPosts(data ?? []);
    }
    setLoading(false);
  }, []);

  const fetchLikedPosts = useCallback(async () => {
    if (!user) { setLikedPostIds(new Set()); return; }
    const { data } = await supabase
      .from('torcida_likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPostIds(new Set(data.map((l: { post_id: string }) => String(l.post_id))));
  }, [user?.id]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchLikedPosts(); }, [fetchLikedPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async () => {
    if (!user) return;
    if (!newPostContent.trim() && !imageFile) return;
    setSubmitting(true);

    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('torcida-images')
        .upload(path, imageFile, { upsert: false });

      if (uploadError) {
        showNotification(`Erro ao enviar imagem: ${uploadError.message}`, 'error');
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('torcida-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('torcida_posts').insert([{
      user_id: user.id,
      user_name: displayName || user.name,
      content: newPostContent.trim(),
      likes_count: 0,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    }]);

    if (error) {
      showNotification('Erro ao publicar. Tente novamente.', 'error');
    } else {
      setNewPostContent('');
      removeImage();
      showNotification('Publicação criada!', 'success');
      fetchPosts();
      // Notifica admins sobre novo post (o ID vem do post inserido — buscamos o mais recente)
      const { data: newPost } = await supabase
        .from('torcida_posts')
        .select('id')
        .eq('user_id', String(user.id))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (newPost) {
        notifyAdmins(user.id, displayName || user.name, newPost.id);
      }
    }
    setSubmitting(false);
  };

  const handleLikeChange = (postId: string, liked: boolean) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      liked ? next.add(postId) : next.delete(postId);
      return next;
    });
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header />
      <Sidebar onShowRanking={() => setShowRanking(true)} />

      <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Megaphone size={32} color="var(--accent-color)" />
              Torcida
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              O espaço da torcida dos Jogos Unisanta — compartilhe, torça e celebre!
            </p>
          </div>

          {/* Formulário de novo post */}
          {user ? (
            <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: 'var(--accent-color)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '17px',
                  color: 'white', flexShrink: 0, userSelect: 'none',
                }}>
                  {getInitial(user.name)}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder="O que você está pensando sobre os jogos?"
                    maxLength={1000}
                    rows={3}
                    style={{
                      width: '100%', background: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)', borderRadius: '10px',
                      padding: '14px', color: 'var(--text-primary)', fontSize: '15px',
                      outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                      boxSizing: 'border-box', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  />

                  {/* Preview da imagem selecionada */}
                  {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                      />
                      <button
                        onClick={removeImage}
                        title="Remover imagem"
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(0,0,0,0.7)', border: 'none',
                          borderRadius: '50%', width: '28px', height: '28px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'white',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Rodapé do formulário */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Adicionar imagem"
                        style={{
                          background: 'none', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '8px 12px',
                          color: imageFile ? 'var(--accent-color)' : 'var(--text-secondary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '13px', transition: 'all 0.2s',
                        }}
                      >
                        <ImagePlus size={16} />
                        {imageFile ? 'Imagem selecionada' : 'Adicionar foto'}
                      </button>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {newPostContent.length}/1000
                      </span>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={submitting || (!newPostContent.trim() && !imageFile)}
                      style={{
                        padding: '10px 24px',
                        background: (newPostContent.trim() || imageFile) && !submitting ? 'var(--accent-color)' : 'var(--bg-hover)',
                        color: (newPostContent.trim() || imageFile) && !submitting ? 'white' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)', borderRadius: '8px',
                        fontWeight: 700, fontSize: '14px',
                        cursor: (newPostContent.trim() || imageFile) && !submitting ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                      }}
                    >
                      {submitting ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-card" style={{ padding: '28px', marginBottom: '24px', textAlign: 'center' }}>
              <Users size={32} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '15px' }}>
                Faça login para participar da torcida!
              </p>
              <button
                onClick={openLoginModal}
                style={{ padding: '10px 28px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Login / Cadastro
              </button>
            </div>
          )}

          {/* Feed */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', fontSize: '15px' }}>
              Carregando feed...
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--bg-card)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', color: 'var(--live-color)', fontSize: '15px' }}>
              {loadError}
              <br />
              <button onClick={fetchPosts} style={{ marginTop: '16px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 20px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
                Tentar novamente
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>📢</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>
                Nenhuma publicação ainda. Seja o primeiro a torcer!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPostIds.has(String(post.id))}
                  currentUserId={user?.id}
                  currentUserName={displayName}
                  isAdmin={isAdmin}
                  onOpenLogin={openLoginModal}
                  onLikeChange={handleLikeChange}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
    </div>
  );
};

export default Torcida;
