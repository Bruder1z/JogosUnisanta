import { type FC, useState, useMemo, useEffect } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { mockMatches, COURSE_EMBLEMS, type Match } from '../data/mockData';
import { Zap, Save, CheckCircle, RotateCcw, Calendar, Trophy, Info } from 'lucide-react';

interface Prediction {
    matchId: string;
    scoreA: number | '';
    scoreB: number | '';
}

const LS_KEY = 'jogos-unisanta-predictions';

const SET_SPORTS = ['Vôlei', 'Vôlei de Praia', 'Beach Tennis', 'Tênis de Mesa', 'Futevôlei'];
const EXCLUDED_SPORTS = ['Xadrez', 'Natação'];

const Simulator: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
    const [saved, setSaved] = useState(false);

    const getTeamEmblem = (teamName: string) => {
        const foundCourse = Object.keys(COURSE_EMBLEMS).find(courseKey =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );
        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
    };

    // Filter today's matches (exclude finished)
    const todayMatches = useMemo(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - (offset * 60 * 1000));
        const todayStr = local.toISOString().split('T')[0];
        return mockMatches.filter(m => m.date === todayStr && m.status === 'scheduled' && !EXCLUDED_SPORTS.includes(m.sport));
    }, []);

    // Also show all scheduled matches if none today
    const displayMatches = useMemo(() => {
        if (todayMatches.length > 0) return todayMatches;
        return mockMatches.filter(m => m.status === 'scheduled' && !EXCLUDED_SPORTS.includes(m.sport));
    }, [todayMatches]);

    const showingAll = todayMatches.length === 0;

    // Load from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) {
                setPredictions(JSON.parse(stored));
            }
        } catch { /* ignore */ }
    }, []);

    const updatePrediction = (matchId: string, field: 'scoreA' | 'scoreB', value: string) => {
        const numVal = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        setPredictions(prev => ({
            ...prev,
            [matchId]: {
                matchId,
                scoreA: field === 'scoreA' ? numVal : (prev[matchId]?.scoreA ?? ''),
                scoreB: field === 'scoreB' ? numVal : (prev[matchId]?.scoreB ?? ''),
            }
        }));
        setSaved(false);
    };

    const savePredictions = () => {
        localStorage.setItem(LS_KEY, JSON.stringify(predictions));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const resetPredictions = () => {
        setPredictions({});
        localStorage.removeItem(LS_KEY);
    };

    const filledCount = Object.values(predictions).filter(p => p.scoreA !== '' && p.scoreB !== '').length;

    const TeamEmblem = ({ teamName, size = 48 }: { teamName: string; size?: number }) => {
        const emblemUrl = getTeamEmblem(teamName);
        return emblemUrl ? (
            <img
                src={emblemUrl}
                alt={teamName}
                style={{ width: size, height: size, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        ) : (
            <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'var(--bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.5,
            }}>
                ⚽
            </div>
        );
    };

    const ScoreInput = ({ matchId, field, value }: { matchId: string; field: 'scoreA' | 'scoreB'; value: number | '' }) => (
        <input
            className="sim-score-input"
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                updatePrediction(matchId, field, val);
            }}
            placeholder="-"
            style={{
                width: '60px',
                height: '60px',
                textAlign: 'center',
                lineHeight: '60px',
                padding: '0',
                fontSize: '24px',
                fontWeight: '900',
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid var(--border-color)',
                borderRadius: '16px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s',
                MozAppearance: 'textfield',
                WebkitAppearance: 'none',
                appearance: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,46,46,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
    );

    const MatchSimCard = ({ match }: { match: Match }) => {
        const pred = predictions[match.id];
        const hasPrediction = pred && pred.scoreA !== '' && pred.scoreB !== '';
        const isSetSport = SET_SPORTS.includes(match.sport);

        return (
            <div className="premium-card sim-match-card" style={{
                padding: '24px',
                transition: 'all 0.3s',
                border: hasPrediction ? '1px solid rgba(255,46,46,0.3)' : '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}>
                {/* Status badge */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                }}>
                    <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--text-secondary)',
                    }} />
                    {match.time}
                </div>

                {/* Sport & category */}
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{match.sport}</span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span>{match.category}</span>
                </div>

                {/* Teams and scores */}
                <div className="sim-matchup-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    {/* Team A */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <TeamEmblem teamName={match.teamA.name} size={48} />
                        <span style={{ fontSize: '13px', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                            {match.teamA.name.split(' - ')[0]}
                        </span>
                    </div>

                    {/* Score inputs */}
                    <div className="sim-score-inputs-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ScoreInput matchId={match.id} field="scoreA" value={pred?.scoreA ?? ''} />
                        <span style={{ fontSize: '20px', fontWeight: 300, color: 'var(--text-secondary)' }}>×</span>
                        <ScoreInput matchId={match.id} field="scoreB" value={pred?.scoreB ?? ''} />
                    </div>

                    {/* Team B */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <TeamEmblem teamName={match.teamB.name} size={48} />
                        <span style={{ fontSize: '13px', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                            {match.teamB.name.split(' - ')[0]}
                        </span>
                    </div>
                </div>

                {/* Set sport notice */}
                {isSetSport && (
                    <div style={{
                        marginTop: '16px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#60a5fa',
                    }}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        Placar em sets (ex: 3 × 1)
                    </div>
                )}

                {/* Match info */}
                <div style={{
                    marginTop: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                }}>
                    <span>📍 {match.location}</span>
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} className="simulator-root">
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {/* Page header */}
                    <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, var(--accent-color), #ff6b35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 25px rgba(255, 46, 46, 0.4)',
                            marginBottom: '16px'
                        }}>
                            <Zap size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Simulador</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '16px', fontWeight: 500 }}>
                            Dê seus palpites nos jogos de hoje
                        </p>
                    </div>

                    {/* Stats bar */}
                    <div className="premium-card simulator-stats-bar" style={{
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px',
                    }}>
                        <div style={{ display: 'flex', gap: '24px' }} className="simulator-stats-metrics">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={16} color="var(--text-secondary)" />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'white' }}>{displayMatches.length}</strong> jogos
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={16} color="var(--text-secondary)" />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'white' }}>{filledCount}</strong> palpites
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }} className="simulator-stats-actions">
                            <button
                                onClick={resetPredictions}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <RotateCcw size={14} />
                                Limpar
                            </button>
                            <button
                                onClick={savePredictions}
                                className="hover-glow"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: saved ? '#00c853' : 'var(--accent-color)',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 2px 12px rgba(255,46,46,0.3)',
                                }}
                            >
                                {saved ? <><CheckCircle size={14} /> Salvo!</> : <><Save size={14} /> Salvar Palpites</>}
                            </button>
                        </div>
                    </div>

                    {/* Info banner when showing all */}
                    {showingAll && (
                        <div style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            background: 'rgba(255,165,0,0.08)',
                            border: '1px solid rgba(255,165,0,0.2)',
                            marginBottom: '24px',
                            fontSize: '13px',
                            color: '#ffaa00',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <Calendar size={16} />
                            Não há jogos programados para hoje. Mostrando todos os jogos disponíveis para palpites.
                        </div>
                    )}

                    {/* Match cards grid */}
                    <div className="simulator-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                        gap: '20px',
                        alignItems: 'stretch',
                    }}>
                        {displayMatches.map(match => (
                            <MatchSimCard key={match.id} match={match} />
                        ))}
                    </div>

                    {displayMatches.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <p>Nenhum jogo disponível para simulação.</p>
                        </div>
                    )}
                </div>
                <style>{`
                    @media (max-width: 768px) {
                        .simulator-root main {
                            padding: 14px !important;
                        }

                        .simulator-stats-bar {
                            flex-direction: column;
                            align-items: stretch !important;
                            gap: 12px;
                            padding: 14px !important;
                        }

                        .simulator-stats-metrics {
                            justify-content: space-between;
                            gap: 12px !important;
                        }

                        .simulator-stats-actions {
                            width: 100%;
                        }

                        .simulator-stats-actions button {
                            flex: 1;
                            justify-content: center;
                        }

                        .simulator-grid {
                            grid-template-columns: 1fr !important;
                        }

                        .sim-match-card {
                            padding: 18px 12px !important;
                        }

                        .sim-matchup-row {
                            gap: 8px !important;
                        }

                        .sim-score-inputs-row {
                            gap: 8px !important;
                        }

                        .sim-score-input {
                            width: 52px !important;
                            height: 52px !important;
                            line-height: 52px !important;
                            font-size: 20px !important;
                        }

                        .sim-match-card {
                            overflow: hidden;
                        }
                    }

                    @media (max-width: 480px) {
                        .simulator-stats-metrics {
                            flex-wrap: wrap;
                        }

                        .simulator-stats-actions {
                            flex-direction: row;
                        }

                        .sim-matchup-row {
                            display: grid !important;
                            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
                            align-items: center;
                        }

                        .sim-match-card span {
                            word-break: break-word;
                        }
                    }

                    @media (max-width: 390px) {
                        .simulator-root main {
                            padding: 10px !important;
                        }

                        .simulator-root h1 {
                            font-size: 2rem !important;
                            letter-spacing: -0.02em !important;
                        }

                        .simulator-root p {
                            font-size: 0.95rem !important;
                        }

                        .simulator-stats-actions {
                            flex-direction: column !important;
                        }

                        .simulator-stats-actions button {
                            width: 100%;
                        }

                        .sim-matchup-row {
                            grid-template-columns: minmax(0, 1fr) 108px minmax(0, 1fr) !important;
                        }

                        .sim-score-input {
                            width: 44px !important;
                            height: 44px !important;
                            line-height: 44px !important;
                            font-size: 17px !important;
                            border-radius: 12px !important;
                        }

                        .sim-score-inputs-row {
                            gap: 5px !important;
                        }

                        .simulator-grid {
                            gap: 14px !important;
                        }
                    }
                `}</style>
            </main>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

export default Simulator;
