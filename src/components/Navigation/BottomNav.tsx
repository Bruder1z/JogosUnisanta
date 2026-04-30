import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Grid } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const BottomNav: FC = () => {
    const location = useLocation();
    const { toggle } = useSidebar();
    const { user } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    // Navegação diferente para Super Admin
    const navItems = user?.role === 'superadmin' 
        ? [
            { path: '/', icon: Home, label: 'Home' },
            { path: '/controle-partida', emoji: '⚙️', label: 'Controle' },
            { path: '/', icon: Trophy, label: 'Resultados' },
        ]
        : [
            { path: '/', icon: Home, label: 'Home' },
            { path: '/calendario', emoji: '📅', label: 'Calendário' },
            { path: '/', icon: Trophy, label: 'Resultados' },
            { path: '/bolao', emoji: '⚡', label: 'Palpitômetro' },
        ];

    return (
        <nav className="bottom-nav" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            display: 'none',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 8px',
            zIndex: 1000,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
        }}>
            {navItems.map((item, index) => (
                <Link
                    key={index}
                    to={item.path}
                    className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        flex: 1,
                        minHeight: '44px',
                        textDecoration: 'none',
                        color: isActive(item.path) ? 'var(--accent-color)' : 'var(--text-secondary)',
                        transition: 'color 0.2s',
                        fontSize: '11px',
                        fontWeight: isActive(item.path) ? 700 : 500,
                        position: 'relative'
                    }}
                >
                    {item.emoji ? (
                        <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                    ) : item.icon && (
                        <item.icon 
                            size={22} 
                            strokeWidth={isActive(item.path) ? 2.5 : 2}
                        />
                    )}
                    <span style={{ fontSize: '10px' }}>{item.label}</span>
                    {isActive(item.path) && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '3px',
                            background: 'var(--accent-color)',
                            borderRadius: '0 0 3px 3px'
                        }} />
                    )}
                </Link>
            ))}

            <button
                onClick={toggle}
                className="bottom-nav-item"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flex: 1,
                    minHeight: '44px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: 0
                }}
            >
                <Grid size={22} strokeWidth={2} />
                <span style={{ fontSize: '10px' }}>Mais</span>
            </button>

            <style>{`
                @media (max-width: 768px) {
                    .bottom-nav {
                        display: flex !important;
                    }
                }

                .bottom-nav-item:active {
                    transform: scale(0.95);
                }
            `}</style>
        </nav>
    );
};

export default BottomNav;
