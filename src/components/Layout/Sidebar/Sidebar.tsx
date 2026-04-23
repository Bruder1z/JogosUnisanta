import { type FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Trophy,
    ChevronRight,
    History,
    LayoutGrid,
    Calendar
} from 'lucide-react';
import { useSidebar } from '../../../context/SidebarContext';
import { useAuth } from '../../../context/AuthContext';
import { type SidebarProps } from './Sidebar.types';
import './Sidebar.css';

const Sidebar: FC<SidebarProps> = ({ onShowModalities, onSelectSport, onShowRanking }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { isOpen, close } = useSidebar();

    const principalSports = [
        { name: 'Futsal', icon: '⚽' },
        { name: 'Futebol Society', icon: '⚽' },
        { name: 'Basquete 3x3', icon: '🏀' },
        { name: 'Vôlei', icon: '🏐' },
        { name: 'Handebol', icon: '🤾' }
    ];

    const handleSelectSport = (sport: string) => {
        close();
        if (location.pathname === '/') {
            onSelectSport?.(sport);
        } else {
            navigate(`/?sport=${encodeURIComponent(sport)}`);
        }
    };

    const handleShowModalities = () => {
        close();
        if (location.pathname === '/') {
            onShowModalities?.();
        } else {
            navigate('/?modalities=true');
        }
    };

    return (
        <>
            <div
                className={`sidebar-backdrop${isOpen ? ' active' : ''}`}
                onClick={close}
                aria-hidden="true"
            />

            <aside className={`app-sidebar${isOpen ? ' sidebar-open' : ''}`} style={{
                width: 'var(--sidebar-width)',
                position: 'fixed',
                top: 'var(--header-height)',
                left: 0,
                bottom: 0,
                background: 'var(--bg-main)',
                borderRight: '1px solid var(--border-color)',
                padding: '20px 0',
                overflowY: 'auto',
                zIndex: 40
            }}>
                <div className="sidebar-mobile-nav">
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.05em' }}>NAVEGAÇÃO</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <Link to="/" onClick={close} className="sidebar-link sidebar-mobile-nav-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>🏠</span>
                            <span className="sidebar-mobile-nav-label">Resultados</span>
                        </Link>
                        <Link to="/participantes" onClick={close} className="sidebar-link sidebar-mobile-nav-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>👥</span>
                            <span className="sidebar-mobile-nav-label">Participantes</span>
                        </Link>
                        <Link to="/noticias" onClick={close} className="sidebar-link sidebar-mobile-nav-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>📰</span>
                            <span className="sidebar-mobile-nav-label">Notícias</span>
                        </Link>
                        <Link to="/palpitometro" onClick={close} className="sidebar-link sidebar-mobile-nav-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>⚡</span>
                            <span className="sidebar-mobile-nav-label">Palpitômetro</span>
                        </Link>
                        {user?.role === 'superadmin' && (
                            <Link to="/controle-partida" onClick={close} className="sidebar-link sidebar-mobile-nav-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontWeight: 700 }}>
                                <span className="sidebar-mobile-nav-label">Controle de Partida</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div style={{ padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '14px' }}>
                        <Trophy size={18} />
                        MODALIDADES
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {principalSports.map((sport) => (
                        <div
                            key={sport.name}
                            onClick={() => handleSelectSport(sport.name)}
                            className="sidebar-link"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '18px' }}>{sport.icon}</span>
                                {sport.name}
                            </div>
                            <ChevronRight size={14} opacity={0.5} />
                        </div>
                    ))}

                    <button
                        onClick={handleShowModalities}
                        className="sidebar-link"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--accent-color)',
                            background: 'none',
                            border: 'none',
                            width: '100%',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <LayoutGrid size={18} />
                            VER TODAS MODALIDADES
                        </div>
                        <ChevronRight size={14} opacity={0.5} />
                    </button>
                </div>

                <div style={{ marginTop: '30px', padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '13px' }}>
                        <History size={16} />
                        COMPETIÇÃO
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '20px' }}>
                    <button
                        onClick={() => {
                            close();
                            if (location.pathname === '/') {
                                onShowRanking?.();
                            } else {
                                navigate('/?ranking=true');
                            }
                        }}
                        className="sidebar-link"
                        style={{
                            padding: '10px 20px',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>🏆</span> Classificação Geral
                    </button>
                    <Link to="/melhores-atletas" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>🎖️</span> Melhores Atletas
                    </Link>
                    <Link to="/estatisticas" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>📊</span> Estatísticas
                    </Link>
                    <Link to="/historia" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>📖</span> História dos Jogos
                    </Link>
                    <Link to="/transmissao" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>📺</span> Transmissão
                    </Link>
                    <Link
                        to="/calendario"
                        onClick={close}
                        className="sidebar-link"
                        style={{
                            padding: '10px 20px',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Calendar size={16} />
                        Calendário dos Jogos
                    </Link>

                </div>
            </aside>
        </>
    );
};

export default Sidebar;
