import { type FC, useState, useMemo, useEffect } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { mockMatches, COURSE_EMBLEMS, type Match } from '../data/mockData';
import { CheckCircle, RotateCcw, Calendar, Trophy, Info, MapPin, Clock } from 'lucide-react';

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
    const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
    const [activeTab, setActiveTab] = useState<'palpitar' | 'competicoes'>('palpitar');
    const [toasts, setToasts] = useState<ToastData[]>([]);

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
    };

    const resetPredictions = () => {
        setPredictions({});
        localStorage.removeItem(LS_KEY);
    };

    const showToast = (data: Omit<ToastData, 'id'>) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...data, id }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
    };

    const filledCount = Object.values(predictions).filter(p => p.scoreA !== '' && p.scoreB !== '').length;

    // ── helpers ──────────────────────────────────────────────
    const formatMatchDate = (dateStr: string, timeStr: string) => {
        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const [, month, day] = dateStr.split('-').map(Number);
        return `${day} de ${months[month - 1]}. ${timeStr}`;
    };

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
    const ScoreStepper = ({ matchId, field, value }: { matchId: string; field: 'scoreA' | 'scoreB'; value: number | '' }) => {
        const num = value === '' ? 0 : Number(value);
        const btnStyle: React.CSSProperties = {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
        };
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    style={btnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onClick={() => updatePrediction(matchId, field, String(Math.max(0, num - 1)))}
                >&lt;</button>
                <span style={{
                    minWidth: '36px',
                    textAlign: 'center',
                    fontSize: '32px',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                }}>{value === '' ? '0' : value}</span>
                <button
                    style={btnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onClick={() => updatePrediction(matchId, field, String(num + 1))}
                >&gt;</button>
            </div>
        );
    };

    const MatchSimCard = ({ match }: { match: Match }) => {
        const [cardSaved, setCardSaved] = useState(false);
        const pred = predictions[match.id];
        const hasPrediction = pred && pred.scoreA !== '' && pred.scoreB !== '';
        const isSetSport = SET_SPORTS.includes(match.sport);
        const hours = hoursUntil(match.date, match.time);

        const saveThisCard = () => {
            if (!hasPrediction) return;
            // persist full predictions (including this card's current values)
            const next = { ...predictions };
            localStorage.setItem(LS_KEY, JSON.stringify(next));

            // per-card "saved" flash
            setCardSaved(true);
            setTimeout(() => setCardSaved(false), 3000);

            // show global toast
            showToast({
                message: 'Palpite salvo!',
                teamA: match.teamA.name.split(' - ')[0],
                scoreA: Number(pred.scoreA),
                teamB: match.teamB.name.split(' - ')[0],
                scoreB: Number(pred.scoreB),
            });
        };

        return (
            <div className="sim-match-card" style={{
                background: '#1a1a1a',
                border: hasPrediction ? '1px solid rgba(255,46,46,0.35)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.3s',
            }}>
                {/* ── Header strip ── */}
                <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Sport + category */}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-color)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {match.sport} · {match.category}
                        </span>
                        {/* Date/time row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                                <Clock size={12} />
                                {formatMatchDate(match.date, match.time)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                                <MapPin size={12} />
                                {match.location}
                            </span>
                        </div>
                    </div>
                    {/* Countdown badge */}
                    <div style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: hours <= 3 ? 'rgba(255,46,46,0.15)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${hours <= 3 ? 'rgba(255,46,46,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        fontSize: '11px',
                        fontWeight: 700,
                        color: hours <= 3 ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.04em',
                    }}>
                        {hours === 0 ? 'EM BREVE' : `FALTA ${hours}H`}
                    </div>
                </div>

                {/* ── Teams + Scores ── */}
                <div style={{ padding: '24px 18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {/* Team A */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <TeamEmblem teamName={match.teamA.name} size={72} />
                        <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, color: 'rgba(255,255,255,0.9)' }}>
                            {match.teamA.name.split(' - ')[0]}
                        </span>
                    </div>

                    {/* Score steppers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <ScoreStepper matchId={match.id} field="scoreA" value={pred?.scoreA ?? 0} />
                        <span style={{ fontSize: '22px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>×</span>
                        <ScoreStepper matchId={match.id} field="scoreB" value={pred?.scoreB ?? 0} />
                    </div>

                    {/* Team B */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <TeamEmblem teamName={match.teamB.name} size={72} />
                        <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, color: 'rgba(255,255,255,0.9)' }}>
                            {match.teamB.name.split(' - ')[0]}
                        </span>
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
                <div style={{ padding: '0 18px 18px', marginTop: 'auto' }}>
                    <button
                        onClick={saveThisCard}
                        disabled={!hasPrediction && !cardSaved}
                        style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '10px',
                            border: 'none',
                            background: cardSaved
                                ? 'linear-gradient(135deg, #1a7a3a, #22c55e)'
                                : hasPrediction
                                    ? 'linear-gradient(135deg, #cc0000, var(--accent-color))'
                                    : 'rgba(255,255,255,0.06)',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '1.2px',
                            cursor: hasPrediction || cardSaved ? 'pointer' : 'not-allowed',
                            opacity: !hasPrediction && !cardSaved ? 0.45 : 1,
                            transition: 'all 0.3s',
                            boxShadow: cardSaved
                                ? '0 4px 20px rgba(34,197,94,0.35)'
                                : hasPrediction
                                    ? '0 4px 20px rgba(255,46,46,0.35)'
                                    : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                        onMouseEnter={(e) => { if (hasPrediction || cardSaved) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = (!hasPrediction && !cardSaved) ? '0.45' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {cardSaved
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
                                    background: 'var(--accent-color)',
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
                                {<><CheckCircle size={14} /> Salvar Todos</>}
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
