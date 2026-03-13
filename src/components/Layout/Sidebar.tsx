import { useState, type FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Trophy,
    ChevronRight,
    History,
    LayoutGrid,
    Calendar,
    X,
    Download
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

interface SidebarProps {
    onShowModalities?: () => void;
    onSelectSport?: (sport: string) => void;
    onShowRanking?: () => void;
}

const Sidebar: FC<SidebarProps> = ({ onShowModalities, onSelectSport, onShowRanking }) => {
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { isOpen, close } = useSidebar();

    const principalSports = [
        { name: 'Futsal', icon: '⚽' },
        { name: 'Futebol Society', icon: '⚽' },
        { name: 'Basquete 3x3', icon: '🏀' },
        { name: 'Vôlei', icon: '🏐' },
        { name: 'Handebol', icon: '🤾' },
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
            {/* Backdrop overlay no mobile */}
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
                {/* Navegação principal - visível apenas no mobile */}
                <div className="sidebar-mobile-nav">
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.05em' }}>NAVEGAÇÃO</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <Link to="/" onClick={close} className="sidebar-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>🏠</span> Resultados
                        </Link>
                        <Link to="/participantes" onClick={close} className="sidebar-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>👥</span> Participantes
                        </Link>
                        <Link to="/noticias" onClick={close} className="sidebar-link" style={{ padding: '10px 0', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '16px' }}>📰</span> Notícias
                        </Link>
                    </div>
                </div>

                <div style={{ padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '14px' }}>
                        <Trophy size={18} />
                        ESPORTES
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
                            MODALIDADES
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
                        onClick={() => { onShowRanking?.(); close(); }}
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
                    <Link to="/historia" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>📖</span> História dos Jogos
                    </Link>
                    <Link to="/transmissao" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>📺</span> Transmissão
                    </Link>
                    <Link to="/controle-partida" onClick={close} className="sidebar-link" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '16px' }}>⚽</span> Controle de Partida
                    </Link>

                    <button
                        onClick={() => setIsCalendarModalOpen(true)}
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
                        <Calendar size={16} />
                        Calendário dos Jogos
                    </button>

                    <Link to="/simulador" onClick={close} style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>⚡ Simulador</Link>
                </div>

                <style>{`
        .sidebar-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary) !important;
        }
      `}</style>
                {isCalendarModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                        backdropFilter: 'blur(4px)'
                    }} onClick={() => setIsCalendarModalOpen(false)}>
                        <div style={{
                            background: 'var(--bg-main, #1a1a1a)',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '450px',
                            padding: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--border-color, #333)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            position: 'relative',
                            color: 'var(--text-primary, #fff)'
                        }} onClick={(e) => e.stopPropagation()}>

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: 'var(--accent-color, #ef4444)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    lineHeight: '1.4'
                                }}>
                                    <span>📅</span> Calendário Oficial - Jogos Unisanta 2025
                                </h2>
                                <button
                                    onClick={() => setIsCalendarModalOpen(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'var(--text-secondary, #a1a1aa)',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)';
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Info Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>📍</span>
                                        <strong style={{ color: 'var(--accent-color, #ef4444)', fontSize: '1rem', fontWeight: '800' }}>Locais Principais:</strong>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px', fontSize: '0.95rem', color: '#e5e7eb', lineHeight: 1.8 }}>
                                        <div>🏟️ Centro de Treinamento</div>
                                        <div>🏟️ Poliesportivo Unisanta (Bloco M)</div>
                                        <div>🏟️ Laerte Gonçalves (Bloco D)</div>
                                        <div>🏟️ Arena Unisanta</div>
                                        <div>🏟️ Rebouças</div>
                                        <div>🏟️ Bloco A</div>
                                        <div>🏊 Piscina Olímpica</div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>📅</span>
                                    <strong style={{ color: '#fff', fontSize: '1rem', marginRight: '8px' }}>Período:</strong>
                                    <span style={{ color: '#d1d5db', fontSize: '0.95rem' }}>04 a 22 de maio de 2026</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <a
                                href="/pdf/tabela-jogos-2026.pdf"
                                download="tabela-jogos-2026.pdf"
                                onClick={(e) => {
                                    const target = e.currentTarget;
                                    fetch(target.href, { method: 'HEAD' })
                                        .then(res => {
                                            if (!res.ok) {
                                                e.preventDefault();
                                                console.error('O arquivo da tabela oficial ainda não está disponível no servidor');
                                                alert('O arquivo da tabela oficial ainda não está disponível no servidor');
                                            }
                                        })
                                        .catch(() => {
                                            e.preventDefault();
                                            console.error('O arquivo da tabela oficial ainda não está disponível no servidor');
                                            alert('O arquivo da tabela oficial ainda não está disponível no servidor');
                                        });
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    background: 'var(--accent-color, #ef4444)',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    padding: '14px 24px',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    marginTop: '8px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                                }}
                            >
                                <Download size={20} />
                                BAIXAR TABELA OFICIAL (PDF)
                            </a>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
