import { useState, useEffect, type FC } from 'react';
import { Play, Pause, StopCircle, Clock, Plus, Filter, PlusCircle, Trophy } from 'lucide-react';
import { useData } from '../context/DataContext';
import { type Match, type MatchEvent, AVAILABLE_SPORTS, COURSE_EMBLEMS } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

interface MatchTimelineProps {
    matchId?: string;
}


const MatchTimeline: FC<MatchTimelineProps> = ({ matchId }) => {
    const { matches, updateMatch, athletes, addMatch, courses: coursesList } = useData();
    const navigate = useNavigate();
    
    // Helper to get team emblem with strict matching
    const getTeamEmblem = (teamName: string) => {
        // Only exact match - no fuzzy matching to avoid wrong emblems
        if (teamName in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[teamName]}`;
        }
        // If exact match fails, return null (safer than fuzzy match)
        console.warn(`Emblema não encontrado para curso: ${teamName}`);
        return null;
    };

    const [activeMatchId, setActiveMatchId] = useState<string | null>(matchId || null);
    const [currentMinute, setCurrentMinute] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [showPlayerInput, setShowPlayerInput] = useState<{ type: 'goal' | 'yellow_card' | 'red_card' | 'penalty_scored', team: 'A' | 'B' } | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
    const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);

    // Filters
    const [filterSport, setFilterSport] = useState<string>('Todos');
    const [filterLocation, setFilterLocation] = useState<string>('Todos');
    const [filterCategory, setFilterCategory] = useState<string>('Todos');

    // New Match Form
    const [newMatchForm, setNewMatchForm] = useState({
        teamA: '', 
        teamB: '', 
        swimmingTeams: Array(10).fill(''),
        sport: '', 
        category: 'Masculino' as 'Masculino' | 'Feminino', 
        date: new Date().toISOString().split('T')[0], 
        time: '', 
        location: ''
    });

    // Estado para armazenar emblemas previsualizados
    const [emblemA, setEmblemA] = useState<string | null>(null);
    const [emblemB, setEmblemB] = useState<string | null>(null);

    // Locations oficiais
    const OFFICIAL_LOCATIONS = [
        'Centro de Treinamento',
        'Poliesportivo Unisanta (Bloco M)',
        'Laerte Goncalves (Bloco D)',
        'Arena Unisanta',
        'Bloco A',
        'Piscina Olimpica',
        'Rebouças'
    ];

    // Filter matches: Only scheduled or live
    const filteredMatches = matches.filter((m: Match) => {
        const matchesStatus = m.status !== 'finished';
        const matchesSport = filterSport === 'Todos' || m.sport === filterSport;
        const matchesLocation = filterLocation === 'Todos' || m.location === filterLocation;
        const matchesCategory = filterCategory === 'Todos' || m.category === filterCategory;

        return matchesStatus && matchesSport && matchesLocation && matchesCategory;
    });

    const selectedMatch = matches.find(m => m.id === activeMatchId) || null;
    const isBeachTennis = selectedMatch?.sport === 'Beach Tennis';
    const isHandebol = selectedMatch?.sport === 'Handebol';
    const isVolleyball = selectedMatch?.sport === 'Vôlei' || selectedMatch?.sport === 'Vôlei de Praia' || selectedMatch?.sport === 'Futevôlei';
    const isFutebolX1 = selectedMatch?.sport === 'Futebol X1';
    const isFutsal = selectedMatch?.sport === 'Futsal';
    const isFutebolSociety = selectedMatch?.sport === 'Futebol Society';
    const isBasketball = selectedMatch?.sport === 'Basquetebol' || selectedMatch?.sport === 'Basquete 3x3';
    const isTableTennis = selectedMatch?.sport === 'Tênis de Mesa';
    const isSetSport = isVolleyball || isTableTennis;
    const isBasketball3x3 = selectedMatch?.sport === 'Basquete 3x3';
    const isSwimming = selectedMatch?.sport === 'Natação';
    const isNoTimerSport = ['Vôlei', 'Vôlei de Praia', 'Tênis de Mesa', 'Futevôlei', 'Beach Tennis'].includes(selectedMatch?.sport || '');

    type TimelineEvent = MatchEvent & { timelineScore: string; timelineQuarter?: string };

    const [swimmingRankings, setSwimmingRankings] = useState<Record<string, number>>({});
    const [athleteNames, setAthleteNames] = useState<Record<string, string>>({});
    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

    const getBasketballQuarterDurationSeconds = (match: Match | null) => {
        if (!match) return 15 * 60;
        return match.category === 'Feminino' ? 10 * 60 : 15 * 60;
    };

    const getCurrentEventMinute = () => currentMinute;
    const BEACH_POINT_LABELS = ['0', '15', '30', '40'];
    const TIMER_TICK_MS = 1000;
    const TIMER_INCREMENT_SECONDS = 1;
    const X1_TIMER_INCREMENT = 1;
    const BASKETBALL_DECREMENT_SECONDS = 1;
    const formatClock = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const getEventTimestamp = (eventId: string) => {
        const raw = eventId.split('_')[1] || eventId;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const normalizeSex = (value?: string) => (value || '').trim().toLowerCase();
    const normalizeSport = (value?: string) => (value || '').trim().toLowerCase();

    const toSportList = (sports: unknown): string[] => {
        if (Array.isArray(sports)) {
            return sports.map((sport) => String(sport).trim()).filter(Boolean);
        }

        if (typeof sports === 'string') {
            return sports
                .split(',')
                .map((sport) => sport.trim())
                .filter(Boolean);
        }

        return [];
    };

    const athleteHasSport = (athlete: typeof athletes[number], sport: string) => {
        const targetSport = normalizeSport(sport);
        return toSportList((athlete as { sports?: unknown }).sports)
            .some((athleteSport) => normalizeSport(athleteSport) === targetSport);
    };

    const athleteMatchesTeamAndMatch = (athlete: typeof athletes[number], team: Match['teamA']) => {
        if (!selectedMatch) return false;

        const athleteCourse = athlete.course.toLowerCase();
        const athleteInst = athlete.institution.toLowerCase();
        const teamCourse = (team.course || '').toLowerCase();
        const teamFaculty = (team.faculty || '').toLowerCase();

        // Especial para FEFESP / Educação Física
        const isFefespMatch = (teamCourse.includes('fefesp') || teamCourse.includes('educação física')) &&
            (athleteCourse.includes('fefesp') || athleteCourse.includes('educação física') || athleteInst.includes('fefesp'));

        // Match normal por curso e faculdade
        const courseMatch = athleteCourse.includes(teamCourse) || teamCourse.includes(athleteCourse);
        const facultyMatch = athleteInst.includes(teamFaculty) || teamFaculty.includes(athleteInst);

        const sameTeam = isFefespMatch || (courseMatch && facultyMatch);
        const sameSport = athleteHasSport(athlete, selectedMatch.sport);
        const sameSex = normalizeSex(athlete.sex) === normalizeSex(selectedMatch.category);

        return sameTeam && sameSport && sameSex;
    };

    const getBeachScoreState = (match: Match | null) => {
        const initialState = {
            gamePointsA: 0,
            gamePointsB: 0
        };

        if (!match) return initialState;

        return [...(match.events || [])]
            .sort((a, b) => (a.minute - b.minute) || (getEventTimestamp(a.id) - getEventTimestamp(b.id)))
            .reduce((state, event) => {
                if (event.type === 'set_win') {
                    return {
                        ...state,
                        gamePointsA: 0,
                        gamePointsB: 0
                    };
                }

                if (event.type !== 'goal') {
                    return state;
                }

                return {
                    ...state,
                    gamePointsA: event.teamId === match.teamA.id ? state.gamePointsA + 1 : state.gamePointsA,
                    gamePointsB: event.teamId === match.teamB.id ? state.gamePointsB + 1 : state.gamePointsB
                };
            }, initialState);
    };

    const beachScoreState = getBeachScoreState(selectedMatch);
    const beachSetsState = (selectedMatch?.events || []).reduce((acc, event) => {
        if (event.type !== 'set_win') return acc;
        if (!event.description?.startsWith('Set para ')) return acc;

        if (event.teamId === selectedMatch?.teamA.id) acc.setsA += 1;
        if (event.teamId === selectedMatch?.teamB.id) acc.setsB += 1;
        return acc;
    }, { setsA: 0, setsB: 0 });

    useEffect(() => {
        let interval: number | null = null;
        if (isRunning && !isNoTimerSport) {
            interval = window.setInterval(() => {
                setCurrentMinute(prev => {
                    if (isBasketball) {
                        if (prev <= 0) {
                            setIsRunning(false);
                            return 0;
                        }
                        return Math.max(0, prev - BASKETBALL_DECREMENT_SECONDS);
                    }

                    if (isFutebolX1) {
                        return prev + X1_TIMER_INCREMENT;
                    }

                    return prev + TIMER_INCREMENT_SECONDS;
                });
            }, TIMER_TICK_MS);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isBasketball, isFutebolX1, isNoTimerSport]);



    const handleSelectMatch = (match: Match) => {
        setActiveMatchId(match.id);
        if (['Vôlei', 'Vôlei de Praia', 'Tênis de Mesa', 'Futevôlei'].includes(match.sport)) {
            setCurrentMinute(0);
            setIsRunning(false);
            return;
        }

        if (match.sport === 'Basquetebol' || match.sport === 'Basquete 3x3') {
            const sortedEvents = [...(match.events || [])].sort(compareTimelineEventsAsc);
            const lastEvent = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1] : null;
            const quarterDurationSeconds = getBasketballQuarterDurationSeconds(match);
            setCurrentMinute(lastEvent ? (lastEvent.minute || quarterDurationSeconds) : quarterDurationSeconds);
        } else {
            const lastMinute = (match.events || []).reduce((max, event) => Math.max(max, event.minute || 0), 0);
            setCurrentMinute(lastMinute * 60);
        }
        setIsRunning(match.status === 'live');
    };

    const addEvent = async (type: MatchEvent['type'], teamId?: string, player?: string) => {
        if (!selectedMatch) return;

        const existingEvents = selectedMatch.events || [];

        // Lógica de Cartão Amarelo -> segundo amarelo gera expulsão automática
        if (type === 'yellow_card' && player) {
            const currentYellowCards = existingEvents.filter(e => e.player === player && e.type === 'yellow_card').length;
            if (currentYellowCards >= 1) {
                const eventBaseTs = Date.now();
                const yellowEvent: MatchEvent = {
                    id: `evt_${eventBaseTs}_yellow`,
                    type: 'yellow_card',
                    minute: getCurrentEventMinute(),
                    teamId,
                    player
                };
                const redEvent: MatchEvent = {
                    id: `evt_${eventBaseTs + 1}_red`,
                    type: 'red_card',
                    minute: getCurrentEventMinute(),
                    teamId,
                    player,
                    description: 'Cartão Vermelho (2º Amarelo)'
                };

                const updatedEventsWithRed = [...existingEvents, yellowEvent, redEvent];

                // Para X1, o segundo amarelo também encerra a partida
                let finalStatus = 'live';
                if (isFutebolX1) {
                    finalStatus = 'finished';
                    const opponentTeam = teamId === selectedMatch.teamA.id ? selectedMatch.teamB.name : selectedMatch.teamA.name;
                    const endEvent: MatchEvent = {
                        id: `evt_${eventBaseTs + 2}_end`,
                        type: 'end',
                        minute: getCurrentEventMinute(),
                        description: `🟥 Fim de jogo! Atleta expulso. Vitória automática para ${opponentTeam}`
                    };
                    updatedEventsWithRed.push(endEvent);
                }

                const finalMatch: Match = {
                    ...selectedMatch,
                    events: updatedEventsWithRed,
                    status: finalStatus as Match['status']
                };

                await updateMatch(finalMatch);
                if (finalStatus === 'finished') setIsRunning(false);
                return;
            }
        }

        let customDescription = undefined;
        if (selectedMatch.sport === 'Futebol Society') {
            const teamName = teamId === selectedMatch.teamA.id ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0];
            if (type === 'goal') customDescription = player ? `⚽ GOL! ${player}` : `⚽ GOL para ${teamName}`;
            if (type === 'yellow_card') customDescription = player ? `Cartão Amarelo - ${player}` : `Cartão para ${teamName}`;
            if (type === 'red_card') customDescription = player ? `Cartão Vermelho - ${player}` : `Cartão para ${teamName}`;
            if (type === 'penalty_scored') customDescription = player ? `Pênalti convertido! ${player}` : 'Pênalti convertido!';
        }

        if (selectedMatch.sport === 'Futsal') {
            const teamName = teamId === selectedMatch.teamA.id ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0];
            if (type === 'goal') customDescription = player ? `⚽ GOL! ${player}` : `⚽ GOL para ${teamName}`;
            if (type === 'yellow_card') customDescription = player ? `Cartão Amarelo - ${player}` : `Cartão Amarelo - ${teamName}`;
            if (type === 'red_card') customDescription = player ? `Cartão Vermelho - ${player}` : `Cartão Vermelho - ${teamName}`;
            if (type === 'penalty_scored') customDescription = player ? `Pênalti convertido! ${player}` : `Pênalti convertido!`;
        }

        const newEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type,
            minute: getCurrentEventMinute(),
            teamId,
            player,
            description: customDescription
        };

        const updatedEvents = [...existingEvents, newEvent];

        // Atualizar pontuação se for gol ou pênalti marcado
        let newScoreA = selectedMatch.scoreA;
        let newScoreB = selectedMatch.scoreB;
        let newStatus = type === 'end' ? 'finished' : 'live';

        if (type === 'goal' || type === 'penalty_scored' || type === 'shootout_scored') {
            if (teamId === selectedMatch.teamA.id) {
                newScoreA += 1;
            } else if (teamId === selectedMatch.teamB.id) {
                newScoreB += 1;
            }
        }

        // Regra de Cartão Vermelho no X1 = Fim de Jogo
        if (type === 'red_card' && isFutebolX1) {
            newStatus = 'finished';
            const opponentTeam = teamId === selectedMatch.teamA.id ? selectedMatch.teamB.name : selectedMatch.teamA.name;
            const endEvent: MatchEvent = {
                id: `evt_${Date.now()}_end`,
                type: 'end',
                minute: getCurrentEventMinute(),
                description: `🟥 Fim de jogo! Atleta expulso. Vitória automática para ${opponentTeam}`
            };
            updatedEvents.push(endEvent);
        }

        const updatedMatch: Match = {
            ...selectedMatch,
            events: updatedEvents,
            scoreA: newScoreA,
            scoreB: newScoreB,
            status: newStatus as Match['status']
        };

        await updateMatch(updatedMatch);
        if (newStatus === 'finished') setIsRunning(false);
    };

    const pushMatchEvent = (newEvent: Omit<MatchEvent, 'id'>) => {
        if (!selectedMatch) return;
        const updatedEvents = [...(selectedMatch.events || []), { ...newEvent, id: `evt_${Date.now()}` }];
        const updatedMatch: Match = {
            ...selectedMatch,
            events: updatedEvents,
        };
        updateMatch(updatedMatch);
        return updatedMatch;
    };

    const handleBeachGameWin = (team: 'A' | 'B', pointEvent?: MatchEvent) => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: getCurrentEventMinute() });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        const gameWinnerName = team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name;
        const nextGamesA = team === 'A' ? selectedMatch.scoreA + 1 : selectedMatch.scoreA;
        const nextGamesB = team === 'B' ? selectedMatch.scoreB + 1 : selectedMatch.scoreB;
        const gameWinEvent: MatchEvent = {
            id: `evt_${Date.now()}_setwin`,
            type: 'set_win',
            minute: getCurrentEventMinute(),
            teamId,
            description: `Game para ${gameWinnerName}`
        };
        const baseEvents = [
            ...(selectedMatch.events || []),
            ...(pointEvent ? [pointEvent] : []),
            gameWinEvent
        ];

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: nextGamesA,
            scoreB: nextGamesB,
            status: 'live',
            events: baseEvents
        };

        updateMatch(updatedMatch);
    };

    const handleBeachSetWin = (team: 'A' | 'B') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: getCurrentEventMinute() });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        const setWinnerName = team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name;
        const setWinEvent: MatchEvent = {
            id: `evt_${Date.now()}_set`,
            type: 'set_win',
            minute: getCurrentEventMinute(),
            teamId,
            description: `Set para ${setWinnerName}`
        };

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: 0,
            scoreB: 0,
            status: 'live',
            events: [...(selectedMatch.events || []), setWinEvent]
        };

        updateMatch(updatedMatch);
    };

    const handleBeachPoint = (team: 'A' | 'B') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        // Add start event automatically if not started yet
        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: getCurrentEventMinute() });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        const pointWinnerName = team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name;
        const pointEvent: MatchEvent = {
            id: `evt_${Date.now()}_goal`,
            type: 'goal',
            minute: getCurrentEventMinute(),
            teamId,
            description: `Ponto para ${pointWinnerName}`
        };

        const updatedMatch: Match = {
            ...selectedMatch,
            events: [...(selectedMatch.events || []), pointEvent],
            status: 'live'
        };

        updateMatch(updatedMatch);
    };

    const handleSetWin = (team: 'A' | 'B') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        const teamName = team === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0];

        // Derive current set points from events for the description
        const lastSetWinEvent = [...(selectedMatch.events || [])].reverse().find(e => e.type === 'set_win');
        const relevantEvents = lastSetWinEvent 
            ? selectedMatch.events?.slice(selectedMatch.events.indexOf(lastSetWinEvent) + 1) || [] 
            : selectedMatch.events || [];
        
        const ptsA = relevantEvents.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamA.id).length;
        const ptsB = relevantEvents.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamB.id).length;

        // Preserve the current set points exactly as recorded by goal events.
        const finalPtsA = ptsA;
        const finalPtsB = ptsB;

        const setWinEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type: 'set_win',
            minute: getCurrentEventMinute(),
            teamId,
            description: `Set ganho por ${teamName} (${finalPtsA} x ${finalPtsB})`,
            score: `${team === 'A' ? selectedMatch.scoreA + 1 : selectedMatch.scoreA}x${team === 'B' ? selectedMatch.scoreB + 1 : selectedMatch.scoreB}`
        };

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: team === 'A' ? selectedMatch.scoreA + 1 : selectedMatch.scoreA,
            scoreB: team === 'B' ? selectedMatch.scoreB + 1 : selectedMatch.scoreB,
            events: [...(selectedMatch.events || []), setWinEvent],
            status: 'live'
        };

        updateMatch(updatedMatch);
    };

    const handleVolleyPoint = (team: 'A' | 'B') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: getCurrentEventMinute() });
            if (started) {
                selectedMatch.events = started.events;
            }
            if (!isNoTimerSport) setIsRunning(true);
        }

        const scoringTeam = team;

        const scoringTeamId = scoringTeam === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;

        const currentA = selectedMatch.scoreA;
        const currentB = selectedMatch.scoreB;
        const nextA = scoringTeam === 'A' ? currentA + 1 : currentA;
        const nextB = scoringTeam === 'B' ? currentB + 1 : currentB;

           const description = `Ponto para ${scoringTeam === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;

        // Calculate current set points for the snapshot
        const lastSetWinEvent = [...(selectedMatch.events || [])].reverse().find(e => e.type === 'set_win');
        const relevantEvents = lastSetWinEvent 
            ? selectedMatch.events?.slice(selectedMatch.events.indexOf(lastSetWinEvent) + 1) || [] 
            : selectedMatch.events || [];
        
        const ptsA = relevantEvents.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamA.id).length;
        const ptsB = relevantEvents.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamB.id).length;
        
        const nextPtsA = scoringTeam === 'A' ? ptsA + 1 : ptsA;
        const nextPtsB = scoringTeam === 'B' ? ptsB + 1 : ptsB;

        const updatedMatch: Match = {
            ...selectedMatch,
            status: 'live',
            events: [...(selectedMatch.events || []), { 
                id: `evt_${Date.now()}`, 
                type: 'goal', 
                minute: getCurrentEventMinute(), 
                teamId: scoringTeamId, 
                description: description,
                score: `${selectedMatch.scoreA}x${selectedMatch.scoreB} (${nextPtsA}-${nextPtsB})`
            } as MatchEvent]
        };

        // For Vôlei and Tênis de Mesa, we don't auto-finish based on points anymore
        // Only for Beach Tennis or if it's not a set sport (though this function is only for volley/table tennis)
        if (selectedMatch.sport === 'Vôlei de Praia') {
            const targetScore = 21;
            if ((nextA >= targetScore || nextB >= targetScore) && Math.abs(nextA - nextB) >= 2) {
                updatedMatch.status = 'finished';
                updatedMatch.events = [
                    ...(updatedMatch.events || []), 
                    { id: `evt_${Date.now()+1}`, type: 'set_win', minute: getCurrentEventMinute(), teamId: scoringTeamId, description: `Fim de Jogo para ${scoringTeam === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}` } as MatchEvent,
                    { id: `evt_${Date.now()+2}`, type: 'end', minute: getCurrentEventMinute(), description: `Fim de Jogo - Placar Final: ${nextA} x ${nextB}` } as MatchEvent
                ];
                updateMatch(updatedMatch);
                setIsRunning(false);
                return;
            }
        }

        updateMatch(updatedMatch);
    };

    const handleStartMatch = () => {
        if (!selectedMatch) return;

        if (isBasketball && currentMinute <= 0) {
            setCurrentMinute(getBasketballQuarterDurationSeconds(selectedMatch));
        }

        const hasStarted = selectedMatch.events?.some(e => e.type === 'start');
        if (!hasStarted) {
            addEvent('start');
        } else if (selectedMatch.status !== 'live') {
            updateMatch({ ...selectedMatch, status: 'live' });
        }
        setIsRunning(!isNoTimerSport);
    };

    const handleHalfTime = () => {
        addEvent('halftime');
        setIsRunning(false);
    };

    const handleBasketballQuarterBreak = () => {
        if (!selectedMatch || !isBasketball) return;
        addEvent('halftime');
        setIsRunning(false);
        setCurrentMinute(getBasketballQuarterDurationSeconds(selectedMatch));
    };

    const handleBasketballTimeout = (team: 'A' | 'B') => {
        if (!selectedMatch || !isBasketball) return;

        const teamName = team === 'A'
            ? selectedMatch.teamA.name.split(' - ')[0]
            : selectedMatch.teamB.name.split(' - ')[0];

        const timeoutEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type: 'halftime',
            minute: getCurrentEventMinute(),
            teamId: team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id,
            description: `Tempo técnico - ${teamName}`
        };

        updateMatch({
            ...selectedMatch,
            events: [...(selectedMatch.events || []), timeoutEvent]
        });

        setIsRunning(false);
    };

    const handleEndMatch = () => {
        if (!selectedMatch) return;

        const finalScoreLabel = isBeachTennis
            ? `${beachSetsState.setsA} x ${beachSetsState.setsB} (sets)`
            : `${selectedMatch.scoreA} x ${selectedMatch.scoreB}`;

        // Criar o evento final com o placar
        const finalEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type: 'end',
            minute: getCurrentEventMinute(),
            description: `Fim de Jogo - Placar Final: ${finalScoreLabel}`
        };

        // Atualizar a partida com status 'finished' e adicionar o evento
        const finishedMatch: Match = {
            ...selectedMatch,
            status: 'finished',
            events: [...(selectedMatch.events || []), finalEvent]
        };

        // Persistir a mudança no banco de dados
        updateMatch(finishedMatch);
        setIsRunning(false);

        // Deselecionar a partida e forçar navegação para os resultados
        setActiveMatchId(null);
        navigate('/');
    };

    const handleBasketballPoint = (team: 'A' | 'B', points: 1 | 2 | 3) => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        if (isBasketball3x3) {
            if (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21) {
                return; // sudden death already reached
            }
        }

        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: getCurrentEventMinute() });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        const scoringTeamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        const currentA = selectedMatch.scoreA;
        const currentB = selectedMatch.scoreB;
        const nextA = team === 'A' ? currentA + points : currentA;
        const nextB = team === 'B' ? currentB + points : currentB;
        const currentQuarter = (selectedMatch.events || []).filter(e => e.type === 'halftime').length + 1;

        const description = `[Q${currentQuarter}] [${nextA} x ${nextB}] +${points} Ponto${points > 1 ? 's' : ''} para ${team === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: nextA,
            scoreB: nextB,
            status: 'live',
            events: [...(selectedMatch.events || []), { 
                id: `evt_${Date.now()}`, 
                type: 'goal', 
                minute: getCurrentEventMinute(), 
                teamId: scoringTeamId, 
                description: description
            } as MatchEvent]
        };

        updateMatch(updatedMatch);
    };

    const handleGoal = (team: 'A' | 'B') => {
        if (isBeachTennis) {
            handleBeachPoint(team);
            return;
        }
        
        if (isFutebolX1 && selectedMatch) {
            const teamObj = team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
            const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, teamObj));
            if (availableAthletes.length > 0) {
                const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
                const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
                addEvent('goal', teamId, playerName);
                return;
            }
        }

        setShowPlayerInput({ type: 'goal', team });
    };

    const handleCard = (type: 'yellow_card' | 'red_card', team: 'A' | 'B') => {
        if (isFutebolX1 && selectedMatch) {
            const teamObj = team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
            const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, teamObj));
            if (availableAthletes.length > 0) {
                const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
                const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
                addEvent(type, teamId, playerName);
                return;
            }
        }
        setShowPlayerInput({ type, team });
    };

    const handlePenalty = (type: 'penalty_scored' | 'penalty_missed', team: 'A' | 'B') => {
        if (type === 'penalty_scored') {
            if (isFutebolX1 && selectedMatch) {
                const teamObj = team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
                const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, teamObj));
                if (availableAthletes.length > 0) {
                    const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
                    const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
                    addEvent(type, teamId, playerName);
                    return;
                }
            }
            setShowPlayerInput({ type, team });
        } else {
            // Pênalti perdido não precisa de seleção de jogador
            const teamId = team === 'A' ? selectedMatch?.teamA.id : selectedMatch?.teamB.id;
            addEvent(type, teamId, 'Pênalti perdido');
        }
    };

    const handleShootout = (type: 'shootout_scored' | 'shootout_missed', team: 'A' | 'B') => {
        if (!selectedMatch) return;
        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        
        if (isFutebolX1) {
            const teamObj = team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
            const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, teamObj));
            if (availableAthletes.length > 0) {
                const playerName = `${availableAthletes[0].firstName} ${availableAthletes[0].lastName}`;
                addEvent(type, teamId, playerName);
                return;
            }
        }
        
        // Em teoria Shootout é só pro X1 agora, mas mantemos o fallback
        addEvent(type, teamId);
    };

    const confirmPlayerEvent = (playerName: string) => {
        if (!showPlayerInput || !selectedMatch || !playerName.trim()) return;

        const teamId = showPlayerInput.team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;
        addEvent(showPlayerInput.type, teamId, playerName.trim());

        setShowPlayerInput(null);
    };

    const cancelPlayerInput = () => {
        setShowPlayerInput(null);
    };

    // Obter estatísticas de um jogador
    const getPlayerStats = (playerName: string) => {
        if (!selectedMatch?.events) return { goals: 0, yellowCards: 0, redCards: 0, canPlay: true };

        const playerEvents = selectedMatch.events.filter(e => e.player === playerName);
        const goals = playerEvents.filter(e => e.type === 'goal' || e.type === 'penalty_scored').length;
        const yellowCards = playerEvents.filter(e => e.type === 'yellow_card').length;
        const redCards = playerEvents.filter(e => e.type === 'red_card').length;
        const canPlay = redCards === 0;

        return { goals, yellowCards, redCards, canPlay };
    };

    const handleResetMatch = () => {
        if (!selectedMatch) return;

        const resetMatch: Match = {
            ...selectedMatch,
            scoreA: 0,
            scoreB: 0,
            events: [],
            status: 'scheduled'
        };

        updateMatch(resetMatch);
        setCurrentMinute(isBasketball ? getBasketballQuarterDurationSeconds(selectedMatch) : 0);
        setIsRunning(false);
        setShowResetConfirm(false);
    };

    const getEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal': 
                if (isBasketball) return '🏀';
                if (isVolleyball) return '🏐';
                return '⚽';
            case 'yellow_card': return '🟨';
            case 'red_card': return '🟥';
            case 'start': return '▶️';
            case 'end': return '🏁';
            case 'halftime': return '⏸️';
            case 'penalty_scored': return '⚽';
            case 'penalty_missed': return '❌';
            case 'shootout_scored': return '⚽';
            case 'shootout_missed': return '❌';
            case 'set_win': return isBeachTennis ? '🎾☀️' : '•';
            case 'tie_break_start': return '🎾';
            default: return '•';
        }
    };

    const getBasketballEventData = (event: TimelineEvent) => {
        const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 1);
        const totalSeconds = Math.max(0, event.minute);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const teamName = !selectedMatch
            ? 'Faculdade'
            : event.teamId === selectedMatch.teamA.id
                ? selectedMatch.teamA.name.split(' - ')[0]
                : event.teamId === selectedMatch.teamB.id
                    ? selectedMatch.teamB.name.split(' - ')[0]
                    : 'Faculdade';

        return {
            tempo: `${minutes}:${String(seconds).padStart(2, '0')}`,
            pontuacaoLabel: `+${pointValue} ${pointValue > 1 ? 'pontos' : 'ponto'} para ${teamName}`,
            placar: (event.timelineScore || '0x0').replace('x', '-')
        };
    };

    const stripPlayerNameFromLabel = (label: string, event: MatchEvent) => {
        if (!event.player) return label;
        if (isHandebol && event.type === 'goal') return label;
        if (isFutebolX1) return label;
        if (isFutsal) return label;
        if (isFutebolSociety) return label;

        return label
            .replace(` - ${event.player}`, '')
            .replace(`(${event.player})`, '')
            .replace(new RegExp(`\\s${event.player}$`), '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    };

    const keepScoreTogether = (label: string) =>
        label.replace(/(\d+)\s*x\s*(\d+)/g, '$1\u00A0x\u00A0$2');

    const getEventLabel = (event: MatchEvent) => {
        const teamName = !selectedMatch ? '' : event.teamId === selectedMatch.teamA.id
            ? selectedMatch.teamA.name
            : event.teamId === selectedMatch.teamB.id
                ? selectedMatch.teamB.name
                : '';

        let label = '';
        switch (event.type) {
            case 'goal':
                if (isBasketball) {
                    label = event.description || '';
                    break;
                }
                if (isHandebol) {
                    const teamShortName = teamName.split(' - ')[0] || teamName;
                    label = event.player
                        ? `GOL! ${teamShortName} - ${event.player}`
                        : `GOL! ${teamShortName}`;
                    break;
                }
                if (isVolleyball) {
                    label = event.description || `Ponto - ${teamName}`;
                    break;
                }
                if (isFutebolSociety && event.player) {
                    label = `GOL! ${event.player}`;
                    break;
                }
                if (isFutsal && event.player) {
                    label = `GOL! ${event.player}`;
                    break;
                }
                if (event.description) {
                    label = event.description;
                    break;
                }
                if (isFutebolX1) {
                    const currentScore = (event as TimelineEvent).timelineScore || '0x0';
                    const athleteInfo = event.player ? `${event.player} (${teamName})` : teamName;
                    label = `⚽ GOL! Placar no momento: ${currentScore} - ${athleteInfo}`;
                    break;
                }
                label = `${isHandebol ? 'GOL!' : 'GOL!'} ${teamName}`;
                break;
            case 'yellow_card':
                if (event.description) {
                    label = event.description;
                    break;
                }
                if (isFutebolSociety && event.player) {
                    label = `Cartão Amarelo - ${event.player} (${teamName})`;
                    break;
                }
                if (isFutsal && event.player) {
                    label = `Cartão Amarelo - ${event.player} (${teamName})`;
                    break;
                }
                if (isFutebolX1 && event.player) {
                    label = `Cartão Amarelo - ${event.player} (${teamName})`;
                    break;
                }
                label = `Cartão Amarelo - ${teamName}`;
                break;
            case 'red_card':
                if (event.description) {
                    label = event.description;
                    break;
                }
                if (isFutebolSociety && event.player) {
                    label = `Cartão Vermelho - ${event.player} (${teamName})`;
                    break;
                }
                if (isFutsal && event.player) {
                    label = `Cartão Vermelho - ${event.player} (${teamName})`;
                    break;
                }
                if (isFutebolX1 && event.player) {
                    label = `Cartão Vermelho - ${event.player} (${teamName})`;
                    break;
                }
                label = `Cartão Vermelho - ${teamName}`;
                break;
            case 'penalty_scored':
                label = `${isHandebol ? 'TIRO DE 7 METROS' : 'Gol de Pênalti'} - ${teamName}`;
                break;
            case 'penalty_missed':
                label = `${isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Perdido - ${teamName}`;
                break;
            case 'shootout_scored':
                if (isFutebolX1) {
                    const currentScore = (event as TimelineEvent).timelineScore || '0x0';
                    const athleteInfo = event.player ? `${event.player} (${teamName})` : teamName;
                    label = `⚽ GOL de Shoot-out! Placar no momento: ${currentScore} - ${athleteInfo}`;
                    break;
                }
                label = `GOL de Shoot-out - ${teamName}`;
                break;
            case 'shootout_missed':
                label = `❌ Shoot-out Perdido - ${teamName}`;
                break;
            case 'set_win':
                if (isBeachTennis) {
                    label = event.description || `Game para ${teamName}`;
                    break;
                }
                label = `Ponto para ${teamName}`;
                break;
            case 'tie_break_start':
                label = 'Início de Tie-break';
                break;
            case 'start':
                label = 'Início da partida';
                break;
            case 'halftime':
                label = event.description || 'Intervalo';
                break;
            case 'end':
                label = 'Fim de jogo';
                break;
            default:
                label = event.description || event.type;
                break;
        }

        return keepScoreTogether(stripPlayerNameFromLabel(label, event));
    };

    const compareTimelineEventsAsc = (a: MatchEvent, b: MatchEvent) => {
        const timestampA = getEventTimestamp(a.id);
        const timestampB = getEventTimestamp(b.id);

        if (timestampA !== 0 || timestampB !== 0) {
            const timestampDiff = timestampA - timestampB;
            if (timestampDiff !== 0) return timestampDiff;
        }

        const minuteDiff = a.minute - b.minute;
        if (minuteDiff !== 0) return minuteDiff;

        const isDoubleYellowPair =
            a.player &&
            b.player &&
            a.player === b.player &&
            a.teamId === b.teamId &&
            ((a.type === 'yellow_card' && b.type === 'red_card') || (a.type === 'red_card' && b.type === 'yellow_card'));

        if (isDoubleYellowPair) {
            return a.type === 'yellow_card' ? -1 : 1;
        }

        return getEventTimestamp(a.id) - getEventTimestamp(b.id);
    };

    const getTimelineScoreLabel = (events: MatchEvent[]) => {
        if (!selectedMatch) return [] as TimelineEvent[];

        let regularScoreA = 0;
        let regularScoreB = 0;
        let setScoreA = 0;
        let setScoreB = 0;
        let setPointsA = 0;
        let setPointsB = 0;
        let beachSetsA = 0;
        let beachSetsB = 0;
        let beachGamesA = 0;
        let beachGamesB = 0;
        let beachPointsA = 0;
        let beachPointsB = 0;
        let basketballQuarter = 1;

        return [...events]
            .sort(compareTimelineEventsAsc)
            .map((event) => {
            const timelineQuarter = isBasketball ? `Q${basketballQuarter}` : undefined;
                if (isBeachTennis) {
                    if (event.type === 'goal') {
                        if (event.teamId === selectedMatch.teamA.id) beachPointsA += 1;
                        if (event.teamId === selectedMatch.teamB.id) beachPointsB += 1;
                    }

                    if (event.type === 'set_win' && event.description?.startsWith('Game para ')) {
                        if (event.teamId === selectedMatch.teamA.id) beachGamesA += 1;
                        if (event.teamId === selectedMatch.teamB.id) beachGamesB += 1;
                        beachPointsA = 0;
                        beachPointsB = 0;
                    }

                    if (event.type === 'set_win' && event.description?.startsWith('Set para ')) {
                        if (event.teamId === selectedMatch.teamA.id) beachSetsA += 1;
                        if (event.teamId === selectedMatch.teamB.id) beachSetsB += 1;
                        beachGamesA = 0;
                        beachGamesB = 0;
                        beachPointsA = 0;
                        beachPointsB = 0;
                    }

                    return {
                        ...event,
                        timelineScore: `Game ${beachGamesA}x${beachGamesB} | Pontos ${BEACH_POINT_LABELS[Math.min(beachPointsA, 3)]}-${BEACH_POINT_LABELS[Math.min(beachPointsB, 3)]}`,
                        timelineQuarter
                    };
                }

                if (isSetSport) {
                    if (event.type === 'goal') {
                        if (event.teamId === selectedMatch.teamA.id) setPointsA += 1;
                        if (event.teamId === selectedMatch.teamB.id) setPointsB += 1;
                    }

                    if (event.type === 'set_win') {
                        if (event.teamId === selectedMatch.teamA.id) setScoreA += 1;
                        if (event.teamId === selectedMatch.teamB.id) setScoreB += 1;
                        setPointsA = 0;
                        setPointsB = 0;
                    }

                    return {
                        ...event,
                        timelineScore: `Sets ${setScoreA}x${setScoreB} | Pontos ${setPointsA}-${setPointsB}`,
                        timelineQuarter
                    };
                }

                if (event.type === 'goal' || event.type === 'penalty_scored' || event.type === 'shootout_scored') {
                    const increment = isBasketball
                        ? Number(event.description?.match(/\+(\d+)/)?.[1] || 1)
                        : 1;

                    if (event.teamId === selectedMatch.teamA.id) regularScoreA += increment;
                    if (event.teamId === selectedMatch.teamB.id) regularScoreB += increment;
                }

                const mappedEvent: TimelineEvent = {
                    ...event,
                    timelineScore: `${regularScoreA}x${regularScoreB}`,
                    timelineQuarter
                };

                if (isBasketball && event.type === 'halftime') {
                    basketballQuarter += 1;
                }

                return mappedEvent;
            })
            .reverse()
            .map((event) => {
                if (!isBasketball) return event;

                const descriptionHasQuarter = event.description?.includes('[Q');
                if (event.type !== 'goal' || !event.description || descriptionHasQuarter || !event.timelineQuarter) {
                    return event;
                }

                return {
                    ...event,
                    description: `[${event.timelineQuarter}] ${event.description}`
                };
            });
    };

    const timelineEvents = selectedMatch ? getTimelineScoreLabel(selectedMatch.events || []) : [];

    const handleSaveNewMatch = () => {
        const isSwimming = newMatchForm.sport === 'Natação';
        
        if (isSwimming) {
            const selectedSwimmingTeams = newMatchForm.swimmingTeams.filter(t => t !== '');
            if (selectedSwimmingTeams.length < 2) {
                alert('Selecione pelo menos 2 cursos para a natação!');
                return;
            }
            if (new Set(selectedSwimmingTeams).size !== selectedSwimmingTeams.length) {
                alert('Não é permitido selecionar o mesmo curso mais de uma vez!');
                return;
            }
            if (!newMatchForm.sport || !newMatchForm.time || !newMatchForm.location || !newMatchForm.date) {
                alert('Preencha todos os campos!');
                return;
            }
        } else {
            if (!newMatchForm.teamA || !newMatchForm.teamB || !newMatchForm.sport || !newMatchForm.time || !newMatchForm.location || !newMatchForm.date) {
                alert('Preencha todos os campos!');
                return;
            }
            if (newMatchForm.teamA === newMatchForm.teamB) {
                alert('Uma equipe não pode enfrentar ela mesma!');
                return;
            }
        }

        let newMatch: any;
        
        if (isSwimming) {
            const participants = newMatchForm.swimmingTeams
                .filter(t => t !== '')
                .map((course, idx) => {
                    const [name, faculty] = course.split(' - ');
                    return {
                        id: `t_${Date.now()}_swim_${idx}`,
                        name: name,
                        course: course,
                        faculty: faculty,
                        logo: getTeamEmblem(course)
                    };
                });
            
            newMatch = {
                id: crypto.randomUUID(),
                sport: newMatchForm.sport,
                category: newMatchForm.category,
                status: 'scheduled',
                date: newMatchForm.date,
                time: newMatchForm.time,
                location: newMatchForm.location,
                events: [],
                participants: participants,
                // Dummy teams for compatibility with existing UI that might expect teamA/teamB
                teamA: participants[0],
                teamB: participants[1],
                scoreA: 0,
                scoreB: 0
            };
        } else {
            const [nameA, universityA] = newMatchForm.teamA.split(' - ');
            const [nameB, universityB] = newMatchForm.teamB.split(' - ');

            if (!emblemA || !emblemB) {
                alert('Atenção: Um ou ambos os cursos não possuem emblema configurado. Verifique o banco de dados.');
                return;
            }

            newMatch = {
                id: crypto.randomUUID(),
                teamA: { id: `t_${Date.now()}_A`, name: nameA, course: newMatchForm.teamA, faculty: universityA, logo: emblemA },
                teamB: { id: `t_${Date.now()}_B`, name: nameB, course: newMatchForm.teamB, faculty: universityB, logo: emblemB },
                scoreA: 0,
                scoreB: 0,
                sport: newMatchForm.sport,
                category: newMatchForm.category,
                status: 'scheduled',
                date: newMatchForm.date,
                time: newMatchForm.time,
                location: newMatchForm.location,
                events: []
            };
        }

        addMatch(newMatch);
        setIsNewMatchOpen(false);
        setEmblemA(null);
        setEmblemB(null);
        setNewMatchForm({ 
            teamA: '', 
            teamB: '', 
            swimmingTeams: Array(10).fill(''),
            sport: '', 
            category: 'Masculino', 
            date: new Date().toISOString().split('T')[0], 
            time: '', 
            location: '' 
        });
    };

    if (!selectedMatch) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h1 style={styles.title}>⚽ Controle de Partida</h1>
                        <button
                            onClick={() => {
                                setIsNewMatchOpen(true);
                                // Limpar cache de emblemas ao abrir formulário
                                setEmblemA(null);
                                setEmblemB(null);
                            }}
                            style={{
                                background: 'var(--accent-color)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <PlusCircle size={18} /> Nova Partida
                        </button>
                    </div>
                </div>

                <div style={styles.content}>
                    {/* Filters Bar */}
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        marginBottom: '30px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end'
                    }}>
                        <div style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
                            <Filter size={18} />
                            <span style={{ fontSize: '14px', fontWeight: 800 }}>FILTRAR PARTIDAS</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>MODALIDADE</label>
                            <select
                                value={filterSport}
                                onChange={(e) => setFilterSport(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)' }}
                            >
                                <option value="Todos">Todas as Modalidades</option>
                                {AVAILABLE_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>LOCAL</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)' }}
                            >
                                <option value="Todos">Todos os Locais</option>
                                {OFFICIAL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>GÊNERO</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)' }}
                            >
                                <option value="Todos">Todos</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                    </div>

                    <h2 style={styles.subtitle}>Partidas Agendadas ou Ao Vivo:</h2>
                    <div style={styles.matchList}>
                        {filteredMatches.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <Clock size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                <p>Nenhuma partida encontrada com esses filtros.</p>
                            </div>
                        ) : (
                                    filteredMatches.map((match: Match) => (
                                        <div
                                            key={match.id}
                                            style={{
                                                ...styles.matchItem,
                                                borderLeft: match.status === 'live' ? '4px solid var(--live-color)' : '1px solid var(--border-color)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}
                                            onClick={() => handleSelectMatch(match)}
                                        >
                                            <div style={{ ...styles.matchInfo, justifyContent: 'space-between', width: '100%' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={styles.sportBadge}>{match.sport}</span>
                                                    {match.status === 'live' && <span style={{ ...styles.liveBadge, position: 'static', margin: 0, fontSize: '10px' }}>AO VIVO</span>}
                                                </div>
                                                <span style={styles.categoryBadge}>{match.category}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '10px 0', minHeight: '80px' }}>
                                                {match.sport === 'Natação' ? (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '28px', color: 'var(--accent-color)', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
                                                            🏊 NATAÇÃO
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase' }}>
                                                            Prova com Múltiplas Equipes
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                            {(() => {
                                                                const emblem = getTeamEmblem(match.teamA.course || match.teamA.name);
                                                                return emblem ? (
                                                                    <img src={emblem} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                                ) : (
                                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
                                                                );
                                                            })()}
                                                            <span style={{ fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{match.teamA.name.split(' - ')[0]}</span>
                                                        </div>

                                                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                                            {match.status === 'live' ? (
                                                                <span style={{ color: 'var(--accent-color)', fontSize: '24px' }}>{match.scoreA} x {match.scoreB}</span>
                                                            ) : 'VS'}
                                                        </div>

                                                        <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                                            {(() => {
                                                                const emblem = getTeamEmblem(match.teamB.course || match.teamB.name);
                                                                return emblem ? (
                                                                    <img src={emblem} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                                ) : (
                                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
                                                                );
                                                            })()}
                                                            <span style={{ fontSize: '14px', fontWeight: 700, textAlign: 'left' }}>{match.teamB.name.split(' - ')[0]}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ ...styles.matchDateTime, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                                <span>📍 {match.location}</span>
                                                <span>📅 {match.date} - {match.time}</span>
                                            </div>
                                        </div>
                                    ))
                        )}
                    </div>
                </div>

                {/* Modal Nova Partida */}
                {isNewMatchOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        padding: '8px',
                        overflowY: 'auto'
                    }} className="new-match-overlay">
                        <div style={{ 
                            width: '100%', 
                            maxWidth: '440px', 
                            background: '#111', 
                            borderRadius: '16px', 
                            border: '1px solid #333',
                            padding: '16px',
                            boxSizing: 'border-box',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            margin: 'auto 0',
                            maxHeight: 'calc(100dvh - 16px)',
                            overflowY: 'auto'
                        }} className="new-match-modal custom-scrollbar">
                            <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'white', marginBottom: '16px', lineHeight: 1.15 }}>Nova Partida</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="new-match-form">
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>Modalidade *</label>
                                    <select
                                        value={newMatchForm.sport}
                                        onChange={e => setNewMatchForm({ ...newMatchForm, sport: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                    >
                                        <option value="">Selecione a Modalidade</option>
                                        {AVAILABLE_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {newMatchForm.sport === 'Natação' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888' }}>Cursos Participantes (Até 10) *</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '5px' }} className="custom-scrollbar">
                                            {newMatchForm.swimmingTeams.map((team, idx) => (
                                                <select
                                                    key={idx}
                                                    value={team}
                                                    onChange={e => {
                                                        const newTeams = [...newMatchForm.swimmingTeams];
                                                        newTeams[idx] = e.target.value;
                                                        setNewMatchForm({ ...newMatchForm, swimmingTeams: newTeams });
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '12px' }}
                                                >
                                                    <option value="">Equipe {idx + 1}</option>
                                                    {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>Equipe A *</label>
                                            <select
                                                value={newMatchForm.teamA}
                                                onChange={e => {
                                                    setNewMatchForm({ ...newMatchForm, teamA: e.target.value });
                                                    setEmblemA(e.target.value ? getTeamEmblem(e.target.value) : null);
                                                }}
                                                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                            >
                                                <option value="">Selecione a Equipe A</option>
                                                {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {emblemA && (
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888' }}>
                                                    <img src={emblemA} alt="Emblema A" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                                    <span>Emblema carregado ✓</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#555', margin: '-5px 0' }}>X</div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>Equipe B *</label>
                                            <select
                                                value={newMatchForm.teamB}
                                                onChange={e => {
                                                    setNewMatchForm({ ...newMatchForm, teamB: e.target.value });
                                                    setEmblemB(e.target.value ? getTeamEmblem(e.target.value) : null);
                                                }}
                                                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                            >
                                                <option value="">Selecione a Equipe B</option>
                                                {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {emblemB && (
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888' }}>
                                                    <img src={emblemB} alt="Emblema B" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                                    <span>Emblema carregado ✓</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <select
                                    value={newMatchForm.category}
                                    onChange={e => setNewMatchForm({ ...newMatchForm, category: e.target.value as any })}
                                    style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="new-match-two-cols">
                                    <input
                                        type="date"
                                        value={newMatchForm.date}
                                        onChange={e => setNewMatchForm({ ...newMatchForm, date: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                    />
                                    <input
                                        type="time"
                                        value={newMatchForm.time}
                                        onChange={e => setNewMatchForm({ ...newMatchForm, time: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                    />
                                </div>

                                <select
                                    value={newMatchForm.location}
                                    onChange={e => setNewMatchForm({ ...newMatchForm, location: e.target.value })}
                                    style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                >
                                    <option value="">Selecione o Local</option>
                                    {OFFICIAL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }} className="new-match-actions">
                                    <button
                                        onClick={handleSaveNewMatch}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            borderRadius: '8px',
                                            background: 'var(--accent-color)',
                                            color: 'white',
                                            fontWeight: 800,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px'
                                        }}
                                    >
                                        Salvar Partida
                                    </button>
                                    <button
                                        onClick={() => setIsNewMatchOpen(false)}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            borderRadius: '8px',
                                            background: '#222',
                                            color: 'white',
                                            fontWeight: 800,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={styles.container} className="match-timeline-root">
            <div style={styles.header}>
                <div className="match-timeline-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 style={styles.title}>⚽ Controle de Partida</h1>
                        <button
                            style={styles.changeMatchBtn}
                            onClick={() => setActiveMatchId(null)}
                        >
                            ← Trocar partida
                        </button>
                    </div>
                    <button
                        style={styles.resetBtn}
                        className="reset-btn-hover"
                        onClick={() => setShowResetConfirm(true)}
                    >
                        🔄 Resetar Partida
                    </button>
                </div>
            </div>

            <div style={styles.content}>
                {/* Placar */}
                <div style={styles.scoreboard} className="match-timeline-scoreboard">
                    {isSwimming ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '20px 0' }}>
                           <h2 style={{ ...styles.teamName, fontSize: '48px', color: 'var(--accent-color)', textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                               🏊 Natação
                           </h2>
                           <div style={{ marginTop: '10px', fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {selectedMatch.category} • {selectedMatch.location}
                           </div>
                        </div>
                    ) : (
                        <>
                            <div style={styles.teamLeft}>
                                <h2 style={styles.teamName} className="match-timeline-team-name">{selectedMatch.teamA.name}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={styles.score}>{selectedMatch.scoreA}</div>
                                    {isSetSport && (
                                        <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 700 }}>
                                            {(() => {
                                                const lastSetWinEvent = [...(selectedMatch.events || [])].reverse().find(e => e.type === 'set_win');
                                                const events = lastSetWinEvent 
                                                    ? selectedMatch.events?.slice(selectedMatch.events.indexOf(lastSetWinEvent) + 1) || [] 
                                                    : selectedMatch.events || [];
                                                return events.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamA.id).length;
                                            })()} pts
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isNoTimerSport ? (
                                <div style={styles.timeDisplay} className="match-timeline-time-display">
                                    <Clock size={24} />
                                    <span style={styles.minute}>{formatClock(currentMinute)}</span>
                                    {isRunning && (
                                        <span style={styles.liveBadge} className="pulse-animation">
                                            AO VIVO
                                        </span>
                                    )}
                                    {isBeachTennis && (
                                        <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Pontos: {BEACH_POINT_LABELS[Math.min(beachScoreState.gamePointsA, 3)]} - {BEACH_POINT_LABELS[Math.min(beachScoreState.gamePointsB, 3)]}
                                        </span>
                                    )}
                                    {isBeachTennis && (
                                        <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Sets: {beachSetsState.setsA} - {beachSetsState.setsB}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div style={styles.timeDisplay} className="match-timeline-time-display">
                                    {selectedMatch.status === 'live' && (
                                        <span style={styles.liveBadge} className="pulse-animation">
                                            AO VIVO
                                        </span>
                                    )}
                                    {isBeachTennis ? (
                                        <>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Beach Tennis
                                            </span>
                                            <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                Pontos: {BEACH_POINT_LABELS[Math.min(beachScoreState.gamePointsA, 3)]} - {BEACH_POINT_LABELS[Math.min(beachScoreState.gamePointsB, 3)]}
                                            </span>
                                            <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                Games: {selectedMatch.scoreA} - {selectedMatch.scoreB}
                                            </span>
                                            <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                Sets: {beachSetsState.setsA} - {beachSetsState.setsB}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                            Sem cronômetro
                                        </span>
                                    )}
                                </div>
                            )}

                            <div style={styles.teamRight}>
                                <h2 style={styles.teamName} className="match-timeline-team-name">{selectedMatch.teamB.name}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={styles.score}>{selectedMatch.scoreB}</div>
                                    {isSetSport && (
                                        <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 700 }}>
                                            {(() => {
                                                const lastSetWinEvent = [...(selectedMatch.events || [])].reverse().find(e => e.type === 'set_win');
                                                const events = lastSetWinEvent 
                                                    ? selectedMatch.events?.slice(selectedMatch.events.indexOf(lastSetWinEvent) + 1) || [] 
                                                    : selectedMatch.events || [];
                                                return events.filter(e => e.type === 'goal' && e.teamId === selectedMatch.teamB.id).length;
                                            })()} pts
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Controles do Jogo */}
                <div style={styles.gameControls}>
                    <h3 style={styles.sectionTitle} className="match-timeline-section-title">{isSwimming ? 'Classificação da Prova' : 'Controle da Partida'}</h3>
                    {isSwimming ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                            <button
                                onClick={() => setIsRankingModalOpen(true)}
                                style={{ 
                                    background: 'var(--accent-color)', 
                                    color: 'white', 
                                    padding: '16px 32px', 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    fontWeight: 800, 
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                🏁 Definir Classificação da Prova
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={styles.controlButtons} className="match-timeline-control-grid">
                                <button
                                    style={{ ...styles.controlBtn, ...styles.startBtn }}
                                    onClick={handleStartMatch}
                                    disabled={(isNoTimerSport ? selectedMatch.status === 'live' : isRunning) || selectedMatch.status === 'finished'}
                                >
                                    <Play size={20} />
                                    Iniciar Jogo
                                </button>
                                {!isNoTimerSport && (
                                    <button
                                        style={{ ...styles.controlBtn, ...styles.pauseBtn }}
                                        onClick={isBasketball ? () => setIsRunning(false) : handleHalfTime}
                                        disabled={!isRunning}
                                    >
                                        <Pause size={20} />
                                        {isBasketball ? 'Pausar Tempo' : 'Intervalo'}
                                    </button>
                                )}
                                {!isNoTimerSport && (
                                    <button
                                        style={{ ...styles.controlBtn, ...styles.resumeBtn }}
                                        onClick={handleStartMatch}
                                        disabled={isRunning || !selectedMatch.events?.some(e => e.type === 'start')}
                                    >
                                        <Play size={20} />
                                        Retomar
                                    </button>
                                )}
                                <button
                                    style={{
                                        ...styles.controlBtn,
                                        ...styles.endBtn,
                                        ...(isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21) ? {
                                            boxShadow: '0 0 15px var(--danger-color)',
                                            animation: 'pulse 1.5s infinite'
                                        } : {})
                                    }}
                                    onClick={handleEndMatch}
                                    disabled={selectedMatch.status === 'finished'}
                                >
                                    <StopCircle size={20} />
                                    Fim de Jogo
                                </button>
                            </div>

                            {isBasketball && !isNoTimerSport && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                        Pausas do Basquete
                                    </div>
                                    <div style={{ ...styles.controlButtons, gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))' }}>
                                        <button
                                            style={{ ...styles.eventBtn, background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', color: '#f59e0b' }}
                                            onClick={handleBasketballQuarterBreak}
                                            disabled={!isRunning && currentMinute > 0}
                                        >
                                            Intervalo entre Quartos
                                        </button>
                                        <button
                                            style={{ ...styles.eventBtn, background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', color: '#3b82f6' }}
                                            onClick={() => handleBasketballTimeout('A')}
                                            disabled={!isRunning}
                                        >
                                            Tempo {selectedMatch.teamA.name.split(' - ')[0]}
                                        </button>
                                        <button
                                            style={{ ...styles.eventBtn, background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#ef4444' }}
                                            onClick={() => handleBasketballTimeout('B')}
                                            disabled={!isRunning}
                                        >
                                            Tempo {selectedMatch.teamB.name.split(' - ')[0]}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>

                {isBeachTennis && (
                    <>
                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🎾 Pontuação</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, ...styles.teamABtn }}
                                    onClick={() => handleBeachPoint('A')}
                                >
                                    <Plus size={20} />
                                    Ponto {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                                    onClick={() => handleBeachPoint('B')}
                                >
                                    <Plus size={20} />
                                    Ponto {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>

                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🏆 Games</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, background: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                                    onClick={() => handleBeachGameWin('A')}
                                >
                                    <Trophy size={18} style={{ marginRight: '8px' }} />
                                    Game {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, background: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                                    onClick={() => handleBeachGameWin('B')}
                                >
                                    <Trophy size={18} style={{ marginRight: '8px' }} />
                                    Game {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>

                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🏅 Sets</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                                    onClick={() => handleBeachSetWin('A')}
                                >
                                    <Trophy size={18} style={{ marginRight: '8px' }} />
                                    Set {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                                    onClick={() => handleBeachSetWin('B')}
                                >
                                    <Trophy size={18} style={{ marginRight: '8px' }} />
                                    Set {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {!isBeachTennis && !isBasketball && !isSwimming && (
                    <div style={styles.eventSection}>
                        <h3 style={styles.sectionTitle}>{isSetSport ? (isVolleyball ? '🏐 Pontos' : '🏓 Pontos') : '⚽ Gols'}</h3>
                        <div style={styles.eventButtons} className="match-timeline-event-grid">
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamABtn }}
                                    onClick={() => isSetSport ? handleVolleyPoint('A') : handleGoal('A')}
                            >
                                <Plus size={20} />
                                {isSetSport ? 'Ponto' : 'Gol'} {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                                    onClick={() => isSetSport ? handleVolleyPoint('B') : handleGoal('B')}
                            >
                                <Plus size={20} />
                                {isSetSport ? 'Ponto' : 'Gol'} {selectedMatch.teamB.name.split(' - ')[0]}
                            </button>
                        </div>
                    </div>
                )}

                {isSetSport && (
                    <div style={styles.eventSection}>
                        <h3 style={styles.sectionTitle}>🏆 Sets</h3>
                        <div style={styles.eventButtons} className="match-timeline-event-grid">
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                                onClick={() => handleSetWin('A')}
                            >
                                <Trophy size={18} style={{ marginRight: '8px' }} />
                                Set Ganho {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                                onClick={() => handleSetWin('B')}
                            >
                                <Trophy size={18} style={{ marginRight: '8px' }} />
                                Set Ganho {selectedMatch.teamB.name.split(' - ')[0]}
                            </button>
                        </div>
                    </div>
                )}

                {isBasketball && (
                    <div style={styles.eventSection}>
                        <h3 style={{ ...styles.sectionTitle, color: 'var(--accent-color)' }}>🏀 Pontuação</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMatch.teamA.name.split(' - ')[0]}</div>
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', color: '#3b82f6' }}
                                    onClick={() => handleBasketballPoint('A', 1)}
                                    disabled={isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)}
                                >
                                    +1 Ponto ({isBasketball3x3 ? 'Dentro da linha' : 'Lance Livre'})
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', color: '#3b82f6' }}
                                    onClick={() => handleBasketballPoint('A', 2)}
                                    disabled={isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)}
                                >
                                    +2 Pontos ({isBasketball3x3 ? 'Fora da linha' : 'Quadra'})
                                </button>
                                {!isBasketball3x3 && (
                                    <button
                                        style={{ ...styles.eventBtn, background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', color: '#3b82f6' }}
                                        onClick={() => handleBasketballPoint('A', 3)}
                                    >
                                        +3 Pontos (Fora)
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMatch.teamB.name.split(' - ')[0]}</div>
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => handleBasketballPoint('B', 1)}
                                    disabled={isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)}
                                >
                                    +1 Ponto ({isBasketball3x3 ? 'Dentro da linha' : 'Lance Livre'})
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => handleBasketballPoint('B', 2)}
                                    disabled={isBasketball3x3 && (selectedMatch.scoreA >= 21 || selectedMatch.scoreB >= 21)}
                                >
                                    +2 Pontos ({isBasketball3x3 ? 'Fora da linha' : 'Quadra'})
                                </button>
                                {!isBasketball3x3 && (
                                    <button
                                        style={{ ...styles.eventBtn, background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#ef4444' }}
                                        onClick={() => handleBasketballPoint('B', 3)}
                                    >
                                        +3 Pontos (Fora)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isBeachTennis && !isSetSport && !isBasketball && !isSwimming && (
                    <>
                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🟨 Cartões Amarelos</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, ...styles.yellowBtn }}
                                    onClick={() => handleCard('yellow_card', 'A')}
                                >
                                    🟨 {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, ...styles.yellowBtn }}
                                    onClick={() => handleCard('yellow_card', 'B')}
                                >
                                    🟨 {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>

                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🟥 Cartões Vermelhos</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, ...styles.redBtn }}
                                    onClick={() => handleCard('red_card', 'A')}
                                >
                                    🟥 {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, ...styles.redBtn }}
                                    onClick={() => handleCard('red_card', 'B')}
                                >
                                    🟥 {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>

                        <div style={styles.eventSection}>
                            <h3 style={styles.sectionTitle}>🎯 {isHandebol ? 'TIRO DE 7 METROS' : 'Pênaltis'}</h3>
                            <div style={styles.eventButtons} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                                    onClick={() => handlePenalty('penalty_scored', 'A')}
                                >
                                    🎯 {isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Marcado {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                                    onClick={() => handlePenalty('penalty_scored', 'B')}
                                >
                                    🎯 {isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Marcado {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                            <div style={{ ...styles.eventButtons, marginTop: '12px' }} className="match-timeline-event-grid">
                                <button
                                    style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                                    onClick={() => handlePenalty('penalty_missed', 'A')}
                                >
                                    ❌ {isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Perdido {selectedMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                                    onClick={() => handlePenalty('penalty_missed', 'B')}
                                >
                                    ❌ {isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Perdido {selectedMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                        </div>

                        {isFutebolX1 && (
                            <div style={styles.eventSection}>
                                <h3 style={styles.sectionTitle}>🥅 Shoot-out</h3>
                                <div style={styles.eventButtons} className="match-timeline-event-grid">
                                    <button
                                        style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                                        onClick={() => handleShootout('shootout_scored', 'A')}
                                    >
                                        🎯 Shoot-out Marcado {selectedMatch.teamA.name.split(' - ')[0]}
                                    </button>
                                    <button
                                        style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                                        onClick={() => handleShootout('shootout_scored', 'B')}
                                    >
                                        🎯 Shoot-out Marcado {selectedMatch.teamB.name.split(' - ')[0]}
                                    </button>
                                </div>
                                <div style={{ ...styles.eventButtons, marginTop: '12px' }} className="match-timeline-event-grid">
                                    <button
                                        style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                                        onClick={() => handleShootout('shootout_missed', 'A')}
                                    >
                                        ❌ Shoot-out Perdido {selectedMatch.teamA.name.split(' - ')[0]}
                                    </button>
                                    <button
                                        style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                                        onClick={() => handleShootout('shootout_missed', 'B')}
                                    >
                                        ❌ Shoot-out Perdido {selectedMatch.teamB.name.split(' - ')[0]}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Modal de Confirmação de Reset */}
                {showResetConfirm && (
                    <div style={styles.modal}>
                        <div style={styles.modalContent}>
                            <h3 style={styles.modalTitle}>⚠️ Confirmar Reset</h3>
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Tem certeza que deseja resetar esta partida?
                                <br />
                                Todos os eventos e placar serão apagados.
                            </p>
                            <div style={styles.modalButtons}>
                                <button
                                    style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                                    onClick={handleResetMatch}
                                >
                                    Sim, Resetar
                                </button>
                                <button
                                    style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Seleção de Jogador */}
                {showPlayerInput && selectedMatch && (
                    <div style={styles.modal}>
                        <div style={styles.modalContentLarge}>
                            <h3 style={styles.modalTitle}>
                                {showPlayerInput.type === 'goal' && '⚽ Quem fez o gol?'}
                                {showPlayerInput.type === 'yellow_card' && '🟨 Cartão Amarelo'}
                                {showPlayerInput.type === 'red_card' && '🟥 Cartão Vermelho'}
                                {showPlayerInput.type === 'penalty_scored' && '🎯 Pênalti Marcado'}
                            </h3>
                            <div style={styles.modalSubtitle}>
                                {showPlayerInput.team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name}
                            </div>
                            {(() => {
                                const team = showPlayerInput.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
                                const availableAthletes = athletes.filter((a) => athleteMatchesTeamAndMatch(a, team));

                                return (
                            <div style={styles.playerList} className="player-list">
                                {availableAthletes.map((athlete) => {
                                        const playerName = `${athlete.firstName} ${athlete.lastName}`;
                                        const stats = getPlayerStats(playerName);
                                        return (
                                            <button
                                                key={athlete.id}
                                                className={stats.canPlay ? "player-item-hover" : ""}
                                                style={{
                                                    ...styles.playerItem,
                                                    ...(stats.canPlay ? {} : styles.playerItemDisabled)
                                                }}
                                                onClick={() => stats.canPlay && confirmPlayerEvent(playerName)}
                                                disabled={!stats.canPlay}
                                            >
                                                <span style={styles.playerName}>{playerName}</span>
                                                <div style={styles.playerStats}>
                                                    {stats.goals > 0 && <span style={styles.statBadge}>⚽ {stats.goals}</span>}
                                                    {stats.yellowCards > 0 && <span style={styles.statBadge}>🟨 {stats.yellowCards}</span>}
                                                    {stats.redCards > 0 && <span style={styles.statBadgeRed}>🟥 EXPULSO</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                {availableAthletes.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                        Nenhum atleta encontrado para esta modalidade e sexo nesta equipe.
                                    </div>
                                )}
                            </div>
                                );
                            })()}
                            <button
                                style={{ ...styles.modalBtn, ...styles.cancelBtn, marginTop: '16px' }}
                                onClick={cancelPlayerInput}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal de Classificação de Natação */}
                {isRankingModalOpen && selectedMatch && (
                    <div style={styles.modal}>
                        <div style={{ ...styles.modalContentLarge, maxWidth: '900px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={styles.modalTitle}>🏁 Classificação da Prova</h3>
                            <div style={{ ...styles.modalSubtitle, marginBottom: '20px' }}>
                                Preencha os atletas e suas respectivas posições
                            </div>
                            
                            <div style={{ 
                                overflowY: 'auto', 
                                padding: '10px', 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                                gap: '12px',
                                flex: 1
                            }} className="custom-scrollbar">
                                {selectedMatch.participants?.map((participant: any) => (
                                    <div key={participant.id} style={{ 
                                        background: 'rgba(255,255,255,0.05)', 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={participant.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700 }}>{participant.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{participant.faculty}</div>
                                            </div>
                                            <select 
                                                value={swimmingRankings[participant.id] || ''}
                                                onChange={(e) => {
                                                    const rank = parseInt(e.target.value);
                                                    setSwimmingRankings(prev => ({ ...prev, [participant.id]: rank }));
                                                }}
                                                style={{ 
                                                    background: '#222', 
                                                    color: 'white', 
                                                    border: '1px solid #444', 
                                                    borderRadius: '6px', 
                                                    padding: '5px',
                                                    fontSize: '12px',
                                                    fontWeight: 800
                                                }}
                                            >
                                                <option value="">Posição</option>
                                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                                    <option key={n} value={n}>{n}º Lugar</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input 
                                            placeholder="Nome do Atleta"
                                            value={athleteNames[participant.id] || ''}
                                            onChange={(e) => setAthleteNames(prev => ({ ...prev, [participant.id]: e.target.value }))}
                                            style={{
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid #333',
                                                borderRadius: '6px',
                                                padding: '8px',
                                                color: 'white',
                                                fontSize: '13px',
                                                width: '100%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        const rankedCount = Object.keys(swimmingRankings).length;
                                        const totalParticipants = selectedMatch.participants?.length || 0;
                                        if (rankedCount < totalParticipants) {
                                            if (!confirm(`Apenas ${rankedCount} de ${totalParticipants} participantes foram ranqueados. Deseja finalizar assim mesmo?`)) return;
                                        }
                                        
                                        const eventDescription = Object.entries(swimmingRankings)
                                            .sort((a, b) => (a[1] as number) - (b[1] as number))
                                            .map(([id, rank]) => {
                                                const p = selectedMatch.participants?.find((p: any) => p.id === id);
                                                const athlete = athleteNames[id] ? ` (${athleteNames[id]})` : '';
                                                return `${rank}º: ${p?.name}${athlete}`;
                                            })
                                            .join(' | ');

                                        const newEvent: any = {
                                            id: `evt_${Date.now()}`,
                                            type: 'end',
                                            minute: getCurrentEventMinute(),
                                            description: `Resultado Final: ${eventDescription}`
                                        };

                                        const updatedMatch = {
                                            ...selectedMatch,
                                            status: 'finished' as 'finished',
                                            events: [...(selectedMatch.events || []), newEvent]
                                        } as Match;
                                        
                                        updateMatch(updatedMatch);
                                        setIsRunning(false);
                                        setIsRankingModalOpen(false);
                                        alert('Resultado salvo e prova finalizada!');
                                    }}
                                    style={{ 
                                        flex: 2,
                                        background: 'var(--success-color)', 
                                        color: 'white', 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        fontWeight: 800, 
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    Confirmar e Finalizar
                                </button>
                                <button
                                    onClick={() => setIsRankingModalOpen(false)}
                                    style={{ 
                                        flex: 1,
                                        background: '#333', 
                                        color: 'white', 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        fontWeight: 800, 
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cronologia de Eventos */}
                <div style={styles.timeline}>
                    <h3 style={styles.sectionTitle}>📋 Cronologia</h3>
                    <div style={styles.timelineList} className="timeline-list-beauty">
                        {(!selectedMatch.events || selectedMatch.events.length === 0) ? (
                            <p style={styles.noEvents}>Nenhum evento registrado ainda.</p>
                        ) : (
                            timelineEvents
                                .map((event) => {
                                    const isTeamA = event.teamId === selectedMatch.teamA.id;
                                    const isTeamB = event.teamId === selectedMatch.teamB.id;
                                    const isGeneral = !event.teamId;
                                    const rowJustify = isGeneral ? 'center' : isTeamA ? 'flex-start' : 'flex-end';
                                    const cardWidth = isGeneral ? '46%' : '48%';
                                    const shortTeamName = isTeamA
                                        ? selectedMatch.teamA.name.split(' - ')[0]
                                        : isTeamB
                                            ? selectedMatch.teamB.name.split(' - ')[0]
                                            : 'Jogo';

                                    return (
                                        <div key={event.id} className="timeline-row-beauty" style={{ display: 'flex', justifyContent: rowJustify, marginBottom: '6px' }}>
                                            <div
                                                className={`timeline-item-beauty ${isTeamA ? 'timeline-team-a' : ''} ${isTeamB ? 'timeline-team-b' : ''} ${isGeneral ? 'timeline-neutral' : ''}`}
                                                style={{ ...styles.timelineItem, width: cardWidth }}
                                            >
                                                {isBasketball && event.type === 'goal' ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: '100%', gap: '6px', alignItems: 'center' }}>
                                                        {(() => {
                                                            const data = getBasketballEventData(event);
                                                            return (
                                                                <>
                                                                    {isTeamA ? (
                                                                        <>
                                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{data.tempo}</span>
                                                                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-color)', textAlign: 'center' }}>{data.pontuacaoLabel}</span>
                                                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                                                                                <span>{data.placar}</span>
                                                                                <span style={{ width: '3px', height: '14px', borderRadius: '999px', background: '#3b82f6' }} />
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                                                <span style={{ width: '3px', height: '14px', borderRadius: '999px', background: '#ef4444' }} />
                                                                                <span>{data.placar}</span>
                                                                            </span>
                                                                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-color)', textAlign: 'center' }}>{data.pontuacaoLabel}</span>
                                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{data.tempo}</span>
                                                                        </>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {!isSetSport && !isNoTimerSport && <span style={styles.eventTimePill}>{formatClock(event.minute)}</span>}
                                                        <span style={styles.eventIconBubble}>{getEventIcon(event.type)}</span>
                                                        <div style={{ ...styles.eventContentWrap, textAlign: isTeamB ? 'right' : isGeneral ? 'center' : 'left' }}>
                                                            <span style={styles.eventText}>{getEventLabel(event)}</span>
                                                            {event.timelineScore && !isBasketball && (
                                                                <span style={{ 
                                                                    fontSize: '12px', 
                                                                    color: 'var(--accent-color)', 
                                                                    marginLeft: '8px', 
                                                                    fontWeight: 700,
                                                                    background: 'rgba(227, 6, 19, 0.1)',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px'
                                                                }}>
                                                                    {event.timelineScore}
                                                                </span>
                                                            )}
                                                            {event.teamId && !isBasketball && <span style={styles.eventMetaTag}>{shortTeamName}</span>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                <style>{`
                    .reset-btn-hover:hover {
                        background-color: var(--bg-hover) !important;
                        border-color: var(--accent-color) !important;
                    }
                    
                    .player-item-hover:hover {
                        background-color: var(--bg-hover) !important;
                        border-color: var(--accent-color) !important;
                        transform: translateY(-2px);
                    }
                    
                    /* Custom scrollbar */
                    .player-list::-webkit-scrollbar {
                        width: 8px;
                    }
                    
                    .player-list::-webkit-scrollbar-track {
                        background: var(--bg-main);
                        border-radius: 4px;
                    }
                    
                    .player-list::-webkit-scrollbar-thumb {
                        background: var(--border-color);
                        border-radius: 4px;
                    }
                    
                    .player-list::-webkit-scrollbar-thumb:hover {
                        background: var(--text-secondary);
                    }
                    
                    @keyframes pulse {
                        0%, 100% {
                            opacity: 1;
                        }
                        50% {
                            opacity: 0.5;
                        }
                    }
                    
                    .pulse-animation {
                        animation: pulse 1.5s ease-in-out infinite;
                    }

                    .timeline-list-beauty {
                        position: relative;
                        padding-left: 4px;
                    }

                    .timeline-list-beauty::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 6px;
                        bottom: 6px;
                        width: 2px;
                        background: linear-gradient(180deg, rgba(227, 6, 19, 0.55), rgba(227, 6, 19, 0.1));
                        transform: translateX(-50%);
                    }

                    .timeline-item-beauty {
                        position: relative;
                        margin-left: 0;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }

                    .timeline-item-beauty::before {
                        display: none;
                    }

                    .timeline-team-a {
                        border-left: none !important;
                    }

                    .timeline-team-a::before {
                        display: none;
                    }

                    .timeline-team-b {
                        border-left: none !important;
                    }

                    .timeline-neutral {
                        border-left: none !important;
                    }

                    .timeline-neutral::before {
                        display: none;
                    }

                    .match-timeline-section-title {
                        display: block;
                        color: var(--text-primary);
                        line-height: 1.25;
                        word-break: break-word;
                    }

                    @media (max-height: 860px) {
                        .new-match-modal {
                            max-height: calc(100vh - 10px) !important;
                            padding: 14px !important;
                        }

                        .new-match-form {
                            gap: 12px !important;
                        }

                        .new-match-modal h2 {
                            font-size: 24px !important;
                            margin-bottom: 12px !important;
                        }
                    }

                    @media (max-height: 760px) {
                        .new-match-overlay {
                            padding: 4px !important;
                        }

                        .new-match-modal {
                            max-height: calc(100vh - 8px) !important;
                            border-radius: 12px !important;
                            padding: 12px !important;
                        }

                        .new-match-two-cols {
                            grid-template-columns: 1fr !important;
                        }

                        .new-match-actions {
                            flex-direction: column !important;
                        }

                        .new-match-modal button,
                        .new-match-modal select,
                        .new-match-modal input {
                            padding-top: 10px !important;
                            padding-bottom: 10px !important;
                            font-size: 13px !important;
                        }
                    }

                    @media (max-width: 768px) {
                        .match-timeline-root {
                            padding: 12px !important;
                        }

                        .match-timeline-header-row {
                            flex-direction: column;
                            align-items: stretch !important;
                            gap: 12px;
                        }

                        .match-timeline-scoreboard {
                            padding: 18px 12px !important;
                            gap: 10px;
                        }

                        .match-timeline-team-name {
                            font-size: 1.05rem !important;
                            line-height: 1.3 !important;
                        }

                        .match-timeline-time-display {
                            padding: 0 6px !important;
                        }

                        .match-timeline-control-grid,
                        .match-timeline-event-grid {
                            grid-template-columns: 1fr !important;
                        }

                        .match-timeline-root button {
                            min-height: 44px;
                        }
                    }

                    @media (max-width: 480px) {
                        .match-timeline-section-title {
                            display: block !important;
                            font-size: 1rem !important;
                            margin-bottom: 12px !important;
                        }

                        .match-timeline-scoreboard {
                            display: grid !important;
                            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
                            align-items: center;
                        }

                        .match-timeline-team-name {
                            font-size: 0.95rem !important;
                            word-break: break-word;
                        }

                        .match-timeline-time-display {
                            gap: 4px !important;
                        }

                        .match-timeline-root h1 {
                            font-size: 1.45rem !important;
                        }

                        .match-timeline-root h3 {
                            font-size: 1rem !important;
                        }

                        .match-timeline-root .player-list {
                            max-height: 52dvh;
                        }

                        .timeline-item-beauty {
                            width: 94% !important;
                        }

                        .timeline-list-beauty::before {
                            left: 50%;
                        }
                    }

                    @media (max-width: 390px) {
                        .match-timeline-root {
                            padding: 8px !important;
                        }

                        .match-timeline-scoreboard {
                            padding: 14px 8px !important;
                        }

                        .match-timeline-team-name {
                            font-size: 0.82rem !important;
                        }

                        .match-timeline-time-display {
                            gap: 2px !important;
                        }

                        .match-timeline-root .pulse-animation {
                            font-size: 10px !important;
                            padding: 3px 8px !important;
                        }

                        .match-timeline-root .player-item-hover,
                        .match-timeline-root .player-list button {
                            padding: 10px 10px !important;
                        }

                        .timeline-item-beauty {
                            width: 96% !important;
                        }

                        .timeline-item-beauty::before {
                            left: -16px;
                        }

                        .timeline-list-beauty::before {
                            left: 50%;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '20px',
    },
    header: {
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px',
        marginBottom: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '20px',
        marginBottom: '16px',
        color: 'var(--text-secondary)',
    },
    changeMatchBtn: {
        color: 'var(--accent-color)',
        fontSize: '14px',
        padding: '8px 0',
        marginTop: '8px',
        cursor: 'pointer',
    },
    resetBtn: {
        backgroundColor: 'var(--secondary-color)',
        color: 'var(--text-primary)',
        padding: '10px 20px',
        borderRadius: 'var(--border-radius)',
        fontSize: '14px',
        fontWeight: 600,
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
    matchList: {
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    },
    matchItem: {
        backgroundColor: 'var(--bg-card)',
        padding: '20px',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        border: '1px solid var(--border-color)',
        transition: 'all 0.2s',
    },
    matchInfo: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
    },
    sportBadge: {
        backgroundColor: 'var(--accent-color)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600,
    },
    categoryBadge: {
        backgroundColor: 'var(--secondary-color)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
    },
    matchTeams: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '8px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    vs: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
    },
    matchDateTime: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    noMatches: {
        color: 'var(--text-secondary)',
        textAlign: 'center',
        padding: '40px',
    },
    scoreboard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        padding: '32px',
        borderRadius: 'var(--border-radius)',
        marginBottom: '24px',
        border: '2px solid var(--border-color)',
    },
    team: {
        flex: 1,
        textAlign: 'center',
    },
    teamLeft: {
        flex: 1,
        textAlign: 'left',
    },
    teamRight: {
        flex: 1,
        textAlign: 'right',
    },
    teamName: {
        fontSize: '1.4rem',
        lineHeight: 1.3,
        margin: 0,
    },
    score: {
        fontSize: '64px',
        fontWeight: 700,
        color: 'var(--accent-color)',
        marginTop: '8px',
    },
    timeDisplay: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '0 40px',
    },
    minute: {
        fontSize: '32px',
        fontWeight: 700,
    },
    liveBadge: {
        backgroundColor: 'var(--live-color)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.4px',
        marginTop: '8px',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
    },
    gameControls: {
        backgroundColor: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--border-radius)',
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '16px',
    },
    controlButtons: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
    },
    controlBtn: {
        padding: '12px 20px',
        borderRadius: 'var(--border-radius)',
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        border: '1px solid',
    },
    startBtn: {
        backgroundColor: '#22c55e',
        color: 'white',
        borderColor: '#16a34a',
    },
    pauseBtn: {
        backgroundColor: '#f59e0b',
        color: 'white',
        borderColor: '#d97706',
    },
    resumeBtn: {
        backgroundColor: '#3b82f6',
        color: 'white',
        borderColor: '#2563eb',
    },
    endBtn: {
        backgroundColor: '#ef4444',
        color: 'white',
        borderColor: '#dc2626',
    },
    eventSection: {
        backgroundColor: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--border-radius)',
        marginBottom: '16px',
    },
    eventButtons: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
    },
    eventBtn: {
        padding: '16px',
        borderRadius: 'var(--border-radius)',
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        border: '1px solid',
    },
    teamABtn: {
        backgroundColor: '#1e40af',
        color: 'white',
        borderColor: '#1e3a8a',
    },
    teamBBtn: {
        backgroundColor: '#b91c1c',
        color: 'white',
        borderColor: '#991b1b',
    },
    yellowBtn: {
        backgroundColor: '#ca8a04',
        color: 'white',
        borderColor: '#a16207',
    },
    redBtn: {
        backgroundColor: '#dc2626',
        color: 'white',
        borderColor: '#b91c1c',
    },
    penaltyBtn: {
        backgroundColor: '#7c3aed',
        color: 'white',
        borderColor: '#6d28d9',
    },
    penaltyMissedBtn: {
        backgroundColor: '#475569',
        color: 'white',
        borderColor: '#334155',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'var(--bg-card)',
        padding: '32px',
        borderRadius: 'var(--border-radius)',
        width: 'min(420px, calc(100vw - 24px))',
        border: '1px solid var(--border-color)',
    },
    modalContentLarge: {
        backgroundColor: 'var(--bg-card)',
        padding: '32px',
        borderRadius: 'var(--border-radius)',
        width: 'min(600px, calc(100vw - 24px))',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '12px',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        marginBottom: '20px',
        fontWeight: 600,
    },
    playerList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        maxHeight: '400px',
        marginBottom: '16px',
        paddingRight: '8px',
    },
    playerItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
    },
    playerItemDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        backgroundColor: 'var(--secondary-color)',
    },
    playerName: {
        fontSize: '15px',
        fontWeight: 500,
        flex: 1,
    },
    playerStats: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    statBadge: {
        fontSize: '12px',
        padding: '2px 8px',
        borderRadius: '10px',
        backgroundColor: 'var(--secondary-color)',
        fontWeight: 600,
    },
    statBadgeRed: {
        fontSize: '12px',
        padding: '2px 8px',
        borderRadius: '10px',
        backgroundColor: 'var(--live-color)',
        color: 'white',
        fontWeight: 700,
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
    },
    modalBtn: {
        flex: 1,
        padding: '12px',
        borderRadius: 'var(--border-radius)',
        fontSize: '14px',
        fontWeight: 600,
    },
    confirmBtn: {
        backgroundColor: 'var(--accent-color)',
        color: 'white',
    },
    cancelBtn: {
        backgroundColor: 'var(--secondary-color)',
        color: 'var(--text-primary)',
    },
    timeline: {
        backgroundColor: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--border-radius)',
    },
    timelineList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    timelineItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border-color)',
        justifyContent: 'flex-start',
    },
    eventTimePill: {
        fontWeight: 700,
        color: 'white',
        minWidth: '40px',
        textAlign: 'center',
        fontSize: '12px',
        background: 'var(--accent-color)',
        borderRadius: '999px',
        padding: '4px 8px',
    },
    eventIconBubble: {
        fontSize: '18px',
        width: '32px',
        height: '32px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border-color)',
        flexShrink: 0,
    },
    eventContentWrap: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
    },
    eventText: {
        flex: 1,
        fontSize: '14px',
        lineHeight: 1.35,
    },
    eventMetaTag: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: '999px',
        padding: '4px 8px',
        whiteSpace: 'nowrap',
    },
    noEvents: {
        color: 'var(--text-secondary)',
        textAlign: 'center',
        padding: '20px',
    },
};

export default MatchTimeline;
