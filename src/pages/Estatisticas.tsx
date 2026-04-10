import { type FC, useState, useMemo } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { BarChart2, Shield, Sword, FileSearch, Target, Trophy } from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockData';

// Modalidades que usam gols/pontos por atleta (LAYOUT_INVASAO)
const MODALIDADES_GOLS = ['Futsal', 'Futebol Society', 'Futebol X1', 'Handebol', 'Basquetebol', 'Basquete 3x3'];

// Modalidades de rede (LAYOUT_REDE)
const MODALIDADES_REDE = ['Vôlei', 'Vôlei de Praia', 'Futevôlei'];
const MODALIDADES_SO_VITORIAS = ['Beach Tennis', 'Tênis de Mesa', 'Tenis de Mesa'];
const MODALIDADES_FUTEBOL = ['Futebol Society', 'Futsal', 'Futebol X1'];

const Estatisticas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { matches, courses: allCourses } = useData();

    const [sportFilter, setSportFilter] = useState<string>(AVAILABLE_SPORTS[3]);
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [genderFilter, setGenderFilter] = useState<string>('Masculino');

    const isInvasaoLayout = MODALIDADES_GOLS.includes(sportFilter);
    const isRedeLayout = MODALIDADES_REDE.includes(sportFilter);
    const isOnlyWinsLayout = MODALIDADES_SO_VITORIAS.includes(sportFilter);
    const isAnyLayout = isInvasaoLayout || isRedeLayout || isOnlyWinsLayout;
    const isBasquete = sportFilter === 'Basquetebol' || sportFilter === 'Basquete 3x3';
    const isBasquete3x3 = sportFilter === 'Basquete 3x3';
    const isFutebol = MODALIDADES_FUTEBOL.includes(sportFilter);
    const isHandebol = sportFilter === 'Handebol';
    const isFutevolei = sportFilter === 'Futevôlei';

    const uniqueCourses = useMemo(() => {
        return Array.from(new Set(allCourses.map(c => c.split(' - ')[0]))).sort();
    }, [allCourses]);

    const stats = useMemo(() => {
        if (!isAnyLayout) return {
            bestAttack: [],
            bestDefense: [],
            topScorers: [],
            topSingleGamePerformances: [],
            topThreePointers: [],
            topFreeThrows: [],
            topPenaltyScorers: [],
            topYellowPlayers: [],
            topRedPlayers: [],
            topWins: [],
            topPlusMinusPerGame: [],
            teamGoalsFor: [],
            teamGoalsAgainst: [],
            teamPenaltyGoals: [],
            topCleanSheets: [],
            teamYellowCards: [],
            teamRedCards: [],
            gamesPlayed: {} as Record<string, number>,
        };

        const isBasqueteMemo = sportFilter === 'Basquetebol' || sportFilter === 'Basquete 3x3';
        const getMatchEvents = (events: unknown) => {
            if (Array.isArray(events)) return events;
            if (typeof events === 'string') {
                try {
                    const parsed = JSON.parse(events);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            return [];
        };
        const getPointsFromDescription = (description?: string) => {
            const pointsMatch = description?.match(/\+(\d+)\s*(?:pt|pts|ponto|pontos)\b/i);
            const points = pointsMatch ? Number(pointsMatch[1]) : 1;
            return Number.isFinite(points) ? points : 1;
        };
        const getTeamCourseFaculty = (teamObj: { name?: string; course?: string; faculty?: string }) => {
            const nameParts = String(teamObj?.name || '').split(' - ').map(part => part.trim()).filter(Boolean);
            const courseParts = String(teamObj?.course || '').split(' - ').map(part => part.trim()).filter(Boolean);

            const facultyFromName = nameParts.slice(1).join(' - ');
            const facultyFromCourse = courseParts.slice(1).join(' - ');

            const course =
                (teamObj?.course && !teamObj.course.includes(' - ') && teamObj.course.trim()) ||
                nameParts[0] ||
                courseParts[0] ||
                String(teamObj?.course || teamObj?.name || '').trim();

            const faculty = String(teamObj?.faculty || '').trim() || facultyFromName || facultyFromCourse;

            return { course, faculty };
        };

        const filteredMatches = matches.filter(
            m => m.status === 'finished' && m.sport === sportFilter && m.category === genderFilter
        );

        // Pontos/sets por equipe
        const teamStats: Record<string, { scored: number; conceded: number; course: string; name: string; faculty: string; games: number; wins: number }> = {};
        filteredMatches.forEach(m => {
            const teamAInfo = getTeamCourseFaculty(m.teamA);
            const teamBInfo = getTeamCourseFaculty(m.teamB);
            if (!teamStats[m.teamA.name]) teamStats[m.teamA.name] = { scored: 0, conceded: 0, course: teamAInfo.course, name: m.teamA.name, faculty: teamAInfo.faculty, games: 0, wins: 0 };
            if (!teamStats[m.teamB.name]) teamStats[m.teamB.name] = { scored: 0, conceded: 0, course: teamBInfo.course, name: m.teamB.name, faculty: teamBInfo.faculty, games: 0, wins: 0 };
            teamStats[m.teamA.name].scored += m.scoreA;
            teamStats[m.teamA.name].conceded += m.scoreB;
            teamStats[m.teamA.name].games += 1;
            teamStats[m.teamB.name].scored += m.scoreB;
            teamStats[m.teamB.name].conceded += m.scoreA;
            teamStats[m.teamB.name].games += 1;
            if (m.scoreA > m.scoreB) teamStats[m.teamA.name].wins += 1;
            if (m.scoreB > m.scoreA) teamStats[m.teamB.name].wins += 1;
        });

        let teams = Object.values(teamStats);
        if (courseFilter) teams = teams.filter(t => t.course === courseFilter);

        const bestAttack = [...teams].sort((a, b) => {
            const avgA = a.games > 0 ? a.scored / a.games : 0;
            const avgB = b.games > 0 ? b.scored / b.games : 0;
            return avgB - avgA;
        });
        const bestDefense = [...teams].sort((a, b) => {
            const avgA = a.games > 0 ? a.conceded / a.games : 0;
            const avgB = b.games > 0 ? b.conceded / b.games : 0;
            return avgA - avgB;
        });

        // Pontuadores individuais a partir dos eventos de gol
        const goalMap: Record<string, { name: string; course: string; faculty: string; goals: number; gamesSet: Set<string> }> = {};
        const singleGameMap: Record<string, { name: string; course: string; faculty: string; points: number; matchLabel: string }> = {};
        const threePointersMap: Record<string, { name: string; course: string; faculty: string; threes: number }> = {};
        const freeThrowsMap: Record<string, { name: string; course: string; faculty: string; freeThrows: number }> = {};
        const penaltyGoalMap: Record<string, { name: string; course: string; faculty: string; penalties: number }> = {};
        const yellowPlayerMap: Record<string, { name: string; course: string; faculty: string; yellowCards: number }> = {};
        const redPlayerMap: Record<string, { name: string; course: string; faculty: string; redCards: number }> = {};
        const teamCleanSheetsMap: Record<string, number> = {};
        const teamYellowMap: Record<string, number> = {};
        const teamRedMap: Record<string, number> = {};
        const teamPenaltyMap: Record<string, number> = {};

        filteredMatches.forEach(m => {
            if (m.scoreB === 0) teamCleanSheetsMap[m.teamA.name] = (teamCleanSheetsMap[m.teamA.name] || 0) + 1;
            if (m.scoreA === 0) teamCleanSheetsMap[m.teamB.name] = (teamCleanSheetsMap[m.teamB.name] || 0) + 1;
        });

        filteredMatches.forEach(m => {
            getMatchEvents(m.events).forEach((evt: any) => {
                if (evt.type !== 'goal' && evt.type !== 'penalty_scored') return;
                if (!evt.player) return;
                const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                const teamInfo = getTeamCourseFaculty(teamObj);
                const key = evt.player;
                if (!goalMap[key]) goalMap[key] = {
                    name: evt.player,
                    course: teamInfo.course,
                    faculty: teamInfo.faculty,
                    goals: 0,
                    gamesSet: new Set<string>(),
                };
                const pts = isBasqueteMemo
                    ? getPointsFromDescription(evt.description)
                    : 1;
                goalMap[key].goals += pts;
                goalMap[key].gamesSet.add(m.id);

                if (isBasqueteMemo) {
                    const singleGameKey = `${evt.player}::${String(m.id)}`;
                    if (!singleGameMap[singleGameKey]) {
                        singleGameMap[singleGameKey] = {
                            name: evt.player,
                            course: teamInfo.course,
                            faculty: teamInfo.faculty,
                            points: 0,
                            matchLabel: `${m.teamA.name.split(' - ')[0]} x ${m.teamB.name.split(' - ')[0]}`,
                        };
                    }
                    singleGameMap[singleGameKey].points += pts;

                    const longShotValue = sportFilter === 'Basquete 3x3' ? 2 : 3;
                    if (pts === longShotValue) {
                        if (!threePointersMap[key]) {
                            threePointersMap[key] = {
                                name: evt.player,
                                course: teamInfo.course,
                                faculty: teamInfo.faculty,
                                threes: 0,
                            };
                        }
                        threePointersMap[key].threes += 1;
                    }

                    if (pts === 1) {
                        if (!freeThrowsMap[key]) {
                            freeThrowsMap[key] = {
                                name: evt.player,
                                course: teamInfo.course,
                                faculty: teamInfo.faculty,
                                freeThrows: 0,
                            };
                        }
                        freeThrowsMap[key].freeThrows += 1;
                    }
                }
            });

            getMatchEvents(m.events).forEach((evt: any) => {
                const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                const teamInfo = getTeamCourseFaculty(teamObj);

                if (evt.type === 'penalty_scored' && evt.player) {
                    const key = evt.player;
                    if (!penaltyGoalMap[key]) {
                        penaltyGoalMap[key] = {
                            name: evt.player,
                            course: teamInfo.course,
                            faculty: teamInfo.faculty,
                            penalties: 0,
                        };
                    }
                    penaltyGoalMap[key].penalties += 1;
                    teamPenaltyMap[teamObj.name] = (teamPenaltyMap[teamObj.name] || 0) + 1;
                }

                if (evt.type === 'yellow_card' && evt.player) {
                    const key = evt.player;
                    if (!yellowPlayerMap[key]) {
                        yellowPlayerMap[key] = {
                            name: evt.player,
                            course: teamInfo.course,
                            faculty: teamInfo.faculty,
                            yellowCards: 0,
                        };
                    }
                    yellowPlayerMap[key].yellowCards += 1;
                    teamYellowMap[teamObj.name] = (teamYellowMap[teamObj.name] || 0) + 1;
                }

                if (evt.type === 'red_card' && evt.player) {
                    const key = evt.player;
                    if (!redPlayerMap[key]) {
                        redPlayerMap[key] = {
                            name: evt.player,
                            course: teamInfo.course,
                            faculty: teamInfo.faculty,
                            redCards: 0,
                        };
                    }
                    redPlayerMap[key].redCards += 1;
                    teamRedMap[teamObj.name] = (teamRedMap[teamObj.name] || 0) + 1;
                }
            });
        });

        let topScorers = Object.values(goalMap)
            .map(p => {
                const games = Math.max(p.gamesSet.size, 1);
                return {
                    name: p.name,
                    course: p.course,
                    faculty: p.faculty,
                    goals: p.goals,
                    games,
                    ppg: p.goals / games,
                };
            })
            .sort((a, b) => isBasqueteMemo ? (b.ppg - a.ppg) || (b.goals - a.goals) : b.goals - a.goals)
            .slice(0, 20);

        let topSingleGamePerformances = Object.values(singleGameMap);
        if (courseFilter) topSingleGamePerformances = topSingleGamePerformances.filter(p => p.course === courseFilter);
        topSingleGamePerformances = topSingleGamePerformances
            .sort((a, b) => b.points - a.points)
            .slice(0, 20);

        let topThreePointers = isBasqueteMemo ? Object.values(threePointersMap) : [];
        if (courseFilter) topThreePointers = topThreePointers.filter(p => p.course === courseFilter);
        topThreePointers = topThreePointers
            .sort((a, b) => b.threes - a.threes)
            .slice(0, 20);

        let topFreeThrows = isBasqueteMemo ? Object.values(freeThrowsMap) : [];
        if (courseFilter) topFreeThrows = topFreeThrows.filter(p => p.course === courseFilter);
        topFreeThrows = topFreeThrows
            .sort((a, b) => b.freeThrows - a.freeThrows)
            .slice(0, 20);

        const topWins = [...teams]
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 20)
            .map(t => ({
                ...t,
                winRate: t.games > 0 ? (t.wins / t.games) * 100 : 0,
            }));

        const topPlusMinusPerGame = [...teams]
            .map(t => ({
                ...t,
                plusMinus: t.scored - t.conceded,
                plusMinusPerGame: t.games > 0 ? (t.scored - t.conceded) / t.games : 0,
            }))
            .sort((a, b) => b.plusMinusPerGame - a.plusMinusPerGame)
            .slice(0, 20);

        let topPenaltyScorers = Object.values(penaltyGoalMap);
        if (courseFilter) topPenaltyScorers = topPenaltyScorers.filter(p => p.course === courseFilter);
        topPenaltyScorers = topPenaltyScorers.sort((a, b) => b.penalties - a.penalties).slice(0, 20);

        let topYellowPlayers = Object.values(yellowPlayerMap);
        if (courseFilter) topYellowPlayers = topYellowPlayers.filter(p => p.course === courseFilter);
        topYellowPlayers = topYellowPlayers.sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 20);

        let topRedPlayers = Object.values(redPlayerMap);
        if (courseFilter) topRedPlayers = topRedPlayers.filter(p => p.course === courseFilter);
        topRedPlayers = topRedPlayers.sort((a, b) => b.redCards - a.redCards).slice(0, 20);

        const teamGoalsFor = [...teams].sort((a, b) => b.scored - a.scored).slice(0, 20);
        const teamGoalsAgainst = [...teams].sort((a, b) => a.conceded - b.conceded).slice(0, 20);
        const teamPenaltyGoals = [...teams]
            .map(t => ({ ...t, penaltyGoals: teamPenaltyMap[t.name] || 0 }))
            .sort((a, b) => b.penaltyGoals - a.penaltyGoals)
            .slice(0, 20);
        const topCleanSheets = [...teams]
            .map(t => ({ ...t, cleanSheets: teamCleanSheetsMap[t.name] || 0 }))
            .sort((a, b) => b.cleanSheets - a.cleanSheets)
            .slice(0, 20);
        const teamYellowCards = [...teams]
            .map(t => ({ ...t, yellowCards: teamYellowMap[t.name] || 0 }))
            .sort((a, b) => b.yellowCards - a.yellowCards)
            .slice(0, 20);
        const teamRedCards = [...teams]
            .map(t => ({ ...t, redCards: teamRedMap[t.name] || 0 }))
            .sort((a, b) => b.redCards - a.redCards)
            .slice(0, 20);

        const gamesPlayed = Object.fromEntries(Object.entries(teamStats).map(([k, v]) => [k, v.games]));
        return {
            bestAttack,
            bestDefense,
            topScorers,
            topSingleGamePerformances,
            topThreePointers,
            topFreeThrows,
            topPenaltyScorers,
            topYellowPlayers,
            topRedPlayers,
            topWins,
            topPlusMinusPerGame,
            teamGoalsFor,
            teamGoalsAgainst,
            teamPenaltyGoals,
            topCleanSheets,
            teamYellowCards,
            teamRedCards,
            gamesPlayed,
        };
    }, [matches, sportFilter, courseFilter, genderFilter, isAnyLayout]);

    const maxAttack = Math.max(...stats.bestAttack.map(t => t.scored / Math.max(stats.gamesPlayed[t.name] || 1, 1)), 1);
    const maxDefense = Math.max(...stats.bestDefense.map(t => t.conceded / Math.max(stats.gamesPlayed[t.name] || 1, 1)), 1);
    const formatTeamLabel = (course?: string, faculty?: string) => {
        const normalizedCourse = String(course || '').trim();
        const normalizedFaculty = String(faculty || '').trim();

        if (normalizedCourse.includes(' - ')) {
            const [courseName, ...facultyParts] = normalizedCourse.split(' - ').map(part => part.trim()).filter(Boolean);
            const displayFaculty = normalizedFaculty || facultyParts.join(' - ');
            return `${courseName} | ${displayFaculty || '-'}`;
        }

        return `${normalizedCourse || '-'} | ${normalizedFaculty || '-'}`;
    };

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
                        {(isInvasaoLayout || isRedeLayout || isOnlyWinsLayout) && (
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
                                Estatísticas disponíveis para: {[...MODALIDADES_GOLS, ...MODALIDADES_REDE, ...MODALIDADES_SO_VITORIAS].join(', ')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {!isOnlyWinsLayout && !isFutevolei && (
                            <section style={{ marginBottom: '30px' }}>
                                <h2 style={sectionTitleStyle}>Estatísticas de Jogadores</h2>
                                <div style={twoCardsGridStyle}>
                                    {/* Coluna 1 — Artilheiros / Cestinhas / Maiores Pontuadores */}
                                    <div style={cardStyle}>
                                        <div style={cardHeaderStyle}>
                                            <BarChart2 size={22} color="#fbbf24" />
                                            <div>
                                                <h2 style={cardTitleStyle}>
                                                    {isBasquete ? 'Pontos por Jogo' : isRedeLayout ? '🏐 Maiores Pontuadores' : '🥇 Artilheiros'}
                                                </h2>
                                            </div>
                                        </div>
                                        <div style={cardListScrollStyle}>
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
                                                            }}>{`${scorer.course} | ${scorer.faculty || '-'}`}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {isBasquete
                                                            ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>PPJ</span>
                                                            : isRedeLayout
                                                            ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>Pts</span>
                                                            : <Target size={14} color="#fbbf24" />
                                                        }
                                                        <span style={{ fontWeight: 800, color: idx === 0 ? '#fbbf24' : 'white', fontSize: '18px' }}>
                                                            {isBasquete ? scorer.ppg.toFixed(1) : scorer.goals}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isBasquete && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Trophy size={22} color="#f97316" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>Maiores Pontuações em um Jogo</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topSingleGamePerformances.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topSingleGamePerformances.map((performance, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(249,115,22,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{performance.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${performance.course} | ${performance.faculty || '-'}`} · {performance.matchLabel}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f97316' }}>
                                                                {performance.points} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isBasquete && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Target size={22} color="#38bdf8" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>{isBasquete3x3 ? 'Total de Bolas de 2' : 'Total de Bolas de 3'}</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topThreePointers.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topThreePointers.map((player, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{player.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${player.course} | ${player.faculty || '-'}`}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                                                                {player.threes} {isBasquete3x3 ? '2PT' : '3PT'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isBasquete && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Target size={22} color="#22c55e" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>{isBasquete3x3 ? 'Total de 1 ponto' : 'Total de Lance Livre'}</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topFreeThrows.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topFreeThrows.map((player, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(34,197,94,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{player.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${player.course} | ${player.faculty || '-'}`}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e' }}>
                                                                {player.freeThrows} {isBasquete3x3 ? '1PT' : 'LL'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(isFutebol || isHandebol) && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Target size={22} color="#f97316" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>{isHandebol ? 'Gols 7m' : 'Gols de Pênalti'}</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topPenaltyScorers.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topPenaltyScorers.map((player, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(249,115,22,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{player.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${player.course} | ${player.faculty || '-'}`}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f97316' }}>{player.penalties} {isHandebol ? '7m' : 'GP'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(isFutebol || isHandebol) && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Target size={22} color="#facc15" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>Cartões Amarelos</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topYellowPlayers.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topYellowPlayers.map((player, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(250,204,21,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{player.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${player.course} | ${player.faculty || '-'}`}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#facc15' }}>{player.yellowCards} CA</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(isFutebol || isHandebol) && (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Target size={22} color="#ef4444" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>Cartões Vermelhos</h2>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topRedPlayers.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topRedPlayers.map((player, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(239,68,68,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{player.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${player.course} | ${player.faculty || '-'}`}</div>
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{player.redCards} CV</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                            )}

                            <section>
                                <h2 style={sectionTitleStyle}>Estatísticas de Equipes</h2>
                                <div style={twoCardsGridStyle}>
                                    {isOnlyWinsLayout ? (
                                        <div style={cardStyle}>
                                            <div style={cardHeaderStyle}>
                                                <Trophy size={22} color="#a78bfa" />
                                                <div>
                                                    <h2 style={cardTitleStyle}>Mais vitórias</h2>
                                                    <p style={cardSubStyle}>Ranking de vitórias por equipe</p>
                                                </div>
                                            </div>
                                            <div style={cardListScrollStyle}>
                                                {stats.topWins.length === 0 ? (
                                                    <EmptyState />
                                                ) : stats.topWins.slice(0, 10).map((team, idx) => (
                                                    <div key={`wins-only-${idx}`} style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        marginBottom: '6px',
                                                        background: idx === 0 ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
                                                        border: idx === 0 ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                            </div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa' }}>{team.wins} V</div>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : isHandebol ? (
                                        <>
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Sword size={22} color="#22c55e" /><div><h2 style={cardTitleStyle}>Gols Marcados</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamGoalsFor.length === 0 ? <EmptyState /> : stats.teamGoalsFor.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`hgf-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.scored} GM`} color="#22c55e" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Shield size={22} color="#3b82f6" /><div><h2 style={cardTitleStyle}>Gols Sofridos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamGoalsAgainst.length === 0 ? <EmptyState /> : stats.teamGoalsAgainst.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`hgs-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.conceded} GS`} color="#3b82f6" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Trophy size={22} color="#a78bfa" /><div><h2 style={cardTitleStyle}>7m marcados</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamPenaltyGoals.length === 0 ? <EmptyState /> : stats.teamPenaltyGoals.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`h7m-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.penaltyGoals} 7m`} color="#a78bfa" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Target size={22} color="#facc15" /><div><h2 style={cardTitleStyle}>Cartões Amarelos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamYellowCards.length === 0 ? <EmptyState /> : stats.teamYellowCards.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`hyc-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.yellowCards} CA`} color="#facc15" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Target size={22} color="#ef4444" /><div><h2 style={cardTitleStyle}>Cartões Vermelhos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamRedCards.length === 0 ? <EmptyState /> : stats.teamRedCards.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`hrc-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.redCards} CV`} color="#ef4444" />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : isFutebol ? (
                                        <>
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Sword size={22} color="#22c55e" /><div><h2 style={cardTitleStyle}>Gols Marcados</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamGoalsFor.length === 0 ? <EmptyState /> : stats.teamGoalsFor.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`gf-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.scored} GM`} color="#22c55e" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Shield size={22} color="#3b82f6" /><div><h2 style={cardTitleStyle}>Gols Sofridos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamGoalsAgainst.length === 0 ? <EmptyState /> : stats.teamGoalsAgainst.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`ga-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.conceded} GS`} color="#3b82f6" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Trophy size={22} color="#a78bfa" /><div><h2 style={cardTitleStyle}>Mais Vitórias</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`w-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.wins} V`} color="#a78bfa" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Target size={22} color="#14b8a6" /><div><h2 style={cardTitleStyle}>Clean Sheets</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topCleanSheets.length === 0 ? <EmptyState /> : stats.topCleanSheets.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`cs-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.cleanSheets} CS`} color="#14b8a6" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Target size={22} color="#facc15" /><div><h2 style={cardTitleStyle}>Cartões Amarelos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamYellowCards.length === 0 ? <EmptyState /> : stats.teamYellowCards.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`yc-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.yellowCards} CA`} color="#facc15" />
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Target size={22} color="#ef4444" /><div><h2 style={cardTitleStyle}>Cartões Vermelhos</h2></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamRedCards.length === 0 ? <EmptyState /> : stats.teamRedCards.slice(0, 10).map((team, idx) => (
                                                        <SimpleTeamRow key={`rc-${idx}`} idx={idx} course={team.course} faculty={team.faculty} value={`${team.redCards} CV`} color="#ef4444" />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Coluna 2 — Melhor Ataque */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <Sword size={22} color="#22c55e" />
                                                    <div>
                                                        <h2 style={cardTitleStyle}>
                                                            {isBasquete ? 'Melhor Ataque por Jogo' : isRedeLayout ? 'Melhor Ataque por Jogo (Sets)' : 'Melhor Ataque por Jogo'}
                                                        </h2>
                                                        <p style={cardSubStyle}>
                                                            {isBasquete ? 'Maior média de pontos por jogo' : isRedeLayout ? 'Maior média de sets por jogo' : 'Maior média de gols por jogo'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.bestAttack.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.bestAttack.slice(0, 10).map((team, idx) => (
                                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                    <div>
                                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{formatTeamLabel(team.course, team.faculty)}</div>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const games = stats.gamesPlayed[team.name] || 1;
                                                                    const avg = team.scored / games;
                                                                    const unit = isBasquete ? 'pts/j' : isRedeLayout ? 'sets/j' : 'g/j';
                                                                    return (
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e' }}>
                                                                    {avg.toFixed(1)} {unit}
                                                                </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                                {(() => {
                                                                    const games = stats.gamesPlayed[team.name] || 1;
                                                                    const avg = team.scored / games;
                                                                    return (
                                                                        <div style={{
                                                                            height: '100%', borderRadius: '999px', background: '#16a34a',
                                                                            width: `${Math.round((avg / maxAttack) * 100)}%`,
                                                                            transition: 'width 0.6s ease',
                                                                        }} />
                                                                    );
                                                                })()}
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
                                                            {isBasquete ? 'Defesa por Jogo' : isRedeLayout ? 'Defesa por Jogo (Sets)' : 'Defesa por Jogo'}
                                                        </h2>
                                                        <p style={cardSubStyle}>
                                                            {isBasquete ? 'Menor média de pontos sofridos por jogo' : isRedeLayout ? 'Menor média de sets sofridos por jogo' : 'Menor média de gols sofridos por jogo'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.bestDefense.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.bestDefense.slice(0, 10).map((team, idx) => {
                                                        const games = stats.gamesPlayed[team.name] || 1;
                                                        const avgConceded = team.conceded / games;
                                                        const displayValue = isBasquete
                                                            ? `${avgConceded.toFixed(1)} pts/j`
                                                            : isRedeLayout
                                                            ? `${avgConceded.toFixed(1)} sets/j`
                                                            : `${avgConceded.toFixed(1)} g/j`;
                                                        const barValue = avgConceded;
                                                        return (
                                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                    <div>
                                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{formatTeamLabel(team.course, team.faculty)}</div>
                                                                    </div>
                                                                </div>
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>
                                                                    {displayValue}
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

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <Trophy size={22} color="#a78bfa" />
                                                    <div>
                                                        <h2 style={cardTitleStyle}>Mais vitórias</h2>
                                                        <p style={cardSubStyle}>Ranking de vitórias por equipe</p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`wins-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {formatTeamLabel(team.course, team.faculty)}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa' }}>{team.wins} V</div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <Trophy size={22} color="#f43f5e" />
                                                    <div>
                                                        <h2 style={cardTitleStyle}>+/- por jogo</h2>
                                                        <p style={cardSubStyle}>Saldo médio por jogo de cada equipe</p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topPlusMinusPerGame.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.topPlusMinusPerGame.slice(0, 10).map((team, idx) => (
                                                        <div key={`pm-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(244,63,94,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {formatTeamLabel(team.course, team.faculty)}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f43f5e' }}>
                                                                    {team.plusMinusPerGame >= 0 ? '+' : ''}{team.plusMinusPerGame.toFixed(1)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        </>
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

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 14px',
};

const twoCardsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '24px',
    width: '100%',
};

const cardListScrollStyle: React.CSSProperties = {
    maxHeight: '360px',
    overflowY: 'auto',
    paddingRight: '6px',
    WebkitOverflowScrolling: 'touch',
};

const formatTeamLabel = (course?: string, faculty?: string) => {
    const normalizedCourse = String(course || '').trim();
    const normalizedFaculty = String(faculty || '').trim();

    if (normalizedCourse.includes(' - ')) {
        const [courseName, ...facultyParts] = normalizedCourse.split(' - ').map(part => part.trim()).filter(Boolean);
        const displayFaculty = normalizedFaculty || facultyParts.join(' - ');
        return `${courseName} | ${displayFaculty || '-'}`;
    }

    return `${normalizedCourse || '-'} | ${normalizedFaculty || '-'}`;
};

const SimpleTeamRow: FC<{ idx: number; course: string; faculty?: string; value: string; color: string }> = ({ idx, course, faculty, value, color }) => (
    <div style={{
        padding: '10px 12px',
        borderRadius: '10px',
        marginBottom: '6px',
        background: idx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        border: idx === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(course, faculty)}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color }}>{value}</div>
        </div>
    </div>
);

const EmptyState = () => (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <FileSearch size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
        <p style={{ fontSize: '14px' }}>Nenhum dado encontrado</p>
    </div>
);

export default Estatisticas;
