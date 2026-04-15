import { type FC, useMemo, useState } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { SPORT_ICONS } from '../data/mockData';
import { Trophy, Star, Medal } from 'lucide-react';

// ─── Interface ─────────────────────────────────────────────────────────────────

interface AtletaDestaque {
    nome: string;
    curso: string;
    modalidade: string;
    valor: number | string;
    votos?: number;
    rotulo?: string;
    isManual?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

function getRotulo(modalidade: string): string {
    if (['Futebol', 'Futebol Society', 'Futebol X1', 'Futsal', 'Handebol'].includes(modalidade)) return 'Artilheiro';
    if (['Basquetebol', 'Basquete 3x3'].includes(modalidade)) return 'Cestinha';
    if (['Vôlei', 'Vôlei de Praia'].includes(modalidade)) return 'Maior Pontuador';
    return 'Destaque da Rodada';
}

// cor do rótulo por categoria
const ROTULO_COLOR: Record<string, string> = {
    'Artilheiro':        '#e30613',
    'Cestinha':          '#f59e0b',
    'Pontos por Jogo':   '#22c55e',
    'Maior Pontuador':   '#3b82f6',
    'Destaque da Rodada':'#8b5cf6',
};

function getRotuloColor(modalidade: string): string {
    return ROTULO_COLOR[getRotulo(modalidade)] ?? '#e30613';
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

const Avatar: FC<{ name: string; size?: number }> = ({ name, size = 48 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size * 0.32, fontWeight: 800,
        flexShrink: 0, letterSpacing: '0.04em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.08)',
    }}>
        {getInitials(name)}
    </div>
);

const SportEmoji: FC<{ modalidade: string }> = ({ modalidade }) => {
    const emoji = SPORT_ICONS[modalidade] ?? '🏅';
    return <span style={{ fontSize: '13px', lineHeight: 1 }}>{emoji}</span>;
};

// ─── Componente Principal ──────────────────────────────────────────────────────

const MelhoresAtletas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { featuredAthletes, mvpCandidates, matches } = useData();

    // ── Seção 1: MVPs da Galera ─────────────────────────────────────────────────
    const mvpLeaders = useMemo(() => {
        const byMatch = new Map<string, typeof mvpCandidates>();
        mvpCandidates.forEach((c) => {
            const b = byMatch.get(c.matchId) ?? [];
            b.push(c);
            byMatch.set(c.matchId, b);
        });

        const winners = Array.from(byMatch.values())
            .map((candidates) =>
                [...candidates].sort((a, b) => {
                    if (b.votes !== a.votes) return b.votes - a.votes;
                    if (b.points !== a.points) return b.points - a.points;
                    return a.playerName.localeCompare(b.playerName);
                })[0],
            )
            .filter((w) => w && w.votes > 0);

        const grouped = new Map<string, {
            playerName: string; institution: string; course: string;
            sportSample: string; mvpCount: number; totalVotes: number;
        }>();

        winners.forEach((winner) => {
            const key = `${winner.playerName.toLowerCase()}::${winner.course.toLowerCase()}::${winner.institution.toLowerCase()}`;
            const cur = grouped.get(key);
            if (!cur) {
                grouped.set(key, { playerName: winner.playerName, institution: winner.institution, course: winner.course, sportSample: winner.sport, mvpCount: 1, totalVotes: winner.votes });
            } else {
                cur.mvpCount += 1;
                cur.totalVotes += winner.votes;
            }
        });

        return Array.from(grouped.values()).sort((a, b) => {
            if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
            if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
            return a.playerName.localeCompare(b.playerName);
        });
    }, [mvpCandidates]);

