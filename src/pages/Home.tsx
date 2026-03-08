import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import MatchCard from '../components/Match/MatchCard';
import MatchModal from '../components/Match/MatchModal';
import ModalitiesModal from '../components/Modals/ModalitiesModal';
import RankingModal from '../components/Modals/RankingModal';
import Login from './Login';
import AdminDashboard from '../components/Admin/AdminDashboard';
import { mockMatches, mockNews, type Match } from '../data/mockData';
import Countdown from '../components/Layout/Countdown';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    ChevronDown,
    Award
} from 'lucide-react';

const Home: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false);
    const [showModalities, setShowModalities] = useState(false);
    const [showRanking, setShowRanking] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Masculino' | 'Feminino'>('Todos');
    const [selectedDate, setSelectedDate] = useState<'Todos' | 'Ontem' | 'Hoje' | 'Amanhã'>('Hoje');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    const [activeView, setActiveView] = useState<'public' | 'admin'>('public');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sportParam = params.get('sport');
        const modalitiesParam = params.get('modalities');

        if (sportParam) {
            setSelectedSport(decodeURIComponent(sportParam));
            setSelectedCategory('Todos');
            // Remove params from URL after reading
            navigate(location.pathname, { replace: true });
        } else if (modalitiesParam === 'true') {
            setShowModalities(true);
            // Remove params from URL after reading
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, navigate, location.pathname]);

    const filteredMatches = mockMatches.filter(m => {
        const sportMatch = !selectedSport || m.sport === selectedSport;
        const categoryMatch = selectedCategory === 'Todos' || m.category === selectedCategory;

        let dateMatch = true;
        if (selectedDate !== 'Todos') {
            const targetDate = new Date();
            // Assuming local timezone for date formatting matching mock data "2026-03-04"
            if (selectedDate === 'Ontem') targetDate.setDate(targetDate.getDate() - 1);
            if (selectedDate === 'Amanhã') targetDate.setDate(targetDate.getDate() + 1);

            const offset = targetDate.getTimezoneOffset();
            const targetDateLocal = new Date(targetDate.getTime() - (offset * 60 * 1000));
            const dateStr = targetDateLocal.toISOString().split('T')[0];

            dateMatch = m.date === dateStr;
        }

        return sportMatch && categoryMatch && dateMatch;
    });

    const liveMatches = filteredMatches.filter(m => m.status === 'live');
    const upcomingMatches = filteredMatches.filter(m => m.status === 'scheduled');
    const finishedMatches = filteredMatches.filter(m => m.status === 'finished');

    const randomHighlight = useMemo(() => {
        return mockNews[Math.floor(Math.random() * mockNews.length)];
    }, []);

    return (
        <div style={{ minHeight: '100vh' }}>
            <Header />
            {!user && (
                <div style={{ position: 'fixed', top: '12px', right: '24px', zIndex: 1100 }}>
                    <button
                        onClick={() => setShowLogin(true)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--border-radius)',
                            background: 'var(--accent-color)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        Login / Cadastro
                    </button>
                </div>
            )}

            <Sidebar
                onShowModalities={() => setShowModalities(true)}
                onSelectSport={(sport) => {
                    setSelectedSport(sport);
                    setSelectedCategory('Todos');
                }}
                onShowRanking={() => setShowRanking(true)}
            />

            <main style={{
                marginLeft: 'var(--sidebar-width)',
                marginTop: 'var(--header-height)',
                padding: '30px',
            }}>
                {user?.role === 'superadmin' && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <button
                            onClick={() => setActiveView('public')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '14px',
                                background: activeView === 'public' ? 'var(--accent-color)' : 'var(--bg-card)',
                                color: activeView === 'public' ? 'white' : 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            VISÃO PÚBLICA
                        </button>
                        <button
                            onClick={() => setActiveView('admin')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '14px',
                                background: activeView === 'admin' ? 'var(--accent-color)' : 'var(--bg-card)',
                                color: activeView === 'admin' ? 'white' : 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            PAINEL ADMIN
                        </button>
                    </div>
                )}

                {activeView === 'admin' && user?.role === 'superadmin' ? (
                    <AdminDashboard />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
                        {/* Left Column: Matches */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
                                        {selectedSport ? selectedSport : 'Jogos de Hoje'}
                                    </h1>
                                    {selectedSport && (
                                        <button
                                            onClick={() => setSelectedSport(null)}
                                            style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Ver todos os jogos
                                        </button>
                                    )}
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'var(--bg-card)',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                color: 'var(--text-secondary)',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Calendar size={14} />
                                            <span>
                                                {selectedDate === 'Todos' ? 'Todas as Datas' : selectedDate}
                                            </span>
                                            <ChevronDown size={14} />
                                        </button>

                                        {showDateDropdown && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                                                    onClick={() => setShowDateDropdown(false)}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    marginTop: '4px',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    zIndex: 100,
                                                    minWidth: '150px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                                }}>
                                                    {(['Todos', 'Ontem', 'Hoje', 'Amanhã'] as const).map(option => (
                                                        <button
                                                            key={option}
                                                            onClick={() => {
                                                                setSelectedDate(option);
                                                                setShowDateDropdown(false);
                                                            }}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                padding: '10px 15px',
                                                                textAlign: 'left',
                                                                background: selectedDate === option ? 'var(--bg-hover)' : 'transparent',
                                                                color: selectedDate === option ? 'var(--accent-color)' : 'var(--text-primary)',
                                                                border: 'none',
                                                                fontSize: '13px',
                                                                fontWeight: selectedDate === option ? 700 : 500,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {option === 'Todos' ? 'Todas as Datas' : option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    {(['Todos', 'Masculino', 'Feminino'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                background: selectedCategory === cat ? 'var(--accent-color)' : 'transparent',
                                                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {cat.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {liveMatches.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: 'var(--live-color)',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        marginBottom: '15px'
                                    }}>
                                        AO VIVO AGORA
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {liveMatches.map(match => (
                                            <MatchCard
                                                key={match.id}
                                                match={match}
                                                onClick={() => setSelectedMatch(match)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: 'var(--text-secondary)',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    marginBottom: '15px'
                                }}>
                                    PRÓXIMAS PARTIDAS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {upcomingMatches.map(match => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            onClick={() => setSelectedMatch(match)}
                                        />
                                    ))}
                                </div>
                            </div>
                            {finishedMatches.length > 0 && (
                                <div style={{ marginTop: '40px' }}>
                                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Award size={16} /> JOGOS ENCERRADOS
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {finishedMatches.map(match => (
                                            <MatchCard key={match.id} match={match} onClick={() => setSelectedMatch(match)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {liveMatches.length === 0 && upcomingMatches.length === 0 && finishedMatches.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                                    <Calendar size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                    <p>Nenhum jogo encontrado para este filtro.</p>
                                </div>
                            )}
                        </section>

                        {/* Right Column: Mini Tables / Stats */}
                        <aside>
                            <Countdown />

                            <div className="premium-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>DESTAQUES DO DIA</h3>
                                <a
                                    href={randomHighlight.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden', position: 'relative', cursor: 'pointer' }} className="hover-glow">
                                        <img
                                            src={randomHighlight.image || "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60"}
                                            alt={randomHighlight.title}
                                            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: '15px',
                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.95))'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '4px' }}>NOTÍCIA</div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.4' }}>{randomHighlight.title}</div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </aside>
                    </div>
                )}
            </main>

            {showLogin && <Login onClose={() => setShowLogin(false)} />}
            {showModalities && (
                <ModalitiesModal
                    onClose={() => setShowModalities(false)}
                    onSelectSport={(sport) => {
                        setSelectedSport(sport);
                        setSelectedCategory('Todos');
                    }}
                />
            )}
            {showRanking && (
                <RankingModal onClose={() => setShowRanking(false)} />
            )}
            {selectedMatch && (
                <MatchModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
};

export default Home;
