import { type FC, useState, useMemo } from 'react';
import { User as UserIcon, Trophy, LayoutDashboard, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ProfileModal from '../Modals/ProfileModal';
import { mockMatches } from '../../data/mockData';

const Header: FC = () => {
    const { user, openLoginModal } = useAuth();
    const { toggle } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const showAdminShortcut = user?.role === 'superadmin' && location.pathname !== '/';

    const isActive = (path: string) => location.pathname === path;

    const totalPoints = useMemo(() => {
        if (!user) return 0;
        try {
            const stored = localStorage.getItem('jogos-unisanta-predictions');
            if (!stored) return 0;
            const predictions = JSON.parse(stored);
            let points = 0;
            mockMatches.forEach(match => {
                if (match.status === 'finished') {
                    const pred = predictions[match.id];
                    if (pred && pred.scoreA !== '' && pred.scoreB !== '') {
                        if (Number(pred.scoreA) === match.scoreA && Number(pred.scoreB) === match.scoreB) {
                            points += 1;
                        }
                    }
                }
            });
            return points;
        } catch {
            return 0;
        }
    }, [user, showProfile]); // Also update when profile closes to catch new points

    return (
        <>
            <header className="glass" style={{
                height: 'var(--header-height)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--header-padding)',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Hamburger - visível só no mobile */}
                    <button
                        className="mobile-menu-btn"
                        onClick={toggle}
                        style={{
                            color: 'var(--text-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                        }}
                    >
                        <Menu size={24} />
                    </button>

                    <Link to="/" style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '-1px', textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--accent-color)' }}>JOGOS</span> UNISANTA
                    </Link>

                    <nav className="header-desktop-nav" style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 500, marginLeft: '28px' }}>
                        <Link to="/" style={{
                            color: isActive('/') ? 'var(--text-primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}>Resultados</Link>
                        <Link to="/participantes" style={{
                            color: isActive('/participantes') ? 'var(--text-primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}>Participantes</Link>
                        <Link to="/noticias" style={{
                            color: isActive('/noticias') ? 'var(--text-primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}>Notícias</Link>
                        {user?.role === 'superadmin' && (
                            <Link to="/controle-partida" style={{
                                color: isActive('/controle-partida') ? 'var(--text-primary)' : 'var(--text-secondary)',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                                fontWeight: 700
                            }}>Controle de Partida</Link>
                        )}
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="header-user-pts" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffd700', fontSize: '13px', fontWeight: 700, marginRight: '10px' }}>
                                    <Trophy size={14} /> {totalPoints} {totalPoints === 1 ? 'pt' : 'pts'}
                                </div>

                                {showAdminShortcut && (
                                    <button
                                        title="Dashboard Admin"
                                        onClick={() => navigate('/?view=admin')}
                                        style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <LayoutDashboard size={20} />
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowProfile(true)}
                                    title="Meu Perfil"
                                    style={{
                                        color: 'var(--text-secondary)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                >
                                    <UserIcon size={24} color="#ccc" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Botão completo - desktop */}
                            <button
                                onClick={openLoginModal}
                                className="header-login-text"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 'var(--border-radius)',
                                    background: 'var(--accent-color)',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Login / Cadastro
                            </button>
                            {/* Apenas ícone - mobile */}
                            <button
                                onClick={openLoginModal}
                                className="header-login-icon-only"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'none',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)'
                                }}
                                title="Entrar"
                            >
                                <UserIcon size={24} color="#ccc" />
                            </button>
                        </div>
                    )}
                </div>
            </header>
            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        </>
    );
};

export default Header;
