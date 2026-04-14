import { type FC, useState, useMemo } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { BarChart2, Shield, Sword, FileSearch, Target, Trophy, Timer } from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockData';

// Tipo local para eventos de partida usados no useMemo
interface RawMatchEvent {
    type: string;
    player?: string;
    teamId?: string;
    description?: string;
    minute?: number;
    id?: string;
}

// Tipos para listas de estatísticas
interface PlayerStat {
    name: string;
    course: string;
    faculty: string;
}
interface AceStat extends PlayerStat { aces: number }
interface ServeErrorStat extends PlayerStat { errors: number }
interface SetsConsistencyStat {
    name: string;
    course: string;
    faculty: string;
    pointsConceded: number;
    setsPlayed: number;
    avgConceded: number;
}
interface VolleyDefenseStat {
    name: string;
    course: string;
    faculty: string;
    pointsConceded: number;
    games: number;
    avgConceded: number;
}
interface TeamAceStat { name: string; course: string; faculty: string; aces: number }
interface TeamServeErrorStat { name: string; course: string; faculty: string; errors: number }
interface TeamStatEntry {
    name: string;
    course: string;
    faculty: string;
    scored: number;
    conceded: number;
    games: number;
    wins: number;
}

// Modalidades que usam gols/pontos por atleta (LAYOUT_INVASAO)
const MODALIDADES_GOLS = ['Futsal', 'Futebol Society', 'Futebol X1', 'Handebol', 'Basquetebol', 'Basquete 3x3'];

// Modalidades de rede (LAYOUT_REDE)
const MODALIDADES_REDE = ['Vôlei', 'Vôlei de Praia', 'Futevôlei'];
const MODALIDADES_FUTEBOL = ['Futebol Society', 'Futsal', 'Futebol X1'];

