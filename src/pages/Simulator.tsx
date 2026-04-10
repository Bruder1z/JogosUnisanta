import { useNotification } from '../components/NotificationContext';
import { type FC, useState, useMemo, useEffect, useRef } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import ModalRegras from '../components/Modals/ModalRegras';
import BolaoRankingModal from '../components/Modals/BolaoRankingModal';
import LigaCard from '../components/Cards/LigaCard';
import { COURSE_EMBLEMS, type Match } from '../data/mockData';
import { useAuth, type Prediction } from '../context/AuthContext';
import { useData } from '../components/context/DataContext';
import { 
    Users,
    CheckCircle, RotateCcw, Calendar, Zap
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import LeagueDetailsModal from '../components/Modals/LeagueDetailsModal.tsx';
import LeagueFormModal from '../components/Modals/LeagueFormModal';
import JoinLeagueModal from '../components/Modals/JoinLeagueModal';

const EXCLUDED_SPORTS = ['Xadrez', 'Natação'];

interface ToastData {
    id: number;
    message: string;
    teamA: string;
    scoreA: number;
    teamB: string;
    scoreB: number;
}


// ── Module-level pure helpers (stable references, no re-creation on parent re-render) ──

// Place this inside your main Simulator component:
// const { showNotification } = useNotification();

const msUntil = (dateStr: string, timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    return target.getTime() - Date.now();
};

const getTeamEmblem = (team: { name: string; course?: string; faculty?: string }) => {
    const searchTerms: string[] = [];
    if (team.course && team.faculty) searchTerms.push(`${team.course} - ${team.faculty}`);
    if (team.course) searchTerms.push(team.course);
    searchTerms.push(team.name);
    for (const term of searchTerms) {
        if (!term) continue;
        const termLower = term.toLowerCase().trim();
        let foundCourse = Object.keys(COURSE_EMBLEMS).find(k => k.toLowerCase() === termLower);
        if (foundCourse) return `/emblemas/${COURSE_EMBLEMS[foundCourse]}`;
        foundCourse = Object.keys(COURSE_EMBLEMS).find(k =>
            k.toLowerCase().includes(termLower) || termLower.includes(k.toLowerCase())
        );
        if (foundCourse) return `/emblemas/${COURSE_EMBLEMS[foundCourse]}`;
    }
    return null;
};

const TeamEmblem = ({ team, size = 72 }: { team: { name: string; course?: string; faculty?: string }; size?: number }) => {
    const emblemUrl = getTeamEmblem(team);
    return emblemUrl ? (
        <img
            src={emblemUrl}
            alt={team.name}
            style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
    ) : (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.42,
        }}>
            ⚽
        </div>
    );
};

interface MatchCardProps {
    match: Match;
    disabled?: boolean;
    pred: import('../context/AuthContext').Prediction | undefined;
    userPrediction: import('../context/AuthContext').Prediction | undefined;
    updatePrediction: (matchId: string, field: 'scoreA' | 'scoreB', value: string) => void;
    saveUserPredictions: (preds: Record<string, import('../context/AuthContext').Prediction>) => Promise<boolean>;
    showToast: (data: Omit<ToastData, 'id'>) => void;
}

