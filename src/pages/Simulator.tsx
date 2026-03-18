import { type FC, useState, useMemo, useEffect } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import ModalRegras from '../components/Modals/ModalRegras';
import SummaryPanel from '../components/Modals/SummaryPanel';
import { mockMatches, COURSE_EMBLEMS, type Match } from '../data/mockData';
import { CheckCircle, RotateCcw, Calendar, Trophy, Info, MapPin, Clock, Zap } from 'lucide-react';

interface Prediction {
    matchId: string;
    scoreA: number | '';
    scoreB: number | '';
}

const LS_KEY = 'jogos-unisanta-predictions';

const SET_SPORTS = ['Vôlei', 'Vôlei de Praia', 'Beach Tennis', 'Tênis de Mesa', 'Futevôlei'];
const EXCLUDED_SPORTS = ['Xadrez', 'Natação'];

interface ToastData {
    id: number;
    message: string;
    teamA: string;
    scoreA: number;
    teamB: string;
    scoreB: number;
}

const Simulator: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const [aberto, setAberto] = useState(false);
    const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
    const [activeTab, setActiveTab] = useState<'palpitar' | 'competicoes'>('palpitar');
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [predictionsFinalized, setPredictionsFinalized] = useState(false);

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
    };

    const savePredictions = () => {
        localStorage.setItem(LS_KEY, JSON.stringify(predictions));
        setPredictionsFinalized(true);
        showToast({
            message: 'Todos os palpites foram salvos!',
            teamA: 'BOLÃO',
            scoreA: filledCount,
            teamB: 'SALVO',
            scoreB: 1,
        });
        setTimeout(() => setPredictionsFinalized(false), 3000);
    };

    const resetPredictions = () => {
        setPredictions({});
        localStorage.removeItem(LS_KEY);
        setPredictionsFinalized(false);
    };

    const showToast = (data: Omit<ToastData, 'id'>) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...data, id }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
    };

    const filledCount = Object.values(predictions).filter(p => p.scoreA !== '' && p.scoreB !== '').length;

    // Calculate scoring stats
    const scoringStats = useMemo(() => {
        let totalPoints = 0;
        let exactScores = 0;
        let winners = 0;

        mockMatches.forEach(match => {
            const pred = predictions[match.id];
            if (pred && pred.scoreA !== '' && pred.scoreB !== '') {
                const predScoreA = Number(pred.scoreA);
                const predScoreB = Number(pred.scoreB);

                // Check if it's an exact score match
                if (match.status === 'finished' && predScoreA === match.scoreA && predScoreB === match.scoreB) {
                    exactScores++;
                    totalPoints += 3;
                }
                // Check if winner is correct (even if exact score is wrong)
                else if (match.status === 'finished') {
                    const predWinner = predScoreA > predScoreB ? 'A' : predScoreB > predScoreA ? 'B' : 'draw';
                    const actualWinner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : 'draw';
                    if (predWinner === actualWinner) {
                        winners++;
                        totalPoints += 1;
                    }
                }
            }
        });

        return { totalPoints, exactScores, winners };
    }, [predictions]);

    // ── helpers ──────────────────────────────────────────────
    const hoursUntil = (dateStr: string, timeStr: string): number => {
        const [h, m] = timeStr.split(':').map(Number);
        const target = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
        const diff = target.getTime() - Date.now();
        return Math.max(0, Math.floor(diff / 3_600_000));
    };

    const TeamEmblem = ({ teamName, size = 72 }: { teamName: string; size?: number }) => {
        const emblemUrl = getTeamEmblem(teamName);
        return emblemUrl ? (
            <img
                src={emblemUrl}
                alt={teamName}
                style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        ) : (
            <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.42,
            }}>
                ⚽
            </div>
        );
    };

    // +/- stepper control
    const MatchSimCard = ({ match, disabled }: { match: Match; disabled?: boolean }) => {
        const [cardSaved, setCardSaved] = useState(false);
        const pred = predictions[match.id];
        const hasPrediction = pred && pred.scoreA !== '' && pred.scoreB !== '';
        const isSetSport = SET_SPORTS.includes(match.sport);
        const hours = hoursUntil(match.date, match.time);

        const saveThisCard = () => {
            if (!hasPrediction) return;
            const next = { ...predictions };
            localStorage.setItem(LS_KEY, JSON.stringify(next));

            setCardSaved(true);
            setTimeout(() => setCardSaved(false), 3000);

            showToast({
                message: 'Palpite salvo!',
                teamA: match.teamA.name.split(' - ')[0],
                scoreA: Number(pred.scoreA),
                teamB: match.teamB.name.split(' - ')[0],
                scoreB: Number(pred.scoreB),
            });
        };

        const formatFullDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-');
            const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
            return `${day} DE ${months[parseInt(month) - 1]}. DE ${year}`;
        };

        return (
            <div className="sim-match-card" style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
            }}>
                {/* ── Header: Date/Time + Countdown ── */}
                <div style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                        {formatFullDate(match.date)}, {match.time}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffd700',
                    }}>
                        <Zap size={14} />
                        {hours === 0 ? 'EM BREVE' : `FALTA ${hours}H`}
                    </div>
                </div>

                {/* ── Central Area: Teams + Scoreboard ── */}
                <div style={{
                    padding: '32px 18px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '16px',
                }}>
                    {/* Team A and Score */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: disabled ? 0.5 : 1 }}>
                        <TeamEmblem teamName={match.teamA.name} size={80} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                disabled={disabled}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                                    fontSize: '16px',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s',
                                }}
                                onClick={() => !disabled && updatePrediction(match.id, 'scoreA', String(Math.max(0, (pred?.scoreA === '' ? 0 : Number(pred?.scoreA) ?? 0) - 1)))}
                                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.color = 'white'; }}
                            >
                                &lt;
                            </button>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                border: '2px solid white',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 900,
                                color: 'white',
                            }}>
                                {pred?.scoreA ?? 0}
                            </div>
                            <button
                                disabled={disabled}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                                    fontSize: '16px',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s',
                                }}
                                onClick={() => !disabled && updatePrediction(match.id, 'scoreA', String((pred?.scoreA === '' ? 0 : Number(pred?.scoreA) ?? 0) + 1))}
                                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.color = 'white'; }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>

                    {/* Center: Category and X */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.7)',
                            textTransform: 'uppercase',
                        }}>
                            {match.category}
                        </div>
                        <div style={{
                            fontSize: '28px',
                            fontWeight: 300,
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            ×
                        </div>
                    </div>

                    {/* Team B and Score */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: disabled ? 0.5 : 1 }}>
                        <TeamEmblem teamName={match.teamB.name} size={80} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                disabled={disabled}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                                    fontSize: '16px',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s',
                                }}
                                onClick={() => !disabled && updatePrediction(match.id, 'scoreB', String(Math.max(0, (pred?.scoreB === '' ? 0 : Number(pred?.scoreB) ?? 0) - 1)))}
                                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.color = 'white'; }}
                            >
                                &lt;
                            </button>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                border: '2px solid white',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 900,
                                color: 'white',
                            }}>
                                {pred?.scoreB ?? 0}
                            </div>
                            <button
                                disabled={disabled}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                                    fontSize: '16px',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s',
                                }}
                                onClick={() => !disabled && updatePrediction(match.id, 'scoreB', String((pred?.scoreB === '' ? 0 : Number(pred?.scoreB) ?? 0) + 1))}
                                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.color = 'white'; }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Set sport notice */}
                {isSetSport && (
                    <div style={{
                        margin: '0 18px 14px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(59,130,246,0.07)',
                        border: '1px solid rgba(59,130,246,0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#60a5fa',
                    }}>
                        <Info size={13} style={{ flexShrink: 0 }} />
                        Placar em sets (ex: 3 × 1)
                    </div>
                )}

                {/* ── Save button ── */}
                <div style={{ padding: '18px' }}>
                    <button
                        onClick={saveThisCard}
                        disabled={(!hasPrediction && !cardSaved) || disabled}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: disabled
                                ? 'rgba(255,255,255,0.05)'
                                : cardSaved
                                    ? '#1a7a3a'
                                    : hasPrediction
                                        ? '#dc2626'
                                        : 'rgba(255,255,255,0.08)',
                            color: disabled ? 'rgba(255,255,255,0.3)' : 'white',
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '1.2px',
                            cursor: (hasPrediction || cardSaved) && !disabled ? 'pointer' : 'not-allowed',
                            opacity: disabled ? 0.5 : (!hasPrediction && !cardSaved ? 0.5 : 1),
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textTransform: 'uppercase',
                        }}
                        onMouseEnter={(e) => { if ((hasPrediction || cardSaved) && !disabled) { e.currentTarget.style.backgroundColor = cardSaved ? '#15803d' : '#b91c1c'; e.currentTarget.style.opacity = '0.9'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = cardSaved ? '#1a7a3a' : (hasPrediction && !disabled ? '#dc2626' : 'rgba(255,255,255,0.08)'); e.currentTarget.style.opacity = disabled ? '0.5' : (!hasPrediction && !cardSaved) ? '0.5' : '1'; }}
                    >
                        {disabled
                            ? <>PALPITES FECHADOS</>
                            : cardSaved
                                ? <><CheckCircle size={16} /> PALPITE SALVO</>
                                : <>SALVAR PALPITE</>}
                    </button>
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
                    <div style={{ marginBottom: '0', display: 'flex', flexDirection: 'column' }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h1 style={{
                                fontSize: '38px',
                                fontWeight: 900,
                                margin: 0,
                                letterSpacing: '2px',
                                color: 'white',
                                textTransform: 'uppercase',
                                lineHeight: 1,
                            }}>BOLÃO</h1>
                            <button
                                onClick={() => setAberto(true)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    border: '1.5px solid rgba(255,255,255,0.3)',
                                    background: 'transparent',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                REGRAS
                            </button>
                        </div>

                        {/* Tab bar */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
                            {(['palpitar', 'competicoes'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '12px 20px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                                        color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        marginBottom: '-1px',
                                    }}
                                >
                                    {tab === 'palpitar' ? 'PALPITAR' : 'COMPETIÇÕES'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <SummaryPanel 
                        totalPoints={scoringStats.totalPoints} 
                        exactScores={scoringStats.exactScores} 
                        winners={scoringStats.winners} 
                    />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                        <button
                            onClick={resetPredictions}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: predictionsFinalized ? 'rgba(255,255,255,0.4)' : 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: predictionsFinalized ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                            }}
                            disabled={predictionsFinalized}
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
                                background: predictionsFinalized ? '#1a7a3a' : 'var(--accent-color)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.3s',
                                boxShadow: predictionsFinalized
                                    ? '0 2px 12px rgba(34,197,94,0.3)'
                                    : '0 2px 12px rgba(255,46,46,0.3)',
                            }}
                        >
                            {predictionsFinalized ? (
                                <><CheckCircle size={14} /> PALPITES FECHADOS</>
                            ) : (
                                <><CheckCircle size={14} /> Salvar Todos</>
                            )}
                        </button>
                    </div>

                    {/* Info banner when showing all */}
                    {/* Match cards grid */}
                    <div className="simulator-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                        gap: '20px',
                        alignItems: 'stretch',
                    }}>
                        {displayMatches.map(match => (
                            <MatchSimCard key={match.id} match={match} disabled={predictionsFinalized} />
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
            <ModalRegras aberto={aberto} setAberto={setAberto} />

            {/* ── Toast Stack ── */}
            <div style={{ position: 'fixed', bottom: '28px', right: '28px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999, pointerEvents: 'none' }}>
                {(toasts ?? []).map((toast) => (
                    <div
                        key={toast.id}
                        className="bolao-toast"
                        style={{
                            background: 'linear-gradient(135deg, #cc0000, #ff2e2e)',
                            borderRadius: '14px',
                            padding: '14px 18px',
                            boxShadow: '0 8px 32px rgba(255,46,46,0.45)',
                            minWidth: '240px',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <CheckCircle size={15} color="white" />
                            <span style={{ color: 'white', fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em' }}>PALPITE SALVO!</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 600, flex: 1, textAlign: 'left' }}>{toast.teamA}</span>
                            <span style={{ color: 'white', fontWeight: 900, fontSize: '20px', letterSpacing: '2px' }}>{toast.scoreA} × {toast.scoreB}</span>
                            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 600, flex: 1, textAlign: 'right' }}>{toast.teamB}</span>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes bolao-toast-in {
                    from { opacity: 0; transform: translateX(40px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)   scale(1); }
                }
                .bolao-toast { animation: bolao-toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    );
};

export default Simulator;
