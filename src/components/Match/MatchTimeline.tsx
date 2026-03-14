import { useState, useEffect, type FC } from 'react';
import { Play, Pause, StopCircle, Clock, Plus, Filter, PlusCircle } from 'lucide-react';
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
        teamA: '', teamB: '', sport: '', category: 'Masculino' as 'Masculino' | 'Feminino', date: new Date().toISOString().split('T')[0], time: '', location: ''
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
    const isVolleyball = selectedMatch?.sport === 'Vôlei' || selectedMatch?.sport === 'Vôlei de Praia';
    const isBasketball = selectedMatch?.sport === 'Basquetebol' || selectedMatch?.sport === 'Basquete 3x3';
    const isBasketball3x3 = selectedMatch?.sport === 'Basquete 3x3';

    const [isTieBreakMode, setIsTieBreakMode] = useState(false);
    const [beachTieBreakA, setBeachTieBreakA] = useState(0);
    const [beachTieBreakB, setBeachTieBreakB] = useState(0);

    useEffect(() => {
        setIsTieBreakMode(false);
        setBeachTieBreakA(0);
        setBeachTieBreakB(0);
    }, [selectedMatch?.id]);

    useEffect(() => {
        let interval: number | null = null;
        if (isRunning) {
            interval = window.setInterval(() => {
                setCurrentMinute(prev => prev + 1);
            }, 1000); // 1 minuto = 60000ms
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);


    const handleSelectMatch = (match: Match) => {
        setActiveMatchId(match.id);
        setCurrentMinute(0);
        setIsRunning(false);
    };

    const addEvent = (type: MatchEvent['type'], teamId?: string, player?: string) => {
        if (!selectedMatch) return;

        const existingEvents = selectedMatch.events || [];

        // Lógica de Cartão Amarelo -> segundo amarelo gera expulsão automática
        if (type === 'yellow_card' && player) {
            const currentYellowCards = existingEvents.filter(e => e.player === player && e.type === 'yellow_card').length;
            if (currentYellowCards >= 1) {
                // Registrar primeiro o cartão amarelo
                const yellowEvent: MatchEvent = {
                    id: `evt_${Date.now()}_yellow`,
                    type: 'yellow_card',
                    minute: currentMinute,
                    teamId,
                    player
                };
                const redEvent: MatchEvent = {
                    id: `evt_${Date.now()}_red`,
                    type: 'red_card',
                    minute: currentMinute,
                    teamId,
                    player,
                    description: 'Cartão Vermelho (2º Amarelo)'
                };
                const updatedEvents = [...existingEvents, yellowEvent, redEvent];

                const updatedMatch: Match = {
                    ...selectedMatch,
                    events: updatedEvents,
                    status: 'live'
                };
                updateMatch(updatedMatch);
                return;
            }
        }

        const newEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type,
            minute: currentMinute,
            teamId,
            player
        };

        const updatedEvents = [...existingEvents, newEvent];

        // Atualizar pontuação se for gol ou pênalti marcado
        let newScoreA = selectedMatch.scoreA;
        let newScoreB = selectedMatch.scoreB;
        if (type === 'goal' || type === 'penalty_scored') {
            if (teamId === selectedMatch.teamA.id) {
                newScoreA += 1;
            } else if (teamId === selectedMatch.teamB.id) {
                newScoreB += 1;
            }
        }

        const updatedMatch: Match = {
            ...selectedMatch,
            events: updatedEvents,
            scoreA: newScoreA,
            scoreB: newScoreB,
            status: type === 'end' ? 'finished' : 'live'
        };

        updateMatch(updatedMatch);
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

    const handleBeachPoint = (team: 'A' | 'B') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        // Add start event automatically if not started yet
        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: currentMinute });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        const teamId = team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;

        if (!isTieBreakMode) {
            const currentA = selectedMatch.scoreA;
            const currentB = selectedMatch.scoreB;
            const nextA = team === 'A' ? currentA + 1 : currentA;
            const nextB = team === 'B' ? currentB + 1 : currentB;

            // at 6-6 trigger tie-break
            if (nextA === 6 && nextB === 6) {
                const updatedMatch: Match = {
                    ...selectedMatch,
                    scoreA: nextA,
                    scoreB: nextB,
                    status: 'live',
                    events: [...(selectedMatch.events || []), 
                        { id: `evt_${Date.now()}`, type: 'set_win', minute: currentMinute, teamId, description: `Game para ${team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name}` } as MatchEvent, 
                        { id: `evt_${Date.now()+1}`, type: 'tie_break_start', minute: currentMinute, description: 'Início de Tie-break' } as MatchEvent
                    ]
                };
                updateMatch(updatedMatch);
                setIsTieBreakMode(true);
                setBeachTieBreakA(0);
                setBeachTieBreakB(0);
                return;
            }

            // normal game point
            const updatedMatch: Match = {
                ...selectedMatch,
                scoreA: nextA,
                scoreB: nextB,
                status: 'live',
                events: [...(selectedMatch.events || []), { id: `evt_${Date.now()}`, type: 'set_win', minute: currentMinute, teamId, description: `Game para ${team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name}` } as MatchEvent]
            };

            // check winner of set
            if ((nextA === 6 && nextB <= 4) || (nextB === 6 && nextA <= 4)) {
                updatedMatch.status = 'finished';
                updatedMatch.events = [...(updatedMatch.events || []), { id: `evt_${Date.now()+1}`, type: 'end', minute: currentMinute } as MatchEvent];
                updateMatch(updatedMatch);
                setIsRunning(false);
                return;
            }

            updateMatch(updatedMatch);
            return;
        }

        // tie-break mode
        const nextTieA = team === 'A' ? beachTieBreakA + 1 : beachTieBreakA;
        const nextTieB = team === 'B' ? beachTieBreakB + 1 : beachTieBreakB;

        setBeachTieBreakA(nextTieA);
        setBeachTieBreakB(nextTieB);

        const updatedEvents = [...(selectedMatch.events || []), { id: `evt_${Date.now()}`, type: 'set_win', minute: currentMinute, teamId, description: `Ponto tie-break para ${team === 'A' ? selectedMatch.teamA.name : selectedMatch.teamB.name}` } as MatchEvent];

        if (nextTieA >= 7 || nextTieB >= 7) {
            const finalA = team === 'A' ? 7 : 6;
            const finalB = team === 'B' ? 7 : 6;
            const winnerMatch: Match = {
                ...selectedMatch,
                scoreA: finalA,
                scoreB: finalB,
                status: 'finished',
                events: [...updatedEvents, { id: `evt_${Date.now()+1}`, type: 'end', minute: currentMinute } as MatchEvent]
            };
            updateMatch(winnerMatch);
            setIsRunning(false);
            return;
        }

        const updatedMatch: Match = {
            ...selectedMatch,
            events: updatedEvents,
            status: 'live'
        };

        updateMatch(updatedMatch);
    };

    const handleVolleyPoint = (team: 'A' | 'B', actionType: 'Ponto' | 'ACE Marcado' | 'ACE Perdido') => {
        if (!selectedMatch || selectedMatch.status === 'finished') return;

        if (!selectedMatch.events?.some(e => e.type === 'start')) {
            const started = pushMatchEvent({ type: 'start', minute: currentMinute });
            if (started) {
                selectedMatch.events = started.events;
            }
            setIsRunning(true);
        }

        let scoringTeam = team;
        if (actionType === 'ACE Perdido') {
            scoringTeam = team === 'A' ? 'B' : 'A';
        }

        const scoringTeamId = scoringTeam === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id;

        const currentA = selectedMatch.scoreA;
        const currentB = selectedMatch.scoreB;
        const nextA = scoringTeam === 'A' ? currentA + 1 : currentA;
        const nextB = scoringTeam === 'B' ? currentB + 1 : currentB;

        let description: string = actionType;
        if (actionType === 'ACE Perdido') {
             description = `ACE Perdido por ${team === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;
        } else if (actionType === 'ACE Marcado') {
             description = `ACE Marcado por ${team === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;
        } else {
             description = `Ponto para ${scoringTeam === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;
        }

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: nextA,
            scoreB: nextB,
            status: 'live',
            events: [...(selectedMatch.events || []), { 
                id: `evt_${Date.now()}`, 
                type: 'goal', 
                minute: currentMinute, 
                teamId: scoringTeamId, 
                description: description
            } as MatchEvent]
        };

        const targetScore = selectedMatch.sport === 'Vôlei de Praia' ? 21 : 25;
        if ((nextA >= targetScore || nextB >= targetScore) && Math.abs(nextA - nextB) >= 2) {
            updatedMatch.status = 'finished';
            updatedMatch.events = [
                ...(updatedMatch.events || []), 
                { id: `evt_${Date.now()+1}`, type: 'set_win', minute: currentMinute, teamId: scoringTeamId, description: `Fim de Set para ${scoringTeam === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}` } as MatchEvent,
                { id: `evt_${Date.now()+2}`, type: 'end', minute: currentMinute, description: `Fim de Jogo - Placar Final: ${nextA} x ${nextB}` } as MatchEvent
            ];
            updateMatch(updatedMatch);
            setIsRunning(false);
            return;
        }

        updateMatch(updatedMatch);
    };

    const handleStartMatch = () => {
        addEvent('start');
        setIsRunning(true);
    };

    const handleHalfTime = () => {
        addEvent('halftime');
        setIsRunning(false);
    };

    const handleEndMatch = () => {
        if (!selectedMatch) return;

        // Criar o evento final com o placar
        const finalEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type: 'end',
            minute: currentMinute,
            description: `Fim de Jogo - Placar Final: ${selectedMatch.scoreA} x ${selectedMatch.scoreB}`
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
            const started = pushMatchEvent({ type: 'start', minute: currentMinute });
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

        const description = `+${points} Ponto${points > 1 ? 's' : ''} para ${team === 'A' ? selectedMatch.teamA.name.split(' - ')[0] : selectedMatch.teamB.name.split(' - ')[0]}`;

        const updatedMatch: Match = {
            ...selectedMatch,
            scoreA: nextA,
            scoreB: nextB,
            status: 'live',
            events: [...(selectedMatch.events || []), { 
                id: `evt_${Date.now()}`, 
                type: 'goal', 
                minute: currentMinute, 
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
        setShowPlayerInput({ type: 'goal', team });
    };

    const handleCard = (type: 'yellow_card' | 'red_card', team: 'A' | 'B') => {
        setShowPlayerInput({ type, team });
    };

    const handlePenalty = (type: 'penalty_scored' | 'penalty_missed', team: 'A' | 'B') => {
        if (type === 'penalty_scored') {
            setShowPlayerInput({ type, team });
        } else {
            // Pênalti perdido não precisa de seleção de jogador
            const teamId = team === 'A' ? selectedMatch?.teamA.id : selectedMatch?.teamB.id;
            addEvent(type, teamId, 'Pênalti perdido');
        }
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
        setCurrentMinute(0);
        setIsRunning(false);
        setShowResetConfirm(false);
    };

    const getEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal': 
                if (isBasketball) return '🏀';
                return isVolleyball ? '🏐' : '⚽';
            case 'yellow_card': return '🟨';
            case 'red_card': return '🟥';
            case 'start': return '▶️';
            case 'end': return '🏁';
            case 'halftime': return '⏸️';
            case 'penalty_scored': return '🎯';
            case 'penalty_missed': return '❌';
            case 'set_win': return isBeachTennis ? '🎾☀️' : '🏅';
            case 'tie_break_start': return '🎾';
            default: return '•';
        }
    };

    const getEventLabel = (event: MatchEvent) => {
        const teamName = !selectedMatch ? '' : event.teamId === selectedMatch.teamA.id
            ? selectedMatch.teamA.name
            : event.teamId === selectedMatch.teamB.id
                ? selectedMatch.teamB.name
                : '';

        switch (event.type) {
            case 'goal':
                if (isBasketball) {
                    return `[${selectedMatch.scoreA} x ${selectedMatch.scoreB}] 🏀 ${event.description}`;
                }
                if (isVolleyball) {
                    return event.description || `Ponto - ${teamName}`;
                }
                return `${isHandebol ? 'GOL!' : 'GOL!'} ${teamName} ${event.player ? `- ${event.player}` : ''}`;
            case 'yellow_card':
                return `Cartão Amarelo - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'red_card':
                if (event.description) {
                    return `${event.description} - ${teamName} ${event.player ? `(${event.player})` : ''}`;
                }
                return `Cartão Vermelho - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'penalty_scored':
                return `${isHandebol ? 'TIRO DE 7 METROS' : 'Gol de Pênalti'} - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'penalty_missed':
                return `${isHandebol ? 'TIRO DE 7 METROS' : 'Pênalti'} Perdido - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'set_win':
                if (isBeachTennis) {
                    return `Game para ${teamName}`;
                }
                return `Ponto para ${teamName}`;
            case 'tie_break_start':
                return 'Início de Tie-break';
            case 'start':
                return 'Início da partida';
            case 'halftime':
                return 'Intervalo';
            case 'end':
                return 'Fim de jogo';
            default:
                return event.description || event.type;
        }
    };

    const handleSaveNewMatch = () => {
        if (!newMatchForm.teamA || !newMatchForm.teamB || !newMatchForm.sport || !newMatchForm.time || !newMatchForm.location || !newMatchForm.date) {
            alert('Preencha todos os campos!');
            return;
        }

        if (newMatchForm.teamA === newMatchForm.teamB) {
            alert('Uma equipe não pode enfrentar ela mesma!');
            return;
        }

        // Extract name and institution from selected course (e.g., "Administração - Unisanta")
        const [nameA, universityA] = newMatchForm.teamA.split(' - ');
        const [nameB, universityB] = newMatchForm.teamB.split(' - ');

        // Use emblems from state (updated on course selection)
        if (!emblemA || !emblemB) {
            alert('Atenção: Um ou ambos os cursos não possuem emblema configurado. Verifique o banco de dados.');
            return;
        }

        const newMatch: any = {
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

        addMatch(newMatch);
        setIsNewMatchOpen(false);
        setEmblemA(null);
        setEmblemB(null);
        setNewMatchForm({ teamA: '', teamB: '', sport: '', category: 'Masculino', date: new Date().toISOString().split('T')[0], time: '', location: '' });
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

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '10px 0' }}>
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div style={{ 
                            width: '100%', 
                            maxWidth: '480px', 
                            background: '#111', 
                            borderRadius: '16px', 
                            border: '1px solid #333',
                            padding: '30px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}>
                            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '30px' }}>Nova Partida</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                                <select
                                    value={newMatchForm.sport}
                                    onChange={e => setNewMatchForm({ ...newMatchForm, sport: e.target.value })}
                                    style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                >
                                    <option value="">Selecione a Modalidade</option>
                                    {AVAILABLE_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                <select
                                    value={newMatchForm.category}
                                    onChange={e => setNewMatchForm({ ...newMatchForm, category: e.target.value as any })}
                                    style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '14px' }}
                                >
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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

                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
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
                    <div style={styles.teamLeft}>
                        <h2 style={styles.teamName} className="match-timeline-team-name">{selectedMatch.teamA.name}</h2>
                        <div style={styles.score}>{selectedMatch.scoreA}</div>
                    </div>
                    <div style={styles.timeDisplay} className="match-timeline-time-display">
                        <Clock size={24} />
                        <span style={styles.minute}>{currentMinute}'</span>
                        {isRunning && (
                            <span style={styles.liveBadge} className="pulse-animation">
                                AO VIVO
                            </span>
                        )}
                        {isBeachTennis && isTieBreakMode && (
                            <span style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Tie-break: {beachTieBreakA} - {beachTieBreakB}
                            </span>
                        )}
                    </div>
                    <div style={styles.teamRight}>
                        <h2 style={styles.teamName} className="match-timeline-team-name">{selectedMatch.teamB.name}</h2>
                        <div style={styles.score}>{selectedMatch.scoreB}</div>
                    </div>
                </div>

                {/* Controles do Jogo */}
                <div style={styles.gameControls}>
                    <h3 style={styles.sectionTitle}>Controle da Partida</h3>
                    {isBeachTennis ? (
                        <div style={{ ...styles.controlButtons, gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamABtn }}
                                onClick={() => handleBeachPoint('A')}
                            >
                                <Plus size={20} />
                                + Ponto {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                                onClick={() => handleBeachPoint('B')}
                            >
                                <Plus size={20} />
                                + Ponto {selectedMatch.teamB.name.split(' - ')[0]}
                            </button>
                        </div>
                    ) : (
                        <div style={styles.controlButtons} className="match-timeline-control-grid">
                            <button
                                style={{ ...styles.controlBtn, ...styles.startBtn }}
                                onClick={handleStartMatch}
                                disabled={isRunning || selectedMatch.events?.some(e => e.type === 'start')}
                            >
                                <Play size={20} />
                                Iniciar Jogo
                            </button>
                            <button
                                style={{ ...styles.controlBtn, ...styles.pauseBtn }}
                                onClick={handleHalfTime}
                                disabled={!isRunning}
                            >
                                <Pause size={20} />
                                Intervalo
                            </button>
                            <button
                                style={{ ...styles.controlBtn, ...styles.resumeBtn }}
                                onClick={() => setIsRunning(true)}
                                disabled={isRunning || !selectedMatch.events?.some(e => e.type === 'start')}
                            >
                                <Play size={20} />
                                Retomar
                            </button>
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
                    )}
                </div>

                {!isBeachTennis && !isBasketball && (
                    <div style={styles.eventSection}>
                        <h3 style={styles.sectionTitle}>{isVolleyball ? '🏐 Pontos' : '⚽ Gols'}</h3>
                        <div style={styles.eventButtons} className="match-timeline-event-grid">
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamABtn }}
                                onClick={() => isVolleyball ? handleVolleyPoint('A', 'Ponto') : handleGoal('A')}
                            >
                                <Plus size={20} />
                                {isVolleyball ? 'Ponto' : 'Gol'} {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                                onClick={() => isVolleyball ? handleVolleyPoint('B', 'Ponto') : handleGoal('B')}
                            >
                                <Plus size={20} />
                                {isVolleyball ? 'Ponto' : 'Gol'} {selectedMatch.teamB.name.split(' - ')[0]}
                            </button>
                        </div>
                    </div>
                )}

                {isVolleyball && (
                    <div style={styles.eventSection}>
                        <h3 style={styles.sectionTitle}>🏐 Saque</h3>
                        <div style={styles.eventButtons} className="match-timeline-event-grid">
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                                onClick={() => handleVolleyPoint('A', 'ACE Marcado')}
                            >
                                ACE Marcado {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                                onClick={() => handleVolleyPoint('B', 'ACE Marcado')}
                            >
                                ACE Marcado {selectedMatch.teamB.name.split(' - ')[0]}
                            </button>
                        </div>
                        <div style={{ ...styles.eventButtons, marginTop: '12px' }} className="match-timeline-event-grid">
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                onClick={() => handleVolleyPoint('A', 'ACE Perdido')}
                            >
                                ACE Perdido {selectedMatch.teamA.name.split(' - ')[0]}
                            </button>
                            <button
                                style={{ ...styles.eventBtn, background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                onClick={() => handleVolleyPoint('B', 'ACE Perdido')}
                            >
                                ACE Perdido {selectedMatch.teamB.name.split(' - ')[0]}
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

                {!isBeachTennis && !isVolleyball && !isBasketball && (
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
                            <div style={styles.playerList} className="player-list">
                                {athletes
                                    .filter(a => {
                                        const team = showPlayerInput.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
                                        
                                        const athleteCourse = a.course.toLowerCase();
                                        const athleteInst = a.institution.toLowerCase();
                                        const teamCourse = (team.course || '').toLowerCase();
                                        const teamFaculty = (team.faculty || '').toLowerCase();

                                        // Especial para FEFESP / Educação Física
                                        const isFefespMatch = (teamCourse.includes('fefesp') || teamCourse.includes('educação física')) && 
                                                             (athleteCourse.includes('fefesp') || athleteCourse.includes('educação física') || athleteInst.includes('fefesp'));

                                        // Match normal por curso e faculdade
                                        const courseMatch = athleteCourse.includes(teamCourse) || teamCourse.includes(athleteCourse);
                                        const facultyMatch = athleteInst.includes(teamFaculty) || teamFaculty.includes(athleteInst);

                                        return (isFefespMatch || (courseMatch && facultyMatch)) &&
                                               a.sports.includes(selectedMatch.sport);
                                    })
                                    .map((athlete) => {
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
                                {athletes.filter(a => {
                                    const team = showPlayerInput.team === 'A' ? selectedMatch.teamA : selectedMatch.teamB;
                                    const athleteCourse = a.course.toLowerCase();
                                    const athleteInst = a.institution.toLowerCase();
                                    const teamCourse = (team.course || '').toLowerCase();
                                    const teamFaculty = (team.faculty || '').toLowerCase();
                                    return (athleteCourse === teamCourse && athleteInst.includes(teamFaculty)) &&
                                           a.sports.includes(selectedMatch.sport);
                                }).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                        Nenhum atleta encontrado para esta modalidade neste curso.
                                    </div>
                                )}
                            </div>
                            <button
                                style={{ ...styles.modalBtn, ...styles.cancelBtn, marginTop: '16px' }}
                                onClick={cancelPlayerInput}
                            >
                                Cancelar
                            </button>
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
                            [...selectedMatch.events]
                                .filter(e => !isBeachTennis || ['start', 'set_win', 'tie_break_start', 'end'].includes(e.type))
                                .reverse()
                                .map((event) => {
                                    const isTeamA = event.teamId === selectedMatch.teamA.id;
                                    const isTeamB = event.teamId === selectedMatch.teamB.id;
                                    const isGeneral = !event.teamId;
                                    const shortTeamName = isTeamA
                                        ? selectedMatch.teamA.name.split(' - ')[0]
                                        : isTeamB
                                            ? selectedMatch.teamB.name.split(' - ')[0]
                                            : 'Jogo';

                                    return (
                                        <div
                                            key={event.id}
                                            className={`timeline-item-beauty ${isTeamA ? 'timeline-team-a' : ''} ${isTeamB ? 'timeline-team-b' : ''} ${isGeneral ? 'timeline-neutral' : ''}`}
                                            style={styles.timelineItem}
                                        >
                                            <span style={styles.eventTimePill}>{event.minute}'</span>
                                            <span style={styles.eventIconBubble}>{getEventIcon(event.type)}</span>
                                            <div style={styles.eventContentWrap}>
                                                <span style={styles.eventText}>{getEventLabel(event)}</span>
                                                <span style={styles.eventMetaTag}>{shortTeamName}</span>
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
                        padding-left: 6px;
                    }

                    .timeline-list-beauty::before {
                        content: '';
                        position: absolute;
                        left: 18px;
                        top: 6px;
                        bottom: 6px;
                        width: 2px;
                        background: linear-gradient(180deg, rgba(227, 6, 19, 0.55), rgba(227, 6, 19, 0.1));
                    }

                    .timeline-item-beauty {
                        position: relative;
                        margin-left: 10px;
                        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
                    }

                    .timeline-item-beauty::before {
                        content: '';
                        position: absolute;
                        left: -20px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 10px;
                        height: 10px;
                        border-radius: 999px;
                        border: 2px solid var(--accent-color);
                        background: var(--bg-main);
                    }

                    .timeline-team-a {
                        border-left: 3px solid #3b82f6 !important;
                    }

                    .timeline-team-b {
                        border-left: 3px solid #ef4444 !important;
                    }

                    .timeline-neutral {
                        border-left: 3px solid var(--accent-color) !important;
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
                            margin-left: 8px;
                        }

                        .timeline-list-beauty::before {
                            left: 16px;
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
                            margin-left: 4px;
                        }

                        .timeline-item-beauty::before {
                            left: -16px;
                        }

                        .timeline-list-beauty::before {
                            left: 12px;
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
        gap: '12px',
    },
    timelineItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
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