    // ── Seção 2: Líderes de Estatísticas ───────────────────────────────────────
    const lideres = useMemo((): AtletaDestaque[] => {
        const supportedSports = new Set([
            'Futebol', 'Futebol Society', 'Futebol X1', 'Futsal',
            'Basquete 3x3', 'Basquetebol', 'Handebol', 'Vôlei', 'Vôlei de Praia',
        ]);

        const getPoints = (desc: string | undefined, sport: string): number => {
            if (sport !== 'Basquete 3x3' && sport !== 'Basquetebol') return 1;
            const m = (desc ?? '').toLowerCase().match(/\+\s*([123])|([123])\s*ponto/);
            return Number(m?.[1] ?? m?.[2] ?? 1);
        };

        type RawEvent = { type: string; player?: string; teamId?: string; description?: string };
        const parseEvents = (raw: unknown): RawEvent[] => {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw as RawEvent[];
            if (typeof raw === 'string') {
                try { const p: unknown = JSON.parse(raw); return Array.isArray(p) ? (p as RawEvent[]) : []; }
                catch { return []; }
            }
            return [];
        };

        type Stat = { name: string; institution: string; course: string; sport: string; value: number };
        const bySport = new Map<string, Map<string, Stat>>();

        matches
            .filter((m) => m.status === 'finished' && supportedSports.has(m.sport))
            .forEach((match) => {
                const sportMap: Map<string, Stat> = bySport.get(match.sport) ?? new Map<string, Stat>();
                parseEvents(match.events).forEach((ev) => {
                    if (!ev.player || !ev.teamId) return;
                    if (!['goal', 'penalty_scored', 'shootout_scored'].includes(ev.type)) return;
                    const team = ev.teamId === match.teamA.id ? match.teamA : match.teamB;
                    const key = `${ev.player.toLowerCase()}::${team.course.toLowerCase()}::${(team.faculty ?? '').toLowerCase()}`;
                    const inc = getPoints(ev.description, match.sport);
                    const cur = sportMap.get(key);
                    if (!cur) sportMap.set(key, { name: ev.player, institution: team.faculty ?? '', course: team.course, sport: match.sport, value: inc });
                    else cur.value += inc;
                });
                bySport.set(match.sport, sportMap);
            });

        const result: AtletaDestaque[] = [];

        bySport.forEach((playersMap, sport) => {
            const top = Array.from(playersMap.values()).sort((a, b) => b.value !== a.value ? b.value - a.value : a.name.localeCompare(b.name))[0];
            if (!top || top.value <= 0) return;
            const isBall = sport === 'Basquete 3x3' || sport === 'Basquetebol';
            const isVolley = sport === 'Vôlei' || sport === 'Vôlei de Praia';
            const unit = isBall || isVolley ? (top.value === 1 ? 'ponto' : 'pontos') : (top.value === 1 ? 'gol' : 'gols');
            result.push({ nome: top.name, curso: top.course, modalidade: sport, valor: `${top.value} ${unit}` });
        });

        featuredAthletes.forEach((fa) => {
            result.push({ nome: fa.name, curso: fa.course, modalidade: fa.sport, valor: fa.reason, isManual: true });
        });

        return result.sort((a, b) => {
            const aDestaque = (a.isManual || getRotulo(a.modalidade) === 'Destaque da Rodada') ? 1 : 0;
            const bDestaque = (b.isManual || getRotulo(b.modalidade) === 'Destaque da Rodada') ? 1 : 0;
            if (aDestaque !== bDestaque) return aDestaque - bDestaque;
            return a.modalidade.localeCompare(b.modalidade);
        });
    }, [matches, featuredAthletes]);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />

            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* ── Cabeçalho ── */}
                    <div style={{ marginBottom: '36px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>Melhores Atletas</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Os destaques desta edição dos Jogos Unisanta</p>
                    </div>

                    {/* ══ TOPO: MVPs da Galera ══ */}
                    <section style={{ marginBottom: '52px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                            <Star size={20} color="var(--accent-color)" fill="var(--accent-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>MVPs da Galera</h2>
                                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Atletas escolhidos por votação na Cronologia das partidas
                                </p>
                            </div>
                        </div>

                        <div className="premium-card" style={{ overflow: 'hidden' }}>
                            {mvpLeaders.length === 0 ? (
                                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    Ainda não há jogadores com MVP contabilizado.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={thStyle}>#</th>
                                                <th style={thStyle}>Jogador</th>
                                                <th style={thStyle}>Curso / Instituição</th>
                                                <th style={thStyle}>Esporte</th>
                                                <th style={{ ...thStyle, textAlign: 'right' }}>MVPs</th>
                                                <th style={{ ...thStyle, textAlign: 'right' }}>Votos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mvpLeaders.map((athlete, index) => {
                                                const isTop3 = index < 3;
                                                const medalColors = ['#f59e0b', '#9ca3af', '#cd7c3a'];
                                                return (
                                                    <tr
                                                        key={`${athlete.playerName}-${athlete.course}-${athlete.institution}`}
                                                        style={{
                                                            borderTop: '1px solid var(--border-color)',
                                                            background: isTop3 ? 'rgba(227,6,19,0.03)' : undefined,
                                                            transition: 'background 0.15s',
                                                        }}
                                                    >
                                                        <td style={{ ...tdStyle, width: '48px' }}>
                                                            {isTop3 ? (
                                                                <Medal size={16} color={medalColors[index]} fill={medalColors[index]} />
                                                            ) : (
                                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <Avatar name={athlete.playerName} size={38} />
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{athlete.playerName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                            {athlete.course}
                                                        </td>
                                                        <td style={{ ...tdStyle, fontSize: '13px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <SportEmoji modalidade={athlete.sportSample} />
                                                                <span style={{ color: 'var(--text-secondary)' }}>{athlete.sportSample}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                            <span style={{
                                                                background: 'rgba(227,6,19,0.12)',
                                                                color: 'var(--accent-color)',
                                                                padding: '3px 10px', borderRadius: '20px',
                                                                fontWeight: 800, fontSize: '13px',
                                                            }}>
                                                                {athlete.mvpCount}×
                                                            </span>
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                                                            {athlete.totalVotes}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ══ BASE: Líderes de Estatísticas ══ */}
                    <section style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                            <Trophy size={20} color="var(--accent-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Líderes de Estatísticas</h2>
                                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Artilheiros, Cestinhas, Maiores Pontuadores e Destaques da Rodada
                                </p>
                            </div>
                        </div>

                        {lideres.length === 0 ? (
                            <div className="premium-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Nenhum líder de estatísticas registrado ainda.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
                                {lideres.map((atleta, i) => {
                                    const rotulo = atleta.isManual ? 'Destaque da Rodada' : (atleta.rotulo ?? getRotulo(atleta.modalidade));
                                    const rotuloColor = atleta.isManual ? '#8b5cf6' : (ROTULO_COLOR[rotulo] ?? getRotuloColor(atleta.modalidade));
                                    const emoji = SPORT_ICONS[atleta.modalidade] ?? '🏅';
                                    return (
                                        <div
                                            key={`${atleta.modalidade}-${atleta.nome}-${i}`}
                                            className="premium-card athlete-card"
                                            style={{ padding: '0', overflow: 'hidden', position: 'relative' }}
                                        >
                                            {/* Faixa colorida no topo */}
                                            <div style={{
                                                height: '4px',
                                                background: `linear-gradient(90deg, ${rotuloColor}, transparent)`,
                                            }} />

                                            <div style={{ padding: '18px 20px 20px' }}>
                                                {/* Header do card: badge modalidade + emoji inline */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: 'var(--text-secondary)',
                                                        padding: '3px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.07em',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        {atleta.modalidade}
                                                        <span style={{ fontSize: '10px', lineHeight: 1 }}>{emoji}</span>
                                                    </span>
                                                </div>

                                                {/* Avatar + nome + curso */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <Avatar name={atleta.nome} size={48} />
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '15px', fontWeight: 800, lineHeight: 1.25,
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                        }}>
                                                            {atleta.nome}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px',
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                        }}>
                                                            {atleta.curso}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Divisor */}
                                                <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '14px' }} />

                                                {/* Rótulo + valor */}
                                                {rotulo === 'Destaque da Rodada' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                            letterSpacing: '0.05em', color: rotuloColor,
                                                            background: `${rotuloColor}18`,
                                                            padding: '3px 8px', borderRadius: '20px',
                                                            border: `1px solid ${rotuloColor}30`,
                                                            whiteSpace: 'nowrap',
                                                            alignSelf: 'flex-start',
                                                        }}>
                                                            {rotulo}
                                                        </span>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                                                            {atleta.valor}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                            letterSpacing: '0.05em', color: rotuloColor,
                                                            background: `${rotuloColor}18`,
                                                            padding: '3px 8px', borderRadius: '20px',
                                                            border: `1px solid ${rotuloColor}30`,
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {rotulo}
                                                        </span>
                                                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                                                            {atleta.valor}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                </div>
            </main>

            <style>{`
                .athlete-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
                .athlete-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 28px rgba(0,0,0,0.35);
                    border-color: rgba(255,255,255,0.12);
                }
                tbody tr:hover { background: rgba(255,255,255,0.02) !important; }
            `}</style>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

// ─── Estilos de tabela ─────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '11px 16px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    verticalAlign: 'middle',
};

export default MelhoresAtletas;
