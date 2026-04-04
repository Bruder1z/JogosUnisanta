import { type FC, useState, useMemo } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { BarChart2, Shield, Sword, FileSearch, Target } from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockData';

// Modalidades que usam gols/pontos por atleta (LAYOUT_INVASAO)
const MODALIDADES_GOLS = ['Futsal', 'Futebol Society', 'Futebol X1', 'Handebol', 'Basquetebol', 'Basquete 3x3'];

// Modalidades de rede (LAYOUT_REDE)
const MODALIDADES_REDE = ['Vôlei', 'Vôlei de Praia', 'Futevôlei'];

const Estatisticas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { matches, courses: allCourses, athletes } = useData();

    const [sportFilter, setSportFilter] = useState<string>(AVAILABLE_SPORTS[3]);
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [genderFilter, setGenderFilter] = useState<string>('Masculino');

    const isInvasaoLayout = MODALIDADES_GOLS.includes(sportFilter);
    const isRedeLayout = MODALIDADES_REDE.includes(sportFilter);
    const isAnyLayout = isInvasaoLayout || isRedeLayout;
    const isBasquete = sportFilter === 'Basquetebol' || sportFilter === 'Basquete 3x3';

    const uniqueCourses = useMemo(() => {
        return Array.from(new Set(allCourses.map(c => c.split(' - ')[0]))).sort();
    }, [allCourses]);

    const stats = useMemo(() => {
        if (!isAnyLayout) return { bestAttack: [], bestDefense: [], topScorers: [], gamesPlayed: {} as Record<string, number> };

        const isBasqueteMemo = sportFilter === 'Basquetebol' || sportFilter === 'Basquete 3x3';
        const isRedeMemo = MODALIDADES_REDE.includes(sportFilter);

        const filteredMatches = matches.filter(
            m => m.status === 'finished' && m.sport === sportFilter && m.category === genderFilter
        );

        // Pontos/sets por equipe
        const teamStats: Record<string, { scored: number; conceded: number; course: string; name: string; faculty: string; games: number }> = {};
        filteredMatches.forEach(m => {
            if (!teamStats[m.teamA.name]) teamStats[m.teamA.name] = { scored: 0, conceded: 0, course: m.teamA.course, name: m.teamA.name, faculty: m.teamA.faculty || m.teamA.name.split(' - ')[1] || '', games: 0 };
            if (!teamStats[m.teamB.name]) teamStats[m.teamB.name] = { scored: 0, conceded: 0, course: m.teamB.course, name: m.teamB.name, faculty: m.teamB.faculty || m.teamB.name.split(' - ')[1] || '', games: 0 };
            teamStats[m.teamA.name].scored += m.scoreA;
            teamStats[m.teamA.name].conceded += m.scoreB;
            teamStats[m.teamA.name].games += 1;
            teamStats[m.teamB.name].scored += m.scoreB;
            teamStats[m.teamB.name].conceded += m.scoreA;
            teamStats[m.teamB.name].games += 1;
        });

        let teams = Object.values(teamStats);
        if (courseFilter) teams = teams.filter(t => t.course === courseFilter);

        const bestAttack = [...teams].sort((a, b) => b.scored - a.scored);
        // Para rede: ordena por média de pontos sofridos por set (menor = melhor)
        const bestDefense = isRedeMemo
            ? [...teams].sort((a, b) => {
                const avgA = a.games > 0 ? a.conceded / a.games : 0;
                const avgB = b.games > 0 ? b.conceded / b.games : 0;
                return avgA - avgB;
              })
            : [...teams].sort((a, b) => a.conceded - b.conceded);

        // Pontuadores individuais a partir dos eventos de gol
        const goalMap: Record<string, { name: string; course: string; goals: number }> = {};
        filteredMatches.forEach(m => {
            (m.events || []).forEach(evt => {
                if (evt.type !== 'goal' && evt.type !== 'penalty_scored') return;
                if (!evt.player) return;
                const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                const key = evt.player;
                if (!goalMap[key]) goalMap[key] = { name: evt.player, course: teamObj.course || teamObj.name, goals: 0 };
                const pts = isBasqueteMemo
                    ? (Number(evt.description?.match(/\+(\d+)\s*Ponto/)?.[1]) || 1)
                    : 1;
                goalMap[key].goals += pts;
            });
        });

        let topScorers = Object.values(goalMap).sort((a, b) => b.goals - a.goals).slice(0, 10);

        // Fallback sintético
        if (topScorers.length === 0) {
            const seededRandom = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
                return Math.abs(hash % 10);
            };
            let filteredAthletes = athletes.filter(a => a.sports.includes(sportFilter) && a.sex === genderFilter);
            if (courseFilter) filteredAthletes = filteredAthletes.filter(a => a.course === courseFilter);
            topScorers = filteredAthletes.map(a => {
                const tStat = teams.find(t => t.course === a.course);
                return {
                    name: `${a.firstName} ${a.lastName}`,
                    course: a.course,
                    goals: (tStat ? Math.floor(tStat.scored / 3) : 0) + seededRandom(a.firstName + a.lastName),
                };
            }).sort((a, b) => b.goals - a.goals).slice(0, 10);
        }

        const gamesPlayed = Object.fromEntries(Object.entries(teamStats).map(([k, v]) => [k, v.games]));
        return { bestAttack, bestDefense, topScorers, gamesPlayed };
    }, [matches, sportFilter, courseFilter, genderFilter, athletes, isAnyLayout]);

    const maxAttack = stats.bestAttack[0]?.scored || 1;
    const maxDefense = (() => {
        if (stats.bestDefense.length === 0) return 1;
        if (isRedeLayout) {
            // Para rede: máximo da média de pontos sofridos por jogo
            return Math.max(...stats.bestDefense.map(t => {
                const g = stats.gamesPlayed[t.name] || 1;
                return t.conceded / g;
            }), 1);
        }
        return Math.max(...stats.bestDefense.map(t => t.conceded), 1);
    })();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Estatísticas Oficiais</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Acompanhe os rankings de ataque, defesa e artilharia por modalidade</p>
                    </div>

                    {/* Filtros */}
                    <div className="premium-card" style={{ padding: '20px', display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Gênero</label>
                            <select style={selectStyle} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Modalidade</label>
                            <select style={selectStyle} value={sportFilter} onChange={e => { setSportFilter(e.target.value); setCourseFilter(''); }}>
                                {AVAILABLE_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {(isInvasaoLayout || isRedeLayout) && (
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Curso (Opcional)</label>
                                <select style={selectStyle} value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                                    <option value="">Todos os cursos</option>
                                    {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Guard: só renderiza o dashboard para modalidades suportadas */}
                    {!isAnyLayout ? (
                        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <FileSearch size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Selecione uma modalidade para ver as estatísticas
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.6 }}>
                                Estatísticas disponíveis para: {[...MODALIDADES_GOLS, ...MODALIDADES_REDE].join(', ')}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                            {/* Coluna 1 — Artilheiros / Cestinhas / Maiores Pontuadores */}
                            <div style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <BarChart2 size={22} color="#fbbf24" />
                                    <div>
                                        <h2 style={cardTitleStyle}>
                                            {isBasquete ? '🏀 Cestinhas' : isRedeLayout ? '🏐 Maiores Pontuadores' : '🥇 Artilheiros'}
                                        </h2>
                                        <p style={cardSubStyle}>Top 10 · {sportFilter} {genderFilter}</p>
                                    </div>
                                </div>
                                <div>
                                    {stats.topScorers.length === 0 ? (
                                        <EmptyState />
                                    ) : stats.topScorers.map((scorer, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            marginBottom: '6px',
                                            background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                                            border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                    background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.08)',
                                                    color: idx < 3 ? '#000' : 'var(--text-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '11px', fontWeight: 800,
                                                }}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>{scorer.name}</div>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                                                        borderRadius: '999px', background: 'rgba(255,255,255,0.08)',
                                                        color: 'var(--text-secondary)',
                                                    }}>{scorer.course}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {isBasquete
                                                    ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>Pts</span>
                                                    : isRedeLayout
                                                    ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>Pts</span>
                                                    : <Target size={14} color="#fbbf24" />
                                                }
                                                <span style={{ fontWeight: 800, color: idx === 0 ? '#fbbf24' : 'white', fontSize: '18px' }}>
                                                    {scorer.goals}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Coluna 2 — Melhor Ataque */}
                            <div style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <Sword size={22} color="#22c55e" />
                                    <div>
                                        <h2 style={cardTitleStyle}>
                                            ⚔️ {isBasquete ? 'Melhor Ataque (Pontos)' : isRedeLayout ? 'Melhor Ataque (Sets)' : 'Melhor Ataque (Gols)'}
                                        </h2>
                                        <p style={cardSubStyle}>
                                            {isBasquete ? 'Total de pontos marcados' : isRedeLayout ? 'Mais sets vencidos' : 'Mais gols marcados'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {stats.bestAttack.length === 0 ? (
                                        <EmptyState />
                                    ) : stats.bestAttack.slice(0, 10).map((team, idx) => (
                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{team.name.split(' - ')[0]}</div>
                                                        {team.faculty && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.faculty}</div>}
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e' }}>
                                                    {team.scored}{isBasquete ? ' pts' : isRedeLayout ? ' sets' : ''}
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '999px', background: '#16a34a',
                                                    width: `${Math.round((team.scored / maxAttack) * 100)}%`,
                                                    transition: 'width 0.6s ease',
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Coluna 3 — Defesa */}
                            <div style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <Shield size={22} color="#3b82f6" />
                                    <div>
                                        <h2 style={cardTitleStyle}>
                                            🛡️ {isBasquete ? 'Eficiência Defensiva' : isRedeLayout ? 'Média de Ptos Sofridos/Set' : 'Defesa Menos Vazada'}
                                        </h2>
                                        <p style={cardSubStyle}>
                                            {isBasquete ? 'Menos pontos sofridos' : isRedeLayout ? 'Menor média de pontos sofridos por jogo' : 'Menos gols sofridos'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {stats.bestDefense.length === 0 ? (
                                        <EmptyState />
                                    ) : stats.bestDefense.slice(0, 10).map((team, idx) => {
                                        const games = stats.gamesPlayed[team.name] || 1;
                                        const displayValue = isRedeLayout
                                            ? (team.conceded / games).toFixed(1)
                                            : isBasquete
                                            ? `${team.conceded} pts`
                                            : String(team.conceded);
                                        const barValue = isRedeLayout
                                            ? team.conceded / games
                                            : team.conceded;
                                        return (
                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{team.name.split(' - ')[0]}</div>
                                                        {team.faculty && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.faculty}</div>}
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>
                                                    {displayValue}{isRedeLayout ? ' sets/j' : ''}
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '999px', background: '#2563eb',
                                                    width: `${Math.round((barValue / maxDefense) * 100)}%`,
                                                    transition: 'width 0.6s ease',
                                                }} />
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </main>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

// ── Helpers de estilo ──────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: '#2a2a2a',
    border: '1px solid var(--border-color)',
    color: 'white',
    fontSize: '15px',
};

const cardStyle: React.CSSProperties = {
    background: '#18181b',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.07)',
};

const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
};

const cardTitleStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 800,
    color: 'white',
    margin: 0,
};

const cardSubStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
};

const EmptyState = () => (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <FileSearch size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
        <p style={{ fontSize: '14px' }}>Nenhum dado encontrado</p>
    </div>
);

export default Estatisticas;