const MatchSimCard = ({ match, disabled, pred, userPrediction, updatePrediction, saveUserPredictions, showToast }: MatchCardProps) => {
    const { user, openLoginModal } = useAuth();
    const { showNotification } = useNotification();
    const [cardSaved, setCardSaved] = useState(false);
    const hasPrediction = pred && pred.scoreA !== '' && pred.scoreB !== '';

    // ── Local input state (decoupled from global re-renders) ──
    const toStr = (v: string | number | undefined) => (v === '' || v === undefined ? '' : String(v));
    const [localA, setLocalA] = useState(() => toStr(pred?.scoreA));
    const [localB, setLocalB] = useState(() => toStr(pred?.scoreB));
    const focusedField = useRef<'A' | 'B' | null>(null);

    // Sync from external changes (arrows, initial load) only when not focused
    useEffect(() => {
        if (focusedField.current !== 'A') setLocalA(toStr(pred?.scoreA));
    }, [pred?.scoreA]);
    useEffect(() => {
        if (focusedField.current !== 'B') setLocalB(toStr(pred?.scoreB));
    }, [pred?.scoreB]);

    const isPreviouslySaved = userPrediction && userPrediction.scoreA !== '' && userPrediction.scoreB !== '';
    const timeLeftMs = msUntil(match.date, match.time);
    const isTimeout = match.status !== 'finished' && timeLeftMs <= 3600000;
    const hours = Math.max(0, Math.floor(timeLeftMs / 3_600_000));
    const isCardDisabled = disabled || isTimeout || !!isPreviouslySaved || match.status === 'finished';

    const renderTeamText = (team: any) => {
        let courseName = team.course || team.name;
        const institution = team.faculty;
        if (institution && courseName.toLowerCase().includes(institution.toLowerCase())) {
            const parts = courseName.split(' - ');
            if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === institution.toLowerCase()) {
                courseName = parts.slice(0, -1).join(' - ');
            } else {
                const regex = new RegExp(`\\s*-\\s*${institution}$`, 'i');
                courseName = courseName.replace(regex, '');
            }
        }
        if (institution) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'white', wordWrap: 'break-word', lineHeight: 1.2, textAlign: 'center' }}>
                        {courseName.trim()}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#E51E2A', wordWrap: 'break-word', lineHeight: 1.2, textAlign: 'center' }}>
                        {institution}
                    </span>
                </div>
            );
        }
        return (
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'white', wordWrap: 'break-word', lineHeight: 1.2 }}>
                {courseName}
            </span>
        );
    };

    const saveThisCard = async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        if (!hasPrediction || !pred) return;
        const success = await saveUserPredictions({ [match.id]: pred });
        if (!success) { showNotification('Erro ao salvar o palpite.', 'error'); return; }
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

    const isTenisMesa = match.sport.includes('Tênis de Mesa') || match.sport.includes('Tenis de Mesa');
    const isTamboreu = match.sport === 'Tamboréu';

    // Tabela de regras por modalidade e fase
    const SCORE_RULES: Record<string, { label: string; classificacao: number; final: number }> = {
        'Vôlei':          { label: 'sets', classificacao: 25, final: 2 },
        'Vôlei de Praia': { label: 'pts',  classificacao: 21, final: 2 },
        'Futevôlei':      { label: 'pts',  classificacao: 18, final: 2 },
        'Beach Tennis':   { label: 'games',classificacao: 6,  final: 8 },
    };

    const getMaxScore = (sport: string, stage?: string): number => {
        const rule = SCORE_RULES[sport];
        if (!rule) {
            if (match.sport === 'Basquete 3x3') return 21;
            if (isTenisMesa) return 3;
            if (isTamboreu) return 2;
            return 99;
        }
        return stage === 'Fase Final' ? rule.final : rule.classificacao;
    };

    const getScoreUnit = (sport: string, stage?: string): string => {
        const rule = SCORE_RULES[sport];
        if (!rule) {
            if (isTenisMesa) return 'sets';
            if (isTamboreu) return 'sets';
            return 'pts';
        }
        if (stage === 'Fase Final' && (sport === 'Vôlei' || sport === 'Vôlei de Praia' || sport === 'Futevôlei')) return 'sets';
        return rule.label;
    };

    const maxScore = getMaxScore(match.sport, match.stage);
    const scoreUnit = getScoreUnit(match.sport, match.stage);
    const isBestOf = ['Vôlei', 'Vôlei de Praia', 'Futevôlei', 'Tamboréu'].includes(match.sport)
        ? (match.stage === 'Fase Final' || isTamboreu)
        : isTenisMesa;

    const maxAllowedA = (pred?.scoreB !== '' && Number(pred?.scoreB) === maxScore) ? maxScore - 1 : maxScore;
    const maxAllowedB = (pred?.scoreA !== '' && Number(pred?.scoreA) === maxScore) ? maxScore - 1 : maxScore;

    return (
        <div className="sim-match-card" style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s',
            height: '100%',
        }}>
            {/* Header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                    {formatFullDate(match.date)}, {match.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: match.status === 'finished' ? '#4ade80' : isTimeout ? '#ef4444' : '#ffd700' }}>
                    {match.status === 'finished' ? <>ENCERRADO</> : isTimeout ? <>TEMPO ESGOTADO</> : <><Zap size={14} /> {hours === 0 ? 'EM BREVE' : `FALTA ${hours}H`}</>}
                </div>
            </div>

            {/* Central Area */}
            <div style={{ padding: '32px 18px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px' }}>
                {/* Team A */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: isCardDisabled ? (isPreviouslySaved || match.status === 'finished' ? 1 : 0.5) : 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <TeamEmblem team={match.teamA} size={80} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textAlign: 'center', maxWidth: '120px' }}>
                            {renderTeamText(match.teamA)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.status !== 'finished' && (
                            <button disabled={isCardDisabled} style={{ background: 'none', border: 'none', color: isCardDisabled ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '16px', cursor: isCardDisabled ? 'not-allowed' : 'pointer', padding: '4px', transition: 'color 0.2s', visibility: isCardDisabled && (isPreviouslySaved || isTimeout) ? 'hidden' : 'visible' }}
                                onClick={() => { if (isCardDisabled) return; const n = String(Math.max(0, (pred?.scoreA === '' ? 0 : Number(pred?.scoreA) ?? 0) - 1)); updatePrediction(match.id, 'scoreA', n); setLocalA(n); }}
                                onMouseEnter={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'white'; }}
                            >&lt;</button>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {match.status === 'finished' ? (
                                <div style={{ width: '48px', height: '48px', border: '2px solid white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: 'white', background: 'rgba(255,255,255,0.1)' }}>
                                    {pred?.scoreA ?? '-'}
                                </div>
                            ) : (
                                <input
                                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                                    disabled={isCardDisabled} value={localA}
                                    onKeyDown={(e) => { const ok = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab']; if (!ok.includes(e.key) && !/^[0-9]$/.test(e.key)) e.preventDefault(); }}
                                    onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g,''); setLocalA(raw); if (raw === '') { updatePrediction(match.id,'scoreA',''); return; } const n = parseInt(raw,10); const c = String(Math.min(n, maxAllowedA)); if (c !== raw) setLocalA(c); updatePrediction(match.id,'scoreA',c); }}
                                    onFocus={(e) => { focusedField.current = 'A'; e.target.select(); }}
                                    onBlur={() => { focusedField.current = null; }}
                                    style={{ width:'48px', height:'48px', border:`2px solid ${localA !== '' && Number(localA) === maxAllowedA && maxScore < 99 ? '#ef4444' : 'white'}`, borderRadius:'6px', fontSize:'24px', fontWeight:900, color: localA !== '' && Number(localA) === maxAllowedA && maxScore < 99 ? '#ef4444' : 'white', background:'transparent', textAlign:'center', outline:'none', cursor: isCardDisabled ? 'not-allowed' : 'text', boxSizing:'border-box', transition:'border-color 0.2s, color 0.2s' }}
                                />
                            )}
                            {match.status === 'finished' && <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>PALPITE</div>}
                        </div>
                        {match.status !== 'finished' && (
                            <button disabled={isCardDisabled} style={{ background: 'none', border: 'none', color: isCardDisabled ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '16px', cursor: isCardDisabled ? 'not-allowed' : 'pointer', padding: '4px', transition: 'color 0.2s', visibility: isCardDisabled && (isPreviouslySaved || isTimeout) ? 'hidden' : 'visible' }}
                                onClick={() => { if (isCardDisabled) return; const curr = pred?.scoreA === '' ? 0 : Number(pred?.scoreA) ?? 0; const n = String(Math.min(curr + 1, maxAllowedA)); updatePrediction(match.id, 'scoreA', n); setLocalA(n); }}
                                onMouseEnter={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'white'; }}
                            >&gt;</button>
                        )}
                    </div>
                </div>

                {/* Center */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isTenisMesa && (
                            <div style={{ position: 'absolute', bottom: '100%', paddingBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                                <div className="md5-tooltip-container" style={{ whiteSpace: 'nowrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>MD5</span>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>
                                        i
                                    </div>
                                    <div className="md5-tooltip-text">
                                        Melhor de 5 (MD5) - Vence quem ganhar 3 partidas
                                    </div>
                                </div>
                            </div>
                        )}
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
                            {match.sport} • {match.category}
                        </div>
                        {['Vôlei', 'Vôlei de Praia', 'Futevôlei', 'Beach Tennis'].includes(match.sport) && match.stage && (
                            <div style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', marginTop: '2px', color: match.stage === 'Fase Final' ? '#f59e0b' : 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {match.stage === 'Fase Final' ? '🏆 Fase Final' : '📋 Fase de Classificação'}
                            </div>
                        )}
                    </div>
                    {match.status === 'finished' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>{match.scoreA} × {match.scoreB}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80' }}>RESULTADO FINAL</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontSize: '28px', fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>×</div>
                            {maxScore < 99 && (
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: isBestOf ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {isBestOf
                                        ? `MX ${maxScore} ${scoreUnit}`
                                        : `MÁX ${maxScore} ${scoreUnit}`}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Team B */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: isCardDisabled ? (isPreviouslySaved || match.status === 'finished' ? 1 : 0.5) : 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <TeamEmblem team={match.teamB} size={80} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textAlign: 'center', maxWidth: '120px' }}>
                            {renderTeamText(match.teamB)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.status !== 'finished' && (
                            <button disabled={isCardDisabled} style={{ background: 'none', border: 'none', color: isCardDisabled ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '16px', cursor: isCardDisabled ? 'not-allowed' : 'pointer', padding: '4px', transition: 'color 0.2s', visibility: isCardDisabled && (isPreviouslySaved || isTimeout) ? 'hidden' : 'visible' }}
                                onClick={() => { if (isCardDisabled) return; const n = String(Math.max(0, (pred?.scoreB === '' ? 0 : Number(pred?.scoreB) ?? 0) - 1)); updatePrediction(match.id, 'scoreB', n); setLocalB(n); }}
                                onMouseEnter={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'white'; }}
                            >&lt;</button>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {match.status === 'finished' ? (
                                <div style={{ width: '48px', height: '48px', border: '2px solid white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: 'white', background: 'rgba(255,255,255,0.1)' }}>
                                    {pred?.scoreB ?? '-'}
                                </div>
                            ) : (
                                <input
                                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                                    disabled={isCardDisabled} value={localB}
                                    onKeyDown={(e) => { const ok = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab']; if (!ok.includes(e.key) && !/^[0-9]$/.test(e.key)) e.preventDefault(); }}
                                    onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g,''); setLocalB(raw); if (raw === '') { updatePrediction(match.id,'scoreB',''); return; } const n = parseInt(raw,10); const c = String(Math.min(n, maxAllowedB)); if (c !== raw) setLocalB(c); updatePrediction(match.id,'scoreB',c); }}
                                    onFocus={(e) => { focusedField.current = 'B'; e.target.select(); }}
                                    onBlur={() => { focusedField.current = null; }}
                                    style={{ width:'48px', height:'48px', border:`2px solid ${localB !== '' && Number(localB) === maxAllowedB && maxScore < 99 ? '#ef4444' : 'white'}`, borderRadius:'6px', fontSize:'24px', fontWeight:900, color: localB !== '' && Number(localB) === maxAllowedB && maxScore < 99 ? '#ef4444' : 'white', background:'transparent', textAlign:'center', outline:'none', cursor: isCardDisabled ? 'not-allowed' : 'text', boxSizing:'border-box', transition:'border-color 0.2s, color 0.2s' }}
                                />
                            )}
                            {match.status === 'finished' && <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>PALPITE</div>}
                        </div>
                        {match.status !== 'finished' && (
                            <button disabled={isCardDisabled} style={{ background: 'none', border: 'none', color: isCardDisabled ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '16px', cursor: isCardDisabled ? 'not-allowed' : 'pointer', padding: '4px', transition: 'color 0.2s', visibility: isCardDisabled && (isPreviouslySaved || isTimeout) ? 'hidden' : 'visible' }}
                                onClick={() => { if (isCardDisabled) return; const curr = pred?.scoreB === '' ? 0 : Number(pred?.scoreB) ?? 0; const n = String(Math.min(curr + 1, maxAllowedB)); updatePrediction(match.id, 'scoreB', n); setLocalB(n); }}
                                onMouseEnter={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { if (!isCardDisabled) e.currentTarget.style.color = 'white'; }}
                            >&gt;</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Result indicator */}
            {match.status === 'finished' && hasPrediction && (() => {
                const predA = Number(pred!.scoreA), predB = Number(pred!.scoreB);
                const isExact = predA === match.scoreA && predB === match.scoreB;
                const predW = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                const actW = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : 'draw';
                const isWin = predW === actW;
                const [dot, label, col] = isExact
                    ? ['#4ade80', 'PLACAR EXATO (+3)', '#4ade80']
                    : isWin
                    ? ['#eab308', 'ACERTOU VENCEDOR (+1)', '#eab308']
                    : ['#ef4444', 'ERROU (0)', '#ef4444'];
                return (
                    <div style={{ padding: '12px 18px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: dot }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: col }}>{label}</span>
                    </div>
                );
            })()}

            {/* Save button */}
            {match.status !== 'finished' && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', marginTop: 'auto' }}>
                    <button
                        onClick={saveThisCard}
                        disabled={(!hasPrediction && !cardSaved) || isCardDisabled}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                            background: isCardDisabled ? 'rgba(255,255,255,0.05)' : cardSaved || isPreviouslySaved ? '#1a7a3a' : hasPrediction ? '#dc2626' : 'rgba(255,255,255,0.08)',
                            boxShadow: isCardDisabled || !hasPrediction ? 'none' : cardSaved || isPreviouslySaved ? '0 4px 20px rgba(26,122,58,0.45)' : '0 4px 20px rgba(220,38,38,0.45)',
                            color: isCardDisabled ? 'rgba(255,255,255,0.3)' : 'white',
                            fontSize: '13px', fontWeight: 800, letterSpacing: '1.2px',
                            cursor: (hasPrediction || cardSaved || isPreviouslySaved) && !isCardDisabled ? 'pointer' : 'not-allowed',
                            opacity: isCardDisabled ? (isPreviouslySaved ? 1 : 0.5) : (!hasPrediction && !cardSaved ? 0.5 : 1),
                            transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase',
                        }}
                        onMouseEnter={(e) => { if ((hasPrediction || cardSaved) && !isCardDisabled) { e.currentTarget.style.backgroundColor = cardSaved ? '#15803d' : '#b91c1c'; e.currentTarget.style.opacity = '0.9'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = cardSaved || isPreviouslySaved ? '#1a7a3a' : (hasPrediction && !isCardDisabled ? '#dc2626' : 'rgba(255,255,255,0.08)'); e.currentTarget.style.opacity = isCardDisabled ? (isPreviouslySaved ? '1' : '0.5') : (!hasPrediction && !cardSaved) ? '0.5' : '1'; }}
                    >
                        {isPreviouslySaved || cardSaved ? <><CheckCircle size={16} /> PALPITE CONFIRMADO</> : isTimeout || disabled ? <>PALPITES FECHADOS</> : <>SALVAR PALPITE</>}
                    </button>
                </div>
            )}
        </div>
    );
};


const Simulator: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    // Corrige referência do showNotification
    const { showNotification } = useNotification();
    const [showBolaoRanking, setShowBolaoRanking] = useState(false);
    const [aberto, setAberto] = useState(false);
    const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
    const [activeTab, setActiveTab] = useState<'palpitar' | 'historico' | 'competicoes' | 'sugeridas'>('palpitar');
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [predictionsFinalized, setPredictionsFinalized] = useState(false);
    const [leagues, setLeagues] = useState<any[]>([]);
    const [allLeagues, setAllLeagues] = useState<any[]>([]);
    const [isLeagueFormOpen, setIsLeagueFormOpen] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState<any | null>(null);
    const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null);
    const [userRequests, setUserRequests] = useState<any[]>([]);
    const [userPrivateLeaguesCount, setUserPrivateLeaguesCount] = useState(0);

    // Historico filters
    const [filterSport, setFilterSport] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterResult, setFilterResult] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0=hoje, 1=amanhã, 2=depois

    const { user, openLoginModal, userPredictions, saveUserPredictions } = useAuth();
    const { matches } = useData();
    const totalLeaguesCount = userPrivateLeaguesCount + (user ? (user.preferredCourse ? 2 : 1) : 0);



    // Helper to get date string for offset
    const getDateForOffset = (offset: number) => {
        const now = new Date();
        const d = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    };

    // Filter matches by selected day for palpitar
    const palpitarMatches = useMemo(() => {
        const targetDate = getDateForOffset(selectedDayOffset);
        return matches.filter(m => m.date === targetDate && m.status === 'scheduled' && !EXCLUDED_SPORTS.includes(m.sport));
    }, [matches, selectedDayOffset]);

    const historyMatches = useMemo(() => {
        return matches.filter(m => m.status === 'finished' && userPredictions[m.id] && userPredictions[m.id].scoreA !== '' && userPredictions[m.id].scoreB !== '');
    }, [matches, userPredictions]);

    const displayMatches = useMemo(() => {
        if (activeTab === 'historico') {
            let filtered = historyMatches;
            if (filterSport) filtered = filtered.filter(m => m.sport === filterSport);
            if (filterCategory) filtered = filtered.filter(m => m.category === filterCategory);
            if (filterLocation) filtered = filtered.filter(m => m.location === filterLocation);
            if (filterResult) {
                filtered = filtered.filter(m => {
                    const pred = userPredictions[m.id];
                    if (!pred || pred.scoreA === '' || pred.scoreB === '') return false;
                    const predA = Number(pred.scoreA);
                    const predB = Number(pred.scoreB);
                    const isExact = predA === m.scoreA && predB === m.scoreB;
                    const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                    const actualWinner = m.scoreA > m.scoreB ? 'A' : m.scoreB > m.scoreA ? 'B' : 'draw';
                    const isWinner = predWinner === actualWinner;
                    if (filterResult === 'exact') return isExact;
                    if (filterResult === 'winner') return !isExact && isWinner;
                    if (filterResult === 'wrong') return !isExact && !isWinner;
                    return true;
                });
            }
            return filtered;
        }
        return palpitarMatches;
    }, [activeTab, historyMatches, palpitarMatches, filterSport, filterCategory, filterResult, filterLocation, userPredictions]);

    // Unique values for filter dropdowns
    const historyFilterOptions = useMemo(() => {
        const sports = [...new Set(historyMatches.map(m => m.sport))].sort();
        const categories = [...new Set(historyMatches.map(m => m.category))].sort();
        const locations = [...new Set(historyMatches.map(m => m.location))].sort();
        return { sports, categories, locations };
    }, [historyMatches]);

    // Load from userPredictions
    useEffect(() => {
        setPredictions(userPredictions);
    }, [userPredictions]);

    const fetchLeagues = async () => {
        if (!user?.email) return;

        console.log("Fetching leagues for:", user.email);
        const { data, error } = await supabase
            .from('leagues')
            .select('*');

        if (error) {
            console.error("Erro ao buscar ligas:", error);
        } else if (data) {
            setAllLeagues(data);
            const userEmail = user.email.toLowerCase();
            const userLeagues = data.filter(l => 
                (l.owner_email && l.owner_email.toLowerCase() === userEmail) || 
                (l.participants && Array.isArray(l.participants) && l.participants.some((p: string) => p.toLowerCase() === userEmail)) ||
                (l.participants && typeof l.participants === 'string' && l.participants.toLowerCase().includes(userEmail))
            );
            console.log("Filtered leagues:", userLeagues.length);
            setLeagues(userLeagues);

            // Count private leagues
            const count = userLeagues.length;
            setUserPrivateLeaguesCount(count);

            // Fetch user requests
            const { data: requestsData } = await supabase
                .from('league_requests')
                .select('*')
                .eq('user_email', user.email);
            
            if (requestsData) {
                setUserRequests(requestsData);
            }
        }
    };

    const handleRequestJoin = async (leagueId: string) => {
        if (!user?.email) return;

        try {
            const { error } = await supabase
                .from('league_requests')
                .insert([
                    {
                        league_id: leagueId,
                        user_email: user.email,
                        user_name: user.role === 'superadmin' ? "Mestre" : (user.name || user.email.split('@')[0]),
                        status: 'pending'
                    }
                ]);

            if (error) throw error;
            fetchLeagues();
        } catch (err: any) {
            console.error("Erro ao solicitar entrada:", err);
        }
    };

    useEffect(() => {
        if (activeTab === 'competicoes' || activeTab === 'sugeridas') {
            fetchLeagues();
        }
    }, [activeTab, user?.email]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join');
        if (joinId) {
            setJoiningLeagueId(joinId);
            // Optionally switch to 'competicoes' tab
            setActiveTab('competicoes');
            // Clean up the URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
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

    const savePredictions = async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        setPredictionsFinalized(true);
        const success = await saveUserPredictions(predictions);
        if (success) {
            showToast({
                message: 'Todos os palpites foram salvos no banco!',
                teamA: 'BOLÃO',
                scoreA: filledCount,
                teamB: 'SALVO',
                scoreB: 1,
            });
        } else {
            showNotification('Erro ao salvar palpites.', 'error');
        }
        setTimeout(() => setPredictionsFinalized(false), 3000);
    };

    const resetPredictions = () => {
        setPredictions(userPredictions); // reset to what's in DB
        setPredictionsFinalized(false);
    };

    const showToast = (data: Omit<ToastData, 'id'>) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...data, id }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
    };
    const filledCount = Object.values(predictions).filter(p => p.scoreA !== '' && p.scoreB !== '').length;

    // ── helpers ──────────────────────────────────────────────

    // +/- stepper control

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
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setShowBolaoRanking(true)}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(220,38,38,0.4)',
                                        background: 'rgba(220,38,38,0.1)',
                                        color: '#ff6b6b',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.2)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = '#ff6b6b'; }}
                                >
                                    RANKING BOLÃO
                                </button>
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
                        </div>

                        {/* Tab bar */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
                            {(['palpitar', 'historico', 'competicoes', 'sugeridas'] as const).map((tab) => (
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
                                    {tab === 'palpitar' ? 'PALPITAR' : tab === 'historico' ? 'HISTÓRICO' : tab === 'competicoes' ? 'COMPETIÇÕES' : 'LIGAS SUGERIDAS'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Tabs for Palpitar */}
                    {activeTab === 'palpitar' && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '20px',
                        }}>
                            {[{ label: 'HOJE', offset: 0 }, { label: 'AMANHÃ', offset: 1 }].map(day => (
                                <button
                                    key={day.offset}
                                    onClick={() => setSelectedDayOffset(day.offset)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: selectedDayOffset === day.offset ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.08)',
                                        background: selectedDayOffset === day.offset ? 'rgba(255,46,46,0.12)' : 'rgba(255,255,255,0.03)',
                                        color: selectedDayOffset === day.offset ? 'white' : 'var(--text-secondary)',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        letterSpacing: '0.5px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    {activeTab === 'palpitar' && (
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
                    )}

                    {/* Competitions Tab */}
                    {activeTab === 'competicoes' && (
                        <div style={{ paddingTop: '0' }}>

                            {/* ── Categoria de Liga ─────────────────────────── */}
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    color: 'white',
                                    margin: '0 0 4px 0',
                                }}>
                                    Categoria de Liga
                                </h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    margin: '0 0 14px 0',
                                }}>
                                    Crie sua liga e comece a competir com a galera!
                                </p>

                                {/* White "LIGA CLÁSSICA" card */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    width: '100%',
                                    maxWidth: '260px',
                                    border: '1.5px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                    {/* Card body */}
                                    <div style={{
                                        padding: '16px 16px 10px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '15px',
                                            fontWeight: 900,
                                            color: 'white',
                                            textTransform: 'uppercase',
                                            textAlign: 'center',
                                            letterSpacing: '0.5px',
                                        }}>
                                            LIGA CLÁSSICA
                                        </h3>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.6)',
                                            textAlign: 'center',
                                            lineHeight: 1.4,
                                        }}>
                                            Dispute o primeiro lugar do ranking de pontos corridos com seus amigos!
                                        </p>
                                        <img
                                            src="/images/logo-liga.png"
                                            alt="Logo Liga"
                                            style={{
                                                width: '100%',
                                                maxWidth: '150px',
                                                height: 'auto',
                                                objectFit: 'contain',
                                                margin: '4px 0',
                                            }}
                                        />
                                    </div>

                                    {/* Red CRIAR LIGA button */}
                                    <button
                                        onClick={() => {
                                            if (!user) { openLoginModal(); return; }
                                            if (totalLeaguesCount >= 5) {
                                                showNotification("Você atingiu o limite máximo de 5 ligas permitidas.", 'error');
                                                return;
                                            }
                                            setIsLeagueFormOpen(true);
                                        }}
                                        disabled={totalLeaguesCount >= 5}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            background: totalLeaguesCount >= 5 ? '#ccc' : '#E51E2A',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '15px',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            cursor: totalLeaguesCount >= 5 ? 'not-allowed' : 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { if (totalLeaguesCount < 5) e.currentTarget.style.background = '#b91c1c'; }}
                                        onMouseLeave={(e) => { if (totalLeaguesCount < 5) e.currentTarget.style.background = '#E51E2A'; }}
                                    >
                                        {totalLeaguesCount >= 5 ? 'LIMITE ATINGIDO' : 'CRIAR LIGA'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Minhas Ligas ──────────────────────────────── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{
                                        fontSize: '26px',
                                        fontWeight: 900,
                                        color: 'white',
                                        margin: '0 0 4px 0',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}>
                                        Minhas Ligas
                                        {user && (
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: 800,
                                                background: totalLeaguesCount >= 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
                                                color: totalLeaguesCount >= 5 ? '#ef4444' : 'var(--text-secondary)',
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                letterSpacing: '0'
                                            }}>
                                                {totalLeaguesCount}/5
                                            </span>
                                        )}
                                    </h2>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                                        Acompanhe seu desempenho nas ligas que você participa.
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '20px',
                            }}>

                                {/* Automatic Leagues - LIGA GERAL visível para todos, mas só superadmin pode gerenciar */}
                                <LigaCard
                                    name="LIGA GERAL"
                                    description="Todos os participantes do Bolão Unisanta"
                                    type="global"
                                    onClick={() => setSelectedLeague({ name: 'LIGA GERAL', type: 'global' })}
                                />

                                {user && user.preferredCourse && (
                                    <LigaCard
                                        name={`LIGA ${user.preferredCourse.toUpperCase()}`}
                                        description={`Ranking exclusivo de ${user.preferredCourse}`}
                                        type="course"
                                        onClick={() => setSelectedLeague({
                                            name: `LIGA ${user.preferredCourse}`,
                                            type: 'course',
                                            course: user.preferredCourse
                                        })}
                                    />
                                )}

                                {/* Private Leagues */}
                                {leagues.map(league => (
                                    <LigaCard
                                        key={league.id}
                                        name={league.name}
                                        description={league.description}
                                        participantsCount={league.participants?.length || 0}
                                        isAdmin={league.owner_email === user?.email || user?.role === 'superadmin'}
                                        onClick={() => setSelectedLeague(league)}
                                    />
                                ))}
                            </div>

                            <LeagueFormModal
                                aberto={isLeagueFormOpen}
                                setAberto={setIsLeagueFormOpen}
                                onCreated={() => fetchLeagues()}
                            />

                            {selectedLeague && (
                                <LeagueDetailsModal
                                    league={selectedLeague}
                                    onClose={() => {
                                        setSelectedLeague(null);
                                        fetchLeagues();
                                    }}
                                />
                            )}

                            {joiningLeagueId && (
                                <JoinLeagueModal
                                    leagueId={joiningLeagueId}
                                    onClose={() => setJoiningLeagueId(null)}
                                    onJoined={() => {
                                        setJoiningLeagueId(null);
                                        fetchLeagues();
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'sugeridas' && (
                        <div className="leagues-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {allLeagues
                                .filter(l => !leagues.some(my => my.id === l.id) && l.name !== 'Liga Geral' && !l.name.startsWith('Liga '))
                                .map(league => (
                                    <div key={league.id} className="premium-card league-card" style={{ padding: '24px', position: 'relative' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                <Users size={16} />
                                                <span>{league.participants?.length || 0} Membros</span>
                                            </div>
                                            {totalLeaguesCount >= 5 && !userRequests.some(r => r.league_id === league.id) && (
                                                <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>
                                                    Limite de 5 ligas atingido
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                                🏆
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{league.name}</h3>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{league.description || 'Sem descrição'}</p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={totalLeaguesCount >= 5 && !userRequests.some(r => r.league_id === league.id)}
                                            onClick={() => {
                                                const hasRequest = userRequests.some(r => r.league_id === league.id);
                                                if (!hasRequest && totalLeaguesCount < 5) handleRequestJoin(league.id);
                                            }}
                                            className={(userRequests.some(r => r.league_id === league.id) || (totalLeaguesCount >= 5 && !userRequests.some(r => r.league_id === league.id))) ? "" : "hover-glow"}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: userRequests.some(r => r.league_id === league.id) ? 'rgba(255,255,255,0.05)' : 
                                                           (totalLeaguesCount >= 5 ? 'rgba(255,255,255,0.02)' : 'var(--accent-color)'),
                                                color: (userRequests.some(r => r.league_id === league.id) || totalLeaguesCount >= 5) ? 'var(--text-secondary)' : 'white',
                                                border: (userRequests.some(r => r.league_id === league.id) || totalLeaguesCount >= 5) ? '1px solid var(--border-color)' : 'none',
                                                borderRadius: '8px',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: (userRequests.some(r => r.league_id === league.id) || totalLeaguesCount >= 5) ? 'default' : 'pointer',
                                                opacity: (totalLeaguesCount >= 5 && !userRequests.some(r => r.league_id === league.id)) ? 0.5 : 1
                                            }}
                                        >
                                            {userRequests.some(r => r.league_id === league.id) ? 'AGUARDE (PEDIDO FEITO)' : 
                                             (totalLeaguesCount >= 5 ? 'LIMITE ATINGIDO' : 'PEDIR PARA ENTRAR')}
                                        </button>
                                    </div>
                                ))}
                            {allLeagues.filter(l => !leagues.some(my => my.id === l.id) && l.name !== 'Liga Geral' && !l.name.startsWith('Liga ')).length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Nenhuma liga sugerida disponível no momento.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info banner when showing all */}
                    {/* Historico Filters */}
                    {activeTab === 'historico' && historyMatches.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginBottom: '20px',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <select
                                value={filterSport}
                                onChange={e => setFilterSport(e.target.value)}
                                style={{
                                    flex: '1 1 140px',
                                    padding: '10px 14px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Todos os Esportes</option>
                                {historyFilterOptions.sports.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                style={{
                                    flex: '1 1 140px',
                                    padding: '10px 14px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Todas Modalidades</option>
                                {historyFilterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select
                                value={filterResult}
                                onChange={e => setFilterResult(e.target.value)}
                                style={{
                                    flex: '1 1 140px',
                                    padding: '10px 14px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Todos os Resultados</option>
                                <option value="exact">🟢 Placar Exato</option>
                                <option value="winner">🟡 Acertou Vencedor</option>
                                <option value="wrong">🔴 Errou</option>
                            </select>

                            <select
                                value={filterLocation}
                                onChange={e => setFilterLocation(e.target.value)}
                                style={{
                                    flex: '1 1 140px',
                                    padding: '10px 14px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Todas as Quadras</option>
                                {historyFilterOptions.locations.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>

                            {(filterSport || filterCategory || filterResult || filterLocation) && (
                                <button
                                    onClick={() => { setFilterSport(''); setFilterCategory(''); setFilterResult(''); setFilterLocation(''); }}
                                    style={{
                                        padding: '10px 16px',
                                        background: 'rgba(239,68,68,0.15)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* Match cards grid */}
                    {(activeTab === 'palpitar' || activeTab === 'historico') && (
                        <div className="simulator-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                            gap: '20px',
                            alignItems: 'stretch',
                        }}>
                            {displayMatches.map(match => (
                                <MatchSimCard
                                    key={match.id}
                                    match={match}
                                    disabled={predictionsFinalized}
                                    pred={predictions[match.id]}
                                    userPrediction={userPredictions?.[match.id]}
                                    updatePrediction={updatePrediction}
                                    saveUserPredictions={saveUserPredictions}
                                    showToast={showToast}
                                />
                            ))}
                        </div>
                    )}

                    {displayMatches.length === 0 && (activeTab === 'palpitar' || activeTab === 'historico') && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <p>{activeTab === 'palpitar' ? 'Nenhum jogo disponível para simulação.' : 'Nenhum histórico de palpite concluído.'}</p>
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

                    /* Hide native number spinners on score inputs */
                    input[type=number]::-webkit-outer-spin-button,
                    input[type=number]::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}</style>
            </main>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showBolaoRanking && <BolaoRankingModal onClose={() => setShowBolaoRanking(false)} />}
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