const Estatisticas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { matches, courses: allCourses } = useData();

    const [sportFilter, setSportFilter] = useState<string>(AVAILABLE_SPORTS[3]);
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [genderFilter, setGenderFilter] = useState<string>('Masculino');

    const isInvasaoLayout = MODALIDADES_GOLS.includes(sportFilter);
    const isRedeLayout = MODALIDADES_REDE.includes(sportFilter);
    const isBeachTennis = sportFilter === 'Beach Tennis';
    const isTamboreu = sportFilter === 'Tamboréu';
    const isTenisDeMesa = sportFilter === 'Tênis de Mesa' || sportFilter === 'Tenis de Mesa';
    const isKarate = sportFilter === 'Caratê';
    const isJudo = sportFilter === 'Judô';
    const isXadrez = sportFilter === 'Xadrez';
    const isNatacao = sportFilter === 'Natação';
    const isAnyLayout = isInvasaoLayout || isRedeLayout || isBeachTennis || isTamboreu || isTenisDeMesa || isKarate || isJudo || isXadrez || isNatacao;
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
            topAces: [] as AceStat[],
            topServeErrors: [] as ServeErrorStat[],
            teamStatsList: [] as TeamStatEntry[],
            topSetsConsistencyList: [] as SetsConsistencyStat[],
            volleyDefenseList: [] as VolleyDefenseStat[],
            teamTopAces: [] as TeamAceStat[],
            teamTopServeErrors: [] as TeamServeErrorStat[],
            swimTopTimes: [] as { athlete: string; course: string; timeStr: string; timeMs: number }[],
            karateStats: null as null | {
                medalTable: { course: string; faculty: string; gold: number; silver: number; bronze: number; total: number }[];
                topScorers: { name: string; course: string; faculty: string; yuko: number; wazaAri: number; ippon: number; total: number }[];
                topIppons: { course: string; faculty: string; ippons: number }[];
                topSenshu: { course: string; faculty: string; senshu: number }[];
            },
            judoStats: null as null | {
                topFinishers: { name: string; course: string; faculty: string; ippons: number; wazaAri: number }[];
                topTech: { course: string; faculty: string; score: number; ippons: number; wazaAris: number }[];
                topDiscipline: { course: string; faculty: string; shidos: number }[];
            },
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
        // Mapas de Aces e Erros de Saque (vôlei)
        const aceMap: Record<string, { name: string; course: string; faculty: string; aces: number }> = {};
        const serveErrorMap: Record<string, { name: string; course: string; faculty: string; errors: number }> = {};
        const teamAceMap: Record<string, { course: string; faculty: string; aces: number }> = {};
        const teamServeErrorMap: Record<string, { course: string; faculty: string; errors: number }> = {};
        const teamCleanSheetsMap: Record<string, number> = {};
        const teamYellowMap: Record<string, number> = {};
        const teamRedMap: Record<string, number> = {};
        const teamPenaltyMap: Record<string, number> = {};
        const setsEfficacyMap: Record<string, { pointsConceded: number; setsPlayed: number; course: string; name: string; faculty: string }> = {};
        const volleyPointsConcededMap: Record<string, { pointsConceded: number; games: number; course: string; name: string; faculty: string }> = {};

        filteredMatches.forEach(m => {
            if (m.scoreB === 0) teamCleanSheetsMap[m.teamA.name] = (teamCleanSheetsMap[m.teamA.name] || 0) + 1;
            if (m.scoreA === 0) teamCleanSheetsMap[m.teamB.name] = (teamCleanSheetsMap[m.teamB.name] || 0) + 1;

            // Pontos sofridos reais no vôlei (eventos goal = ponto de rally)
            if (MODALIDADES_REDE.includes(m.sport)) {
                const teamAInfo = getTeamCourseFaculty(m.teamA);
                const teamBInfo = getTeamCourseFaculty(m.teamB);
                if (!volleyPointsConcededMap[m.teamA.name]) volleyPointsConcededMap[m.teamA.name] = { pointsConceded: 0, games: 0, course: teamAInfo.course, name: m.teamA.name, faculty: teamAInfo.faculty };
                if (!volleyPointsConcededMap[m.teamB.name]) volleyPointsConcededMap[m.teamB.name] = { pointsConceded: 0, games: 0, course: teamBInfo.course, name: m.teamB.name, faculty: teamBInfo.faculty };
                volleyPointsConcededMap[m.teamA.name].games += 1;
                volleyPointsConcededMap[m.teamB.name].games += 1;
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type === 'goal') {
                        if (evt.teamId === m.teamB.id) volleyPointsConcededMap[m.teamA.name].pointsConceded += 1;
                        if (evt.teamId === m.teamA.id) volleyPointsConcededMap[m.teamB.name].pointsConceded += 1;
                    }
                });
            }

            if (m.sport === 'Tamboréu' || m.sport === 'Tênis de Mesa' || m.sport === 'Tenis de Mesa') {
                const teamAInfo = getTeamCourseFaculty(m.teamA);
                const teamBInfo = getTeamCourseFaculty(m.teamB);
                if (!setsEfficacyMap[m.teamA.name]) setsEfficacyMap[m.teamA.name] = { pointsConceded: 0, setsPlayed: 0, course: teamAInfo.course, name: m.teamA.name, faculty: teamAInfo.faculty };
                if (!setsEfficacyMap[m.teamB.name]) setsEfficacyMap[m.teamB.name] = { pointsConceded: 0, setsPlayed: 0, course: teamBInfo.course, name: m.teamB.name, faculty: teamBInfo.faculty };
                
                setsEfficacyMap[m.teamA.name].setsPlayed += (m.scoreA + m.scoreB);
                setsEfficacyMap[m.teamB.name].setsPlayed += (m.scoreA + m.scoreB);

                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type === 'goal') {
                        if (evt.teamId === m.teamB.id) setsEfficacyMap[m.teamA.name].pointsConceded += 1;
                        if (evt.teamId === m.teamA.id) setsEfficacyMap[m.teamB.name].pointsConceded += 1;
                    }
                });
            }
        });

        filteredMatches.forEach(m => {
            getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
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

            getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
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

                // Aces: eventos goal com descrição iniciando em '🏐 ACE!'
                if (evt.type === 'goal' && evt.player && String(evt.description || '').includes('ACE!')) {
                    const key = evt.player;
                    if (!aceMap[key]) aceMap[key] = { name: evt.player, course: teamInfo.course, faculty: teamInfo.faculty, aces: 0 };
                    aceMap[key].aces += 1;
                    if (!teamAceMap[teamObj.name]) teamAceMap[teamObj.name] = { course: teamInfo.course, faculty: teamInfo.faculty, aces: 0 };
                    teamAceMap[teamObj.name].aces += 1;
                }

                // Erros de Saque: eventos goal com descrição contendo 'Erro de Saque'
                if (evt.type === 'goal' && evt.player && String(evt.description || '').includes('Erro de Saque')) {
                    // O player no evento de erro é quem cometeu o erro
                    const key = evt.player;
                    if (!serveErrorMap[key]) serveErrorMap[key] = { name: evt.player, course: teamInfo.course, faculty: teamInfo.faculty, errors: 0 };
                    serveErrorMap[key].errors += 1;
                    if (!teamServeErrorMap[teamObj.name]) teamServeErrorMap[teamObj.name] = { course: teamInfo.course, faculty: teamInfo.faculty, errors: 0 };
                    teamServeErrorMap[teamObj.name].errors += 1;
                }
            });
        });

        const topScorers = Object.values(goalMap)
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

        // Aces e Erros de Saque (vôlei)
        let topAces = Object.values(aceMap);
        if (courseFilter) topAces = topAces.filter(p => p.course === courseFilter);
        topAces = topAces.sort((a, b) => b.aces - a.aces).slice(0, 20);

        let topServeErrors = Object.values(serveErrorMap);
        if (courseFilter) topServeErrors = topServeErrors.filter(p => p.course === courseFilter);
        topServeErrors = topServeErrors.sort((a, b) => b.errors - a.errors).slice(0, 20);

        let teamTopAces = Object.entries(teamAceMap).map(([name, v]) => ({ name, ...v }));
        if (courseFilter) teamTopAces = teamTopAces.filter(t => t.course === courseFilter);
        teamTopAces = teamTopAces.sort((a, b) => b.aces - a.aces).slice(0, 20);

        let teamTopServeErrors = Object.entries(teamServeErrorMap).map(([name, v]) => ({ name, ...v }));
        if (courseFilter) teamTopServeErrors = teamTopServeErrors.filter(t => t.course === courseFilter);
        teamTopServeErrors = teamTopServeErrors.sort((a, b) => b.errors - a.errors).slice(0, 20);

        let topSetsConsistency = Object.values(setsEfficacyMap);
        if (courseFilter) topSetsConsistency = topSetsConsistency.filter(p => p.course === courseFilter);
        const topSetsConsistencyList = topSetsConsistency.map(p => {
            const avg = p.setsPlayed > 0 ? (p.pointsConceded / p.setsPlayed) : 0;
            return { ...p, avgConceded: avg };
        }).sort((a, b) => a.avgConceded - b.avgConceded).slice(0, 20);

        let volleyDefense = Object.values(volleyPointsConcededMap);
        if (courseFilter) volleyDefense = volleyDefense.filter(p => p.course === courseFilter);
        const volleyDefenseList = volleyDefense
            .map(p => ({ ...p, avgConceded: p.games > 0 ? p.pointsConceded / p.games : 0 }))
            .sort((a, b) => a.avgConceded - b.avgConceded)
            .slice(0, 20);

        // ── Natação — Menores Tempos ─────────────────────────────────────────────
        const parseSwimTime = (timeStr: string): number => {
            // Formato esperado: MM:SS.CC (ex: 00:58.32) → converte para ms
            const m = timeStr.match(/^(\d+):(\d+)\.(\d+)$/);
            if (!m) return Infinity;
            return (parseInt(m[1]) * 60 + parseInt(m[2])) * 1000 + parseInt(m[3].padEnd(2, '0').slice(0, 2)) * 10;
        };
        const swimTimesMap: Record<string, { athlete: string; course: string; timeStr: string; timeMs: number }> = {};
        if (sportFilter === 'Natação') {
            const swimMatches = matches.filter(m => m.sport === 'Natação' && m.status === 'finished' && m.category === genderFilter);
            swimMatches.forEach(m => {
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'swimming_result' || !evt.description) return;
                    // Formato: "1º - NomeAtleta (MM:SS.CC) - NomeCurso"
                    const match = evt.description.match(/^\d+º\s*-\s*(.+?)\s*\((\d+:\d+\.\d+)\)\s*-\s*(.+)$/);
                    if (!match) return;
                    const [, athlete, timeStr, course] = match;
                    const timeMs = parseSwimTime(timeStr);
                    const key = athlete.trim();
                    if (!swimTimesMap[key] || timeMs < swimTimesMap[key].timeMs) {
                        swimTimesMap[key] = { athlete: athlete.trim(), course: course.trim(), timeStr, timeMs };
                    }
                });
            });
        }
        const swimTopTimes = Object.values(swimTimesMap)
            .filter(t => t.timeMs !== Infinity)
            .sort((a, b) => a.timeMs - b.timeMs)
            .slice(0, 20);

        // ── Caratê ──────────────────────────────────────────────────────────────
        let karateStats = null;
        if (sportFilter === 'Caratê') {
            const karateMatches = matches.filter(m => m.sport === 'Caratê' && m.status === 'finished' && m.category === genderFilter);

            // Quadro de medalhas por curso
            const medalMap: Record<string, { course: string; faculty: string; gold: number; silver: number; bronze: number }> = {};
            const ensureMedal = (course: string, faculty: string) => {
                if (!medalMap[course]) medalMap[course] = { course, faculty, gold: 0, silver: 0, bronze: 0 };
            };
            karateMatches.forEach(m => {
                const courseA = (m.teamA.course || m.teamA.name).split(' - ')[0].trim();
                const courseB = (m.teamB.course || m.teamB.name).split(' - ')[0].trim();
                const facA = m.teamA.faculty || '';
                const facB = m.teamB.faculty || '';
                ensureMedal(courseA, facA);
                ensureMedal(courseB, facB);
                const stage = (m.stage || '').toLowerCase();
                if (stage.includes('final') && !stage.includes('semi') && !stage.includes('quartas')) {
                    if (m.scoreA > m.scoreB) { medalMap[courseA].gold++; medalMap[courseB].silver++; }
                    else if (m.scoreB > m.scoreA) { medalMap[courseB].gold++; medalMap[courseA].silver++; }
                } else if (stage.includes('semi')) {
                    if (m.scoreA < m.scoreB) medalMap[courseA].bronze++;
                    else if (m.scoreB < m.scoreA) medalMap[courseB].bronze++;
                }
            });
            const medalTable = Object.values(medalMap)
                .map(e => ({ ...e, total: e.gold * 3 + e.silver * 2 + e.bronze }))
                .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
                .slice(0, 20);

            // Maiores pontuadores individuais
            // Yuko=+1, Waza-ari=+2, Ippon=+3 — lidos da description do evento goal
            const scorerMap: Record<string, { name: string; course: string; faculty: string; yuko: number; wazaAri: number; ippon: number }> = {};
            karateMatches.forEach(m => {
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'goal' || !evt.player) return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    const key = evt.player;
                    if (!scorerMap[key]) scorerMap[key] = { name: evt.player, course, faculty, yuko: 0, wazaAri: 0, ippon: 0 };
                    const desc = (evt.description || '').toLowerCase();
                    const pts = Number((evt.description || '').match(/\+(\d)/)?.[1] || 0);
                    if (pts === 1 || desc.includes('yuko')) scorerMap[key].yuko++;
                    else if (pts === 2 || desc.includes('waza')) scorerMap[key].wazaAri++;
                    else if (pts === 3 || desc.includes('ippon')) scorerMap[key].ippon++;
                });
            });
            const topKarateScorers = Object.values(scorerMap)
                .map(s => ({ ...s, total: s.yuko + s.wazaAri * 2 + s.ippon * 3 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 20);

            // Domínio técnico — Ippons por curso
            const ipponMap: Record<string, { course: string; faculty: string; ippons: number }> = {};
            karateMatches.forEach(m => {
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'goal') return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    const pts = Number((evt.description || '').match(/\+(\d)/)?.[1] || 0);
                    const desc = (evt.description || '').toLowerCase();
                    if (pts === 3 || desc.includes('ippon')) {
                        if (!ipponMap[course]) ipponMap[course] = { course, faculty, ippons: 0 };
                        ipponMap[course].ippons++;
                    }
                });
            });
            const topIppons = Object.values(ipponMap).sort((a, b) => b.ippons - a.ippons).slice(0, 20);

            // Vantagem Senshu por curso
            const senshuMap: Record<string, { course: string; faculty: string; senshu: number }> = {};
            karateMatches.forEach(m => {
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'senshu') return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    if (!senshuMap[course]) senshuMap[course] = { course, faculty, senshu: 0 };
                    senshuMap[course].senshu++;
                });
            });
            const topSenshu = Object.values(senshuMap).sort((a, b) => b.senshu - a.senshu).slice(0, 20);

            karateStats = { medalTable, topScorers: topKarateScorers, topIppons, topSenshu };
        }

        // ── Judô ────────────────────────────────────────────────────────────────
        let judoStats = null;
        if (sportFilter === 'Judô') {
            const judoMatches = matches.filter(m => m.sport === 'Judô' && m.status === 'finished' && m.category === genderFilter);

            // Card 1 — Maiores Finalizadores (Ippons individuais)
            const ipponPlayerMap: Record<string, { name: string; course: string; faculty: string; ippons: number; wazaAri: number }> = {};
            judoMatches.forEach(m => {
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'goal' || !evt.player) return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    const key = evt.player;
                    if (!ipponPlayerMap[key]) ipponPlayerMap[key] = { name: evt.player, course, faculty, ippons: 0, wazaAri: 0 };
                    const desc = (evt.description || '').toLowerCase();
                    if (desc.includes('ippon') || desc.includes('ponto de ouro') || desc.includes('waza-ari-awasete')) {
                        ipponPlayerMap[key].ippons++;
                    } else if (desc.includes('waza-ari')) {
                        ipponPlayerMap[key].wazaAri++;
                    }
                });
                // Fallback: sem player no evento, atribuir ao vencedor da luta
                if (m.scoreA !== m.scoreB) {
                    const winnerTeam = m.scoreA > m.scoreB ? m.teamA : m.teamB;
                    const winnerCourse = (winnerTeam.course || winnerTeam.name).split(' - ')[0].trim();
                    const winnerFaculty = winnerTeam.faculty || '';
                    const winnerKey = `__team__${winnerTeam.id}`;
                    const hasPlayerEvent = getMatchEvents(m.events).some((e: RawMatchEvent) => e.type === 'goal' && e.player);
                    if (!hasPlayerEvent) {
                        if (!ipponPlayerMap[winnerKey]) ipponPlayerMap[winnerKey] = { name: winnerTeam.name.split(' - ')[0], course: winnerCourse, faculty: winnerFaculty, ippons: 0, wazaAri: 0 };
                        ipponPlayerMap[winnerKey].ippons++;
                    }
                }
            });
            const topFinishers = Object.values(ipponPlayerMap)
                .sort((a, b) => b.ippons - a.ippons || b.wazaAri - a.wazaAri)
                .slice(0, 20);

            // Card 2 — Eficácia Técnica por curso (Ippon=10pts, Waza-ari=1pt)
            const techMap: Record<string, { course: string; faculty: string; score: number; ippons: number; wazaAris: number }> = {};
            judoMatches.forEach(m => {
                const ensureTech = (teamObj: typeof m.teamA) => {
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    if (!techMap[course]) techMap[course] = { course, faculty, score: 0, ippons: 0, wazaAris: 0 };
                };
                ensureTech(m.teamA); ensureTech(m.teamB);
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'goal') return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const desc = (evt.description || '').toLowerCase();
                    if (desc.includes('ippon') || desc.includes('ponto de ouro') || desc.includes('waza-ari-awasete')) {
                        techMap[course].score += 10; techMap[course].ippons++;
                    } else if (desc.includes('waza-ari')) {
                        techMap[course].score += 1; techMap[course].wazaAris++;
                    }
                });
            });
            const topTech = Object.values(techMap).sort((a, b) => b.score - a.score).slice(0, 20);

            // Card 3 — Índice de Disciplina (menos Shidos)
            const shidoMap: Record<string, { course: string; faculty: string; shidos: number }> = {};
            judoMatches.forEach(m => {
                const ensureShido = (teamObj: typeof m.teamA) => {
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    const faculty = teamObj.faculty || '';
                    if (!shidoMap[course]) shidoMap[course] = { course, faculty, shidos: 0 };
                };
                ensureShido(m.teamA); ensureShido(m.teamB);
                getMatchEvents(m.events).forEach((evt: RawMatchEvent) => {
                    if (evt.type !== 'shido' && evt.type !== 'hansoku_make') return;
                    const teamObj = evt.teamId === m.teamA.id ? m.teamA : m.teamB;
                    const course = (teamObj.course || teamObj.name).split(' - ')[0].trim();
                    shidoMap[course].shidos += evt.type === 'hansoku_make' ? 3 : 1;
                });
            });
            const topDiscipline = Object.values(shidoMap).sort((a, b) => a.shidos - b.shidos).slice(0, 20);

            judoStats = { topFinishers, topTech, topDiscipline };
        }

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
            topAces,
            topServeErrors,
            topSetsConsistencyList,
            volleyDefenseList,
            teamTopAces,
            teamTopServeErrors,
            swimTopTimes,
            karateStats,
            judoStats,
            teamStatsList: Object.values(teamStats).filter(t => !courseFilter || t.course === courseFilter),
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
                        {(isInvasaoLayout || isRedeLayout || isBeachTennis || isTenisDeMesa || isTamboreu || isKarate || isJudo || isXadrez || isNatacao) && (
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
                                Estatísticas disponíveis para: {[...MODALIDADES_GOLS, ...MODALIDADES_REDE, 'Beach Tennis', 'Tamboréu', 'Tênis de Mesa'].join(', ')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Layout Caratê ─────────────────────────────────────── */}
                            {isKarate && stats.karateStats && (() => {
                                const ks = stats.karateStats;
                                const maxIppons = Math.max(...ks.topIppons.map(t => t.ippons), 1);
                                const maxSenshu = Math.max(...ks.topSenshu.map(t => t.senshu), 1);
                                const cardS: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' };
                                const hdrS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' };
                                const titleS: React.CSSProperties = { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' };
                                const scrollS: React.CSSProperties = { maxHeight: '320px', overflowY: 'auto' };
                                return (
                                    <>
                                        {/* Grid 3 colunas */}
                                        <section style={{ marginBottom: '30px' }}>
                                            <h2 style={sectionTitleStyle}>🥋 Caratê — Performance Individual & por Curso</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

                                                {/* Card 0 — Vitórias e Aproveitamento */}
                                                <div style={cardS}>
                                                    <div style={hdrS}>
                                                        <span style={{ fontSize: '22px' }}>🥋</span>
                                                        <div>
                                                            <h2 style={titleS}>Vitórias e Aproveitamento</h2>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ranking de vitórias</p>
                                                        </div>
                                                    </div>
                                                    <div style={scrollS}>
                                                        {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                            <div key={`kw-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(team.course, team.faculty)}</div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card 1 — Maiores Pontuadores */}
                                                <div style={cardS}>
                                                    <div style={hdrS}>
                                                        <BarChart2 size={22} color="#fbbf24" />
                                                        <div>
                                                            <h2 style={titleS}>🥋 Maiores Pontuadores</h2>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Yuko +1 · Waza-ari +2 · Ippon +3</p>
                                                        </div>
                                                    </div>
                                                    <div style={scrollS}>
                                                        {ks.topScorers.length === 0 ? <EmptyState /> : ks.topScorers.map((s, idx) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {s.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                        <span style={{ color: '#6b7280' }}>Y:{s.yuko}</span>
                                                                        {' · '}
                                                                        <span style={{ color: '#f59e0b' }}>W:{s.wazaAri}</span>
                                                                        {' · '}
                                                                        <span style={{ color: '#ef4444' }}>I:{s.ippon}</span>
                                                                        {' · '}{formatTeamLabel(s.course, s.faculty)}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: '18px', fontWeight: 900, color: idx === 0 ? '#ffd700' : 'var(--accent-color)' }}>{s.total} pts</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card 2 — Domínio Técnico (Ippons) */}
                                                <div style={cardS}>
                                                    <div style={hdrS}>
                                                        <Sword size={22} color="#ef4444" />
                                                        <div>
                                                            <h2 style={titleS}>Domínio Técnico</h2>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ippons aplicados por curso</p>
                                                        </div>
                                                    </div>
                                                    <div style={scrollS}>
                                                        {ks.topIppons.length === 0 ? <EmptyState /> : ks.topIppons.map((t, idx) => (
                                                            <div key={idx} style={{ marginBottom: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(t.course, t.faculty)}</span>
                                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{t.ippons}</span>
                                                                </div>
                                                                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                                                    <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #ef4444, #b91c1c)', width: `${(t.ippons / maxIppons) * 100}%`, transition: 'width 0.4s' }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card 3 — Vantagem Senshu */}
                                                <div style={cardS}>
                                                    <div style={hdrS}>
                                                        <Target size={22} color="#f59e0b" />
                                                        <div>
                                                            <h2 style={titleS}>Vantagem Senshu</h2>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Primeiro ponto da luta por curso</p>
                                                        </div>
                                                    </div>
                                                    <div style={scrollS}>
                                                        {ks.topSenshu.length === 0 ? <EmptyState /> : ks.topSenshu.map((t, idx) => (
                                                            <div key={idx} style={{ marginBottom: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(t.course, t.faculty)}</span>
                                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>{t.senshu}</span>
                                                                </div>
                                                                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                                                    <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${(t.senshu / maxSenshu) * 100}%`, transition: 'width 0.4s' }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        </section>
                                    </>
                                );
                            })()}

                            {/* ── Layout Judô ───────────────────────────────────────── */}
                            {isJudo && stats.judoStats && (() => {
                                const js = stats.judoStats;
                                const maxTech = Math.max(...js.topTech.map(t => t.score), 1);
                                const maxShidos = Math.max(...js.topDiscipline.map(t => t.shidos), 1);
                                const cardS: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' };
                                const hdrS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' };
                                const titleS: React.CSSProperties = { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' };
                                const scrollS: React.CSSProperties = { maxHeight: '320px', overflowY: 'auto' };
                                return (
                                    <section style={{ marginBottom: '30px' }}>
                                        <h2 style={sectionTitleStyle}>🥋 Judô — Performance Individual & por Curso</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

                                            {/* Card 0 — Vitórias e Aproveitamento */}
                                            <div style={cardS}>
                                                <div style={hdrS}>
                                                    <span style={{ fontSize: '22px' }}>🥋</span>
                                                    <div>
                                                        <h2 style={titleS}>Vitórias e Aproveitamento</h2>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ranking de vitórias</p>
                                                    </div>
                                                </div>
                                                <div style={scrollS}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`jw-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(team.course, team.faculty)}</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Card 1 — Maiores Finalizadores */}
                                            <div style={cardS}>
                                                <div style={hdrS}>
                                                    <BarChart2 size={22} color="#fbbf24" />
                                                    <div>
                                                        <h2 style={titleS}>🏆 Maiores Finalizadores</h2>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Vitórias por Ippon / Waza-ari</p>
                                                    </div>
                                                </div>
                                                <div style={scrollS}>
                                                    {js.topFinishers.length === 0 ? <EmptyState /> : js.topFinishers.map((s, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}>
                                                            <div>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {s.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                    <span style={{ color: '#ef4444' }}>Ippon: {s.ippons}</span>
                                                                    {' · '}
                                                                    <span style={{ color: '#f59e0b' }}>Waza-ari: {s.wazaAri}</span>
                                                                    {' · '}{formatTeamLabel(s.course, s.faculty)}
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: '18px', fontWeight: 900, color: idx === 0 ? '#ffd700' : 'var(--accent-color)' }}>{s.ippons}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Card 2 — Eficácia Técnica */}
                                            <div style={cardS}>
                                                <div style={hdrS}>
                                                    <Sword size={22} color="#f59e0b" />
                                                    <div>
                                                        <h2 style={titleS}>⚡ Eficácia Técnica</h2>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ippon=10pts · Waza-ari=1pt</p>
                                                    </div>
                                                </div>
                                                <div style={scrollS}>
                                                    {js.topTech.length === 0 ? <EmptyState /> : js.topTech.map((t, idx) => (
                                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(t.course, t.faculty)}</span>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                                    <span style={{ color: '#ef4444', fontWeight: 700 }}>{t.ippons}I</span>
                                                                    {' '}
                                                                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{t.wazaAris}W</span>
                                                                    {' = '}
                                                                    <span style={{ color: 'white', fontWeight: 800 }}>{t.score}</span>
                                                                </span>
                                                            </div>
                                                            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                                                <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${(t.score / maxTech) * 100}%`, transition: 'width 0.4s' }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Card 3 — Índice de Disciplina */}
                                            <div style={cardS}>
                                                <div style={hdrS}>
                                                    <Shield size={22} color="#22c55e" />
                                                    <div>
                                                        <h2 style={titleS}>🎽 Índice de Disciplina</h2>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Menos Shidos = mais disciplinado</p>
                                                    </div>
                                                </div>
                                                <div style={scrollS}>
                                                    {js.topDiscipline.length === 0 ? <EmptyState /> : js.topDiscipline.map((t, idx) => (
                                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(t.course, t.faculty)}</span>
                                                                <span style={{ fontSize: '13px', fontWeight: 800, color: t.shidos === 0 ? '#22c55e' : '#ef4444' }}>{t.shidos} shido{t.shidos !== 1 ? 's' : ''}</span>
                                                            </div>
                                                            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                                                <div style={{ height: '100%', borderRadius: '3px', background: t.shidos === 0 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #ef4444, #b91c1c)', width: `${maxShidos > 0 ? (t.shidos / maxShidos) * 100 : 0}%`, transition: 'width 0.4s' }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </section>
                                );
                            })()}

                            {/* ── Layout Xadrez ─────────────────────────────────────── */}
                            {isXadrez && (
                                <section style={{ marginBottom: '30px' }}>
                                    <h2 style={sectionTitleStyle}>♟️ Xadrez — Estatísticas de Equipes</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                <span style={{ fontSize: '22px' }}>♟️</span>
                                                <div>
                                                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Vitórias e Aproveitamento</h2>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ranking de vitórias</p>
                                                </div>
                                            </div>
                                            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                                {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                    <div key={`xw-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(team.course, team.faculty)}</div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── Layout Natação ────────────────────────────────────── */}
                            {isNatacao && (
                                <section style={{ marginBottom: '30px' }}>
                                    <h2 style={sectionTitleStyle}>🏊 Natação — Estatísticas de Equipes</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                <span style={{ fontSize: '22px' }}>🏊</span>
                                                <div>
                                                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Vitórias e Aproveitamento</h2>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ranking de vitórias</p>
                                                </div>
                                            </div>
                                            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                                {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                    <div key={`nw-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(team.course, team.faculty)}</div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{team.wins} V</div>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                <Timer size={22} color="#fbbf24" />
                                                <div>
                                                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Menores Tempos</h2>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ranking dos atletas com os menores tempos registrados</p>
                                                </div>
                                            </div>
                                            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                                {stats.swimTopTimes.length === 0 ? <EmptyState /> : stats.swimTopTimes.slice(0, 10).map((entry, idx) => (
                                                    <div key={`st-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {entry.athlete}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{entry.course}</div>
                                                            </div>
                                                            <div style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#fbbf24' : '#38bdf8', whiteSpace: 'nowrap' }}>{entry.timeStr}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {!isBeachTennis && !isFutevolei && !isTamboreu && !isTenisDeMesa && !isKarate && !isJudo && !isXadrez && !isNatacao && (
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

                                    {/* Aces e Erros de Saque — Vôlei / Vôlei de Praia */}
                                    {isRedeLayout && !isFutevolei && (
                                        <>
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <span style={{ fontSize: '22px' }}>🏐</span>
                                                    <div>
                                                        <h2 style={cardTitleStyle}>Ranking de Aces</h2>
                                                        <p style={cardSubStyle}>Saques diretos por atleta</p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topAces.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.topAces.map((player, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '12px 16px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(34,197,94,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                                    background: idx === 0 ? '#22c55e' : idx === 1 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)',
                                                                    color: idx < 2 ? '#000' : 'var(--text-secondary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '11px', fontWeight: 800,
                                                                }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>{player.name}</div>
                                                                    <span style={{
                                                                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                                                                        borderRadius: '999px', background: 'rgba(255,255,255,0.08)',
                                                                        color: 'var(--text-secondary)',
                                                                    }}>{`${player.course} | ${player.faculty || '-'}`}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>ACE</span>
                                                                <span style={{ fontWeight: 800, color: idx === 0 ? '#22c55e' : 'white', fontSize: '18px' }}>
                                                                    {player.aces}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <span style={{ fontSize: '22px' }}>❌</span>
                                                    <div>
                                                        <h2 style={cardTitleStyle}>Erros de Saque</h2>
                                                        <p style={cardSubStyle}>Erros de saque por atleta</p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topServeErrors.length === 0 ? (
                                                        <EmptyState />
                                                    ) : stats.topServeErrors.map((player, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '12px 16px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(239,68,68,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                                    background: idx === 0 ? '#ef4444' : idx === 1 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
                                                                    color: idx < 2 ? '#fff' : 'var(--text-secondary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '11px', fontWeight: 800,
                                                                }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>{player.name}</div>
                                                                    <span style={{
                                                                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                                                                        borderRadius: '999px', background: 'rgba(255,255,255,0.08)',
                                                                        color: 'var(--text-secondary)',
                                                                    }}>{`${player.course} | ${player.faculty || '-'}`}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>ERRO</span>
                                                                <span style={{ fontWeight: 800, color: idx === 0 ? '#ef4444' : 'white', fontSize: '18px' }}>
                                                                    {player.errors}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                            )}

                            {!isKarate && !isJudo && !isXadrez && !isNatacao && <section>
                                <h2 style={sectionTitleStyle}>Estatísticas de Equipes</h2>
                                <div style={twoCardsGridStyle}>
                                    {isTamboreu ? (
                                        <>
                                            {/* Informação sobre Tamboréu */}
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                background: 'rgba(167,139,250,0.1)',
                                                border: '1px solid rgba(167,139,250,0.3)',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <span style={{ fontSize: '18px' }}>ℹ️</span>
                                                <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>
                                                    <strong>Regra Oficial do Tamboréu:</strong> Sets fechados em 10 pontos (limite 12 pts). Máximo de 3 sets por partida.
                                                </span>
                                            </div>

                                            {/* Card 1: Ranking de Vitórias */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Trophy size={22} color="#a78bfa" /><div><h2 style={cardTitleStyle}>Ranking de Vitórias</h2><p style={cardSubStyle}>Ranking de vitórias por equipe/dupla</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`tmb-w-${idx}`} style={{
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

                                            {/* Card 2: Domínio de Sets */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Sword size={22} color="#a78bfa" /><div><h2 style={cardTitleStyle}>Domínio de Sets</h2><p style={cardSubStyle}>Saldo de Sets (Vencidos vs Perdidos)</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamStatsList.length === 0 ? <EmptyState /> : stats.teamStatsList.sort((a,b) => (b.scored - b.conceded) - (a.scored - a.conceded)).slice(0, 10).map((team, idx) => {
                                                        const totalSets = team.scored + team.conceded;
                                                        const winPct = totalSets > 0 ? (team.scored / totalSets) * 100 : 0;
                                                        return (
                                                            <div key={`tmb-d-${idx}`} style={{
                                                                padding: '10px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '6px',
                                                                background: idx === 0 ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
                                                                border: idx === 0 ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                        {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa' }}>Saldo: {team.scored - team.conceded > 0 ? `+${team.scored - team.conceded}` : team.scored - team.conceded}</div>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.scored} Vencidos · {team.conceded} Perdidos</div>
                                                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${winPct}%`, background: '#a78bfa', height: '100%', borderRadius: '3px' }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card 3: Consistência de Placar */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Shield size={22} color="#a78bfa" /><div><h2 style={cardTitleStyle}>Consistência de Placar</h2><p style={cardSubStyle}>Média de Pontos Sofridos por Set</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topSetsConsistencyList.length === 0 ? <EmptyState /> : stats.topSetsConsistencyList.slice(0, 10).map((team, idx) => (
                                                        <div key={`tmb-c-${idx}`} style={{
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
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa' }}>{team.avgConceded.toFixed(1)} <span style={{fontSize: '10px'}}>PTS/SET</span></div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.pointsConceded} sofridos em {team.setsPlayed} sets</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : isTenisDeMesa ? (
                                        <>
                                            {/* Informação sobre Tênis de Mesa */}
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                background: 'rgba(251,191,36,0.1)',
                                                border: '1px solid rgba(251,191,36,0.3)',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <span style={{ fontSize: '18px' }}>ℹ️</span>
                                                <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>
                                                    <strong>Regra Oficial do Tênis de Mesa:</strong> Partidas de 11 pontos em melhor de 5 sets.
                                                </span>
                                            </div>

                                            {/* Card 1: Vitórias e Aproveitamento */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <span style={{ fontSize: '22px' }}>🏓</span>
                                                    <div><h2 style={cardTitleStyle}>Vitórias e Aproveitamento</h2><p style={cardSubStyle}>Ranking de vitórias por equipe/dupla</p></div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`tm-w-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Card 2: Domínio de Sets */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Sword size={22} color="#22c55e" /><div><h2 style={cardTitleStyle}>Domínio de Sets</h2><p style={cardSubStyle}>Saldo de Sets (Vencidos vs Perdidos)</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamStatsList.length === 0 ? <EmptyState /> : stats.teamStatsList.sort((a,b) => (b.scored - b.conceded) - (a.scored - a.conceded)).slice(0, 10).map((team, idx) => {
                                                        const totalSets = team.scored + team.conceded;
                                                        const winPct = totalSets > 0 ? (team.scored / totalSets) * 100 : 0;
                                                        return (
                                                            <div key={`tm-d-${idx}`} style={{
                                                                padding: '10px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '6px',
                                                                background: idx === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                                border: idx === 0 ? '1px solid rgba(34,197,94,0.35)' : '1px solid transparent',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                        {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>Saldo: {team.scored - team.conceded > 0 ? `+${team.scored - team.conceded}` : team.scored - team.conceded}</div>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.scored} Vencidos · {team.conceded} Perdidos</div>
                                                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${winPct}%`, background: '#22c55e', height: '100%', borderRadius: '3px' }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card 3: Consistência de Placar */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Shield size={22} color="#3b82f6" /><div><h2 style={cardTitleStyle}>Consistência de Placar</h2><p style={cardSubStyle}>Média de Pontos Sofridos por Set</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topSetsConsistencyList.length === 0 ? <EmptyState /> : stats.topSetsConsistencyList.slice(0, 10).map((team, idx) => {
                                                        const concededPct = Math.min((team.avgConceded / 11) * 100, 100);
                                                        return (
                                                        <div key={`tm-c-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>{team.avgConceded.toFixed(1)} <span style={{fontSize: '10px'}}>PTS/SET</span></div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.pointsConceded} sofridos em {team.setsPlayed} sets</div>
                                                            <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${concededPct}%`, background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : isBeachTennis ? (
                                        <>
                                            {/* Informação sobre Beach Tennis */}
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                background: 'rgba(251,191,36,0.1)',
                                                border: '1px solid rgba(251,191,36,0.3)',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <span style={{ fontSize: '18px' }}>ℹ️</span>
                                                <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>
                                                    <strong>Fase Inicial:</strong> Set de 6 games | <strong>Finais:</strong> Set de 8 games
                                                </span>
                                            </div>

                                            {/* Card 1: Vitórias e Aproveitamento */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <span style={{ fontSize: '22px' }}>🎾</span>
                                                    <div><h2 style={cardTitleStyle}>Vitórias e Aproveitamento</h2><p style={cardSubStyle}>Ranking de vitórias por dupla/atleta</p></div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`bt-w-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Card 2: Saldo de Games */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Sword size={22} color="#22c55e" /><div><h2 style={cardTitleStyle}>Domínio de Games</h2><p style={cardSubStyle}>Saldo de Games (Vencidos vs Perdidos)</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamStatsList.length === 0 ? <EmptyState /> : stats.teamStatsList.sort((a,b) => (b.scored - b.conceded) - (a.scored - a.conceded)).slice(0, 10).map((team, idx) => {
                                                        const avgScored = team.games > 0 ? team.scored / team.games : 0;
                                                        // Max possible games to score can be around 9, so a 9-game match dominates the bar
                                                        const winPct = Math.min((avgScored / 9) * 100, 100);
                                                        return (
                                                            <div key={`bt-d-${idx}`} style={{
                                                                padding: '10px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '6px',
                                                                background: idx === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                                border: idx === 0 ? '1px solid rgba(34,197,94,0.35)' : '1px solid transparent',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                        {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>Saldo: {team.scored - team.conceded > 0 ? `+${team.scored - team.conceded}` : team.scored - team.conceded}</div>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.scored} Vencidos · {team.conceded} Perdidos</div>
                                                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${winPct}%`, background: '#22c55e', height: '100%', borderRadius: '3px' }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card 3: Média de Games Sofridos */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Shield size={22} color="#3b82f6" /><div><h2 style={cardTitleStyle}>Consistência de Placar</h2><p style={cardSubStyle}>Média de Games Sofridos</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.teamStatsList.length === 0 ? <EmptyState /> : stats.teamStatsList.slice()
                                                        .map(team => ({ ...team, avg: team.games > 0 ? team.conceded / team.games : 0 }))
                                                        .sort((a,b) => a.avg - b.avg)
                                                        .slice(0, 10).map((team, idx) => {
                                                        const concededPct = Math.min((team.avg / 9) * 100, 100);
                                                        return (
                                                        <div key={`bt-c-${idx}`} style={{
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            marginBottom: '6px',
                                                            background: idx === 0 ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                                                            border: idx === 0 ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                    {idx + 1}. {`${team.name.split(' - ')[0]} | ${team.faculty || team.name.split(' - ')[1] || '-'}`}
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>{team.avg.toFixed(1)} <span style={{fontSize: '10px'}}>GAMES</span></div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.conceded} sofridos em {team.games} partidas</div>
                                                            <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${concededPct}%`, background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : isHandebol ? (
                                        <>
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}><Trophy size={22} color="#fbbf24" /><div><h2 style={cardTitleStyle}>🤾 Vitórias e Aproveitamento</h2><p style={cardSubStyle}>Ranking de vitórias</p></div></div>
                                                <div style={cardListScrollStyle}>
                                                    {stats.topWins.length === 0 ? <EmptyState /> : stats.topWins.slice(0, 10).map((team, idx) => (
                                                        <div key={`hw-${idx}`} style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', background: idx === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{idx + 1}. {formatTeamLabel(team.course, team.faculty)}</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{team.wins} V</div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.winRate.toFixed(0)}% de aproveitamento</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

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
                                            {/* Coluna 2 — Melhor Ataque (oculto para vôlei) */}
                                            {!isRedeLayout && (
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <Sword size={22} color="#22c55e" />
                                                    <div>
                                                        <h2 style={cardTitleStyle}>
                                                            {isBasquete ? 'Melhor Ataque por Jogo' : 'Melhor Ataque por Jogo'}
                                                        </h2>
                                                        <p style={cardSubStyle}>
                                                            {isBasquete ? 'Maior média de pontos por jogo' : 'Maior média de gols por jogo'}
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
                                                                    const unit = isBasquete ? 'pts/j' : 'g/j';
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
                                            )}

                                            {/* Coluna 3 — Defesa */}
                                            <div style={cardStyle}>
                                                <div style={cardHeaderStyle}>
                                                    <Shield size={22} color="#3b82f6" />
                                                    <div>
                                                        <h2 style={cardTitleStyle}>
                                                            {isBasquete ? 'Defesa por Jogo' : isRedeLayout ? 'Defesa por Jogo (Pontos)' : 'Defesa por Jogo'}
                                                        </h2>
                                                        <p style={cardSubStyle}>
                                                            {isBasquete ? 'Menor média de pontos sofridos por jogo' : isRedeLayout ? 'Menor média de pontos sofridos por jogo' : 'Menor média de gols sofridos por jogo'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={cardListScrollStyle}>
                                                    {(isRedeLayout ? stats.volleyDefenseList : stats.bestDefense).length === 0 ? (
                                                        <EmptyState />
                                                    ) : isRedeLayout ? stats.volleyDefenseList.slice(0, 10).map((team, idx) => {
                                                        const avgConceded = team.avgConceded;
                                                        const maxBar = Math.max(...stats.volleyDefenseList.map((t: { avgConceded: number }) => t.avgConceded), 1);
                                                        return (
                                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                    <div><div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{formatTeamLabel(team.course, team.faculty)}</div></div>
                                                                </div>
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{avgConceded.toFixed(1)} pts/j</span>
                                                            </div>
                                                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', borderRadius: '999px', background: '#2563eb', width: `${Math.round((avgConceded / maxBar) * 100)}%`, transition: 'width 0.6s ease' }} />
                                                            </div>
                                                        </div>
                                                        );
                                                    }) : stats.bestDefense.slice(0, 10).map((team, idx) => {
                                                        const games = stats.gamesPlayed[team.name] || 1;
                                                        const avgConceded = team.conceded / games;
                                                        const displayValue = isBasquete ? `${avgConceded.toFixed(1)} pts/j` : `${avgConceded.toFixed(1)} g/j`;
                                                        return (
                                                        <div key={idx} style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>{idx + 1}</span>
                                                                    <div><div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{formatTeamLabel(team.course, team.faculty)}</div></div>
                                                                </div>
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{displayValue}</span>
                                                            </div>
                                                            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', borderRadius: '999px', background: '#2563eb', width: `${Math.round((avgConceded / maxDefense) * 100)}%`, transition: 'width 0.6s ease' }} />
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

                                            {!isRedeLayout && (
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
                                            )}
                                            {isRedeLayout && !isFutevolei && (
                                            <>
                                                <div style={cardStyle}>
                                                    <div style={cardHeaderStyle}>
                                                        <span style={{ fontSize: '22px' }}>🏐</span>
                                                        <div>
                                                            <h2 style={cardTitleStyle}>Aces por Equipe</h2>
                                                            <p style={cardSubStyle}>Equipes com mais aces no saque</p>
                                                        </div>
                                                    </div>
                                                    <div style={cardListScrollStyle}>
                                                        {stats.teamTopAces.length === 0 ? <EmptyState /> : stats.teamTopAces.slice(0, 10).map((team, idx) => (
                                                            <div key={`ta-${idx}`} style={{
                                                                padding: '10px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '6px',
                                                                background: idx === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                                                border: idx === 0 ? '1px solid rgba(34,197,94,0.35)' : '1px solid transparent',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                        {idx + 1}. {formatTeamLabel(team.course, team.faculty)}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>{team.aces} ACE</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div style={cardStyle}>
                                                    <div style={cardHeaderStyle}>
                                                        <span style={{ fontSize: '22px' }}>❌</span>
                                                        <div>
                                                            <h2 style={cardTitleStyle}>Erros de Saque por Equipe</h2>
                                                            <p style={cardSubStyle}>Equipes com mais erros de saque</p>
                                                        </div>
                                                    </div>
                                                    <div style={cardListScrollStyle}>
                                                        {stats.teamTopServeErrors.length === 0 ? <EmptyState /> : stats.teamTopServeErrors.slice(0, 10).map((team, idx) => (
                                                            <div key={`tse-${idx}`} style={{
                                                                padding: '10px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '6px',
                                                                background: idx === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                                                                border: idx === 0 ? '1px solid rgba(239,68,68,0.35)' : '1px solid transparent',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                                                        {idx + 1}. {formatTeamLabel(team.course, team.faculty)}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{team.errors} ERRO</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>}
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
