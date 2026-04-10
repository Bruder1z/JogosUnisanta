import { type FC, useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  user_id: string;
  actor_name: string;
  post_id: string;
  type: 'like' | 'comment' | 'new_post';
  read: boolean;
  created_at: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHr < 24) return `há ${diffHr}h`;
  if (diffDay === 1) return 'ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const TorcidaNotificationBell: FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('torcida_notifications')
      .select('*')
      .eq('user_id', String(user.id))
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
  }, [user?.id]);

  // Polling a cada 30s
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      // Marca todas como lidas
      await supabase
        .from('torcida_notifications')
        .update({ read: true })
        .eq('user_id', String(user?.id))
        .eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        title="Notificações"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'color 0.2s',
        }}
      >
        <Bell size={22} color={unreadCount > 0 ? 'var(--accent-color)' : '#ccc'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--accent-color)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 800,
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: '320px',
          background: '#1a1a1a',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 2000,
          overflow: 'hidden',
        }}>
          {/* Cabeçalho */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              Notificações
            </span>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  await supabase
                    .from('torcida_notifications')
                    .delete()
                    .eq('user_id', String(user.id));
                  setNotifications([]);
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: '11px',
                }}
              >
                Limpar tudo
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                Nenhuma notificação ainda
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  to="/torcida"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    textDecoration: 'none',
                    background: n.read ? 'transparent' : 'rgba(227, 6, 19, 0.06)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(227, 6, 19, 0.06)'; }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: n.type === 'like'
                      ? 'rgba(227,6,19,0.15)'
                      : n.type === 'comment'
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(34,197,94,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '16px',
                  }}>
                    {n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : '📢'}
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong>{n.actor_name}</strong>{' '}
                      {n.type === 'like'
                        ? 'curtiu uma publicação'
                        : n.type === 'comment'
                          ? 'comentou em uma publicação'
                          : 'criou uma nova publicação na Comunidade'}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatDate(n.created_at)}
                    </span>
                  </div>

                  {/* Ponto não lido */}
                  {!n.read && (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--accent-color)', flexShrink: 0, marginTop: '4px',
                    }} />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TorcidaNotificationBell;
