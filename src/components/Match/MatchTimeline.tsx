import { useState, useEffect, type FC } from 'react';
import { Play, Pause, StopCircle, Clock, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { type Match, type MatchEvent } from '../../data/mockData';

interface MatchTimelineProps {
    matchId?: string;
}

// Mock de jogadores por time (15 jogadores por time para futsal/society)
const TEAM_PLAYERS: Record<string, string[]> = {
    '1': ['João Silva', 'Pedro Santos', 'Lucas Oliveira', 'Rafael Costa', 'Bruno Alves', 'Gabriel Lima', 'Matheus Rocha', 'Felipe Souza', 'Thiago Martins', 'André Ferreira', 'Carlos Dias', 'Leonardo Gomes', 'Rodrigo Pires', 'Júlio Barros', 'Diego Mendes'],
    '2': ['Fernando Araújo', 'Paulo Ribeiro', 'Marcelo Nunes', 'Anderson Silva', 'Ricardo Lopes', 'Gustavo Moreira', 'Vinicius Castro', 'Fábio Monteiro', 'Eduardo Cardoso', 'Roberto Freitas', 'Henrique Batista', 'Daniel Ramos', 'Maurício Campos', 'José Teixeira', 'Wagner Correia'],
    '3': ['Alexandre Pereira', 'Renato Vieira', 'Sérgio Duarte', 'Cristiano Pinto', 'Adriano Melo', 'Leandro Farias', 'Marcos Xavier', 'Alberto Cunha', 'Francisco Sales', 'Júnior Azevedo', 'Márcio Borges', 'Cláudio Castro', 'Samuel Torres', 'Rogério Miranda', 'Antônio Pacheco'],
    '4': ['Igor Nogueira', 'Caio Barbosa', 'Renan Carvalho', 'Guilherme Rodrigues', 'Douglas Fernandes', 'Alan Machado', 'Murilo Santana', 'Éverton Soares', 'Wesley Fonseca', 'Diogo Nascimento', 'Victor Hugo', 'Kauê Moraes', 'Nathan Almeida', 'Erick Bezerra', 'Yuri Tavares']
};

const MatchTimeline: FC<MatchTimelineProps> = ({ matchId }) => {
    const { matches, updateMatch } = useData();
    
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [currentMinute, setCurrentMinute] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [showPlayerInput, setShowPlayerInput] = useState<{ type: 'goal' | 'yellow_card' | 'red_card' | 'penalty_scored', team: 'A' | 'B' } | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

    // Filtrar apenas Futsal e Futebol Society
    const soccerMatches = matches.filter((m: Match) => 
        m.sport === 'Futsal' || m.sport === 'Futebol Society'
    );

    useEffect(() => {
        if (matchId) {
            const match = soccerMatches.find((m: Match) => m.id === matchId);
            if (match) setSelectedMatch(match);
        }
    }, [matchId, soccerMatches]);

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
        setSelectedMatch(match);
        setCurrentMinute(0);
        setIsRunning(false);
    };

    const addEvent = (type: MatchEvent['type'], teamId?: string, player?: string) => {
        if (!selectedMatch) return;

        const newEvent: MatchEvent = {
            id: `evt_${Date.now()}`,
            type,
            minute: currentMinute,
            teamId,
            player
        };

        const updatedEvents = [...(selectedMatch.events || []), newEvent];
        
        // Atualizar pontuação se for gol
        let newScoreA = selectedMatch.scoreA;
        let newScoreB = selectedMatch.scoreB;
        if (type === 'goal') {
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
        setSelectedMatch(updatedMatch);
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
        addEvent('end');
        setIsRunning(false);
    };

    const handleGoal = (team: 'A' | 'B') => {
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
        setSelectedMatch(resetMatch);
        setCurrentMinute(0);
        setIsRunning(false);
        setShowResetConfirm(false);
    };

    const getEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal': return '⚽';
            case 'yellow_card': return '🟨';
            case 'red_card': return '🟥';
            case 'start': return '▶️';
            case 'end': return '🏁';
            case 'halftime': return '⏸️';
            case 'penalty_scored': return '🎯';
            case 'penalty_missed': return '❌';
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
                return `GOL! ${teamName} ${event.player ? `- ${event.player}` : ''}`;
            case 'yellow_card':
                return `Cartão Amarelo - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'red_card':
                return `Cartão Vermelho - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'penalty_scored':
                return `Pênalti Marcado - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'penalty_missed':
                return `Pênalti Perdido - ${teamName} ${event.player ? `(${event.player})` : ''}`;
            case 'start':
                return 'Início da partida';
            case 'halftime':
                return 'Intervalo';
            case 'end':
                return 'Fim de jogo';
            default:
                return event.type;
        }
    };

    if (!selectedMatch) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>⚽ Cronologia de Partida - Futsal/Society</h1>
                </div>
                <div style={styles.content}>
                    <h2 style={styles.subtitle}>Selecione uma partida:</h2>
                    <div style={styles.matchList}>
                        {soccerMatches.length === 0 ? (
                            <p style={styles.noMatches}>Nenhuma partida de Futsal/Futebol Society disponível.</p>
                        ) : (
                            soccerMatches.map((match: Match) => (
                                <div
                                    key={match.id}
                                    style={styles.matchItem}
                                    onClick={() => handleSelectMatch(match)}
                                >
                                    <div style={styles.matchInfo}>
                                        <span style={styles.sportBadge}>{match.sport}</span>
                                        <span style={styles.categoryBadge}>{match.category}</span>
                                    </div>
                                    <div style={styles.matchTeams}>
                                        <span>{match.teamA.name}</span>
                                        <span style={styles.vs}>vs</span>
                                        <span>{match.teamB.name}</span>
                                    </div>
                                    <div style={styles.matchDateTime}>
                                        {match.date} - {match.time}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 style={styles.title}>⚽ Controle de Partida</h1>
                        <button 
                            style={styles.changeMatchBtn}
                            onClick={() => setSelectedMatch(null)}
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
                <div style={styles.scoreboard}>
                    <div style={styles.teamLeft}>
                        <h2>{selectedMatch.teamA.name}</h2>
                        <div style={styles.score}>{selectedMatch.scoreA}</div>
                    </div>
                    <div style={styles.timeDisplay}>
                        <Clock size={24} />
                        <span style={styles.minute}>{currentMinute}'</span>
                        {isRunning && (
                            <span style={styles.liveBadge} className="pulse-animation">
                                🔴 AO VIVO
                            </span>
                        )}
                    </div>
                    <div style={styles.teamRight}>
                        <h2>{selectedMatch.teamB.name}</h2>
                        <div style={styles.score}>{selectedMatch.scoreB}</div>
                    </div>
                </div>

                {/* Controles do Jogo */}
                <div style={styles.gameControls}>
                    <h3 style={styles.sectionTitle}>Controle da Partida</h3>
                    <div style={styles.controlButtons}>
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
                            style={{ ...styles.controlBtn, ...styles.endBtn }}
                            onClick={handleEndMatch}
                            disabled={selectedMatch.status === 'finished'}
                        >
                            <StopCircle size={20} />
                            Fim de Jogo
                        </button>
                    </div>
                </div>

                {/* Eventos - Gols */}
                <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>⚽ Gols</h3>
                    <div style={styles.eventButtons}>
                        <button
                            style={{ ...styles.eventBtn, ...styles.teamABtn }}
                            onClick={() => handleGoal('A')}
                        >
                            <Plus size={20} />
                            Gol {selectedMatch.teamA.name.split(' - ')[0]}
                        </button>
                        <button
                            style={{ ...styles.eventBtn, ...styles.teamBBtn }}
                            onClick={() => handleGoal('B')}
                        >
                            <Plus size={20} />
                            Gol {selectedMatch.teamB.name.split(' - ')[0]}
                        </button>
                    </div>
                </div>

                {/* Eventos - Cartões */}
                <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>🟨 Cartões Amarelos</h3>
                    <div style={styles.eventButtons}>
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
                    <div style={styles.eventButtons}>
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

                {/* Eventos - Pênaltis */}
                <div style={styles.eventSection}>
                    <h3 style={styles.sectionTitle}>🎯 Pênaltis</h3>
                    <div style={styles.eventButtons}>
                        <button
                            style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                            onClick={() => handlePenalty('penalty_scored', 'A')}
                        >
                            🎯 Pênalti Marcado {selectedMatch.teamA.name.split(' - ')[0]}
                        </button>
                        <button
                            style={{ ...styles.eventBtn, ...styles.penaltyBtn }}
                            onClick={() => handlePenalty('penalty_scored', 'B')}
                        >
                            🎯 Pênalti Marcado {selectedMatch.teamB.name.split(' - ')[0]}
                        </button>
                    </div>
                    <div style={{ ...styles.eventButtons, marginTop: '12px' }}>
                        <button
                            style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                            onClick={() => handlePenalty('penalty_missed', 'A')}
                        >
                            ❌ Pênalti Perdido {selectedMatch.teamA.name.split(' - ')[0]}
                        </button>
                        <button
                            style={{ ...styles.eventBtn, ...styles.penaltyMissedBtn }}
                            onClick={() => handlePenalty('penalty_missed', 'B')}
                        >
                            ❌ Pênalti Perdido {selectedMatch.teamB.name.split(' - ')[0]}
                        </button>
                    </div>
                </div>

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
                                {TEAM_PLAYERS[
                                    showPlayerInput.team === 'A' ? selectedMatch.teamA.id : selectedMatch.teamB.id
                                ]?.map((player) => {
                                    const stats = getPlayerStats(player);
                                    return (
                                        <button
                                            key={player}
                                            className={stats.canPlay ? "player-item-hover" : ""}
                                            style={{
                                                ...styles.playerItem,
                                                ...(stats.canPlay ? {} : styles.playerItemDisabled)
                                            }}
                                            onClick={() => stats.canPlay && confirmPlayerEvent(player)}
                                            disabled={!stats.canPlay}
                                        >
                                            <span style={styles.playerName}>{player}</span>
                                            <div style={styles.playerStats}>
                                                {stats.goals > 0 && <span style={styles.statBadge}>⚽ {stats.goals}</span>}
                                                {stats.yellowCards > 0 && <span style={styles.statBadge}>🟨 {stats.yellowCards}</span>}
                                                {stats.redCards > 0 && <span style={styles.statBadgeRed}>🟥 EXPULSO</span>}
                                            </div>
                                        </button>
                                    );
                                })}
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
                    <div style={styles.timelineList}>
                        {(!selectedMatch.events || selectedMatch.events.length === 0) ? (
                            <p style={styles.noEvents}>Nenhum evento registrado ainda.</p>
                        ) : (
                            [...selectedMatch.events].reverse().map((event) => {
                                const isTeamA = event.teamId === selectedMatch.teamA.id;
                                const isTeamB = event.teamId === selectedMatch.teamB.id;
                                const isGeneral = !event.teamId;
                                
                                return (
                                    <div 
                                        key={event.id} 
                                        style={{
                                            ...styles.timelineItem,
                                            ...(isTeamA ? styles.timelineItemLeft : {}),
                                            ...(isTeamB ? styles.timelineItemRight : {}),
                                            ...(isGeneral ? styles.timelineItemCenter : {})
                                        }}
                                    >
                                        {isTeamB && <span style={styles.eventTime}>{event.minute}'</span>}
                                        <span style={styles.eventIcon}>{getEventIcon(event.type)}</span>
                                        <span style={styles.eventText}>{getEventLabel(event)}</span>
                                        {(isTeamA || isGeneral) && <span style={styles.eventTime}>{event.minute}'</span>}
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
        letterSpacing: '1px',
        marginTop: '8px',
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
        minWidth: '400px',
        border: '1px solid var(--border-color)',
    },
    modalContentLarge: {
        backgroundColor: 'var(--bg-card)',
        padding: '32px',
        borderRadius: 'var(--border-radius)',
        minWidth: '500px',
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
        padding: '12px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border-color)',
    },
    timelineItemLeft: {
        justifyContent: 'flex-start',
        marginRight: '20%',
    },
    timelineItemRight: {
        justifyContent: 'flex-end',
        marginLeft: '20%',
        flexDirection: 'row-reverse',
    },
    timelineItemCenter: {
        justifyContent: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '60%',
    },
    eventTime: {
        fontWeight: 700,
        color: 'var(--accent-color)',
        minWidth: '40px',
    },
    eventIcon: {
        fontSize: '20px',
    },
    eventText: {
        flex: 1,
    },
    noEvents: {
        color: 'var(--text-secondary)',
        textAlign: 'center',
        padding: '20px',
    },
};

export default MatchTimeline;
