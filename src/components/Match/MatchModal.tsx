import { type FC, useState } from 'react';
import { X, Clock, MapPin, Trophy, Play, CheckCircle } from 'lucide-react';
import { type Match, type MatchEvent, mockAthletes, COURSE_EMBLEMS, mockMatches, mockTeams } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface MatchModalProps {
    match: Match;
    onClose: () => void;
}

const MatchModal: FC<MatchModalProps> = ({ match: initialMatch, onClose }) => {
    const { user } = useAuth();
    const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
    const [votedFor, setVotedFor] = useState<string | null>(null);
    const [mvpVotedFor, setMvpVotedFor] = useState<string | null>(null);

    // Deterministic random helper
    const pseudoRandom = (seed: string) => {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
        return Math.abs(h) / 2147483648;
    };

    // H2H and Form Logic
    const h2hMatches = mockMatches.filter((m: Match) =>
        m.status === 'finished' && m.id !== currentMatch.id && m.sport === currentMatch.sport &&
        ((m.teamA.id === currentMatch.teamA.id && m.teamB.id === currentMatch.teamB.id) ||
            (m.teamA.id === currentMatch.teamB.id && m.teamB.id === currentMatch.teamA.id))
    );

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;

    if (h2hMatches.length > 0) {
        h2hMatches.forEach((m: Match) => {
            const isTeamAHome = m.teamA.id === currentMatch.teamA.id;
            if (m.scoreA > m.scoreB) {
                if (isTeamAHome) teamAWins++; else teamBWins++;
            } else if (m.scoreB > m.scoreA) {
                if (isTeamAHome) teamBWins++; else teamAWins++;
            } else {
                draws++;
            }
        });
    } else {
        // Generate mock H2H
        const seedStr = currentMatch.teamA.id < currentMatch.teamB.id ? currentMatch.teamA.id + currentMatch.teamB.id : currentMatch.teamB.id + currentMatch.teamA.id;
        const totalMockGames = Math.floor(pseudoRandom(seedStr + "total") * 10);
        for (let i = 0; i < totalMockGames; i++) {
            const rand = pseudoRandom(seedStr + i);
            if (rand < 0.4) teamAWins++;
            else if (rand < 0.8) teamBWins++;
            else draws++;
        }
    }

    const getTeamForm = (teamId: string, sport: string) => {
        const teamMatches = mockMatches.filter((m: Match) =>
            m.status === 'finished' && m.id !== currentMatch.id && m.sport === sport &&
            (m.teamA.id === teamId || m.teamB.id === teamId)
        ).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        if (teamMatches.length > 0) {
            return teamMatches.map((m: Match) => {
                const isHome = m.teamA.id === teamId;
                const opponent = isHome ? m.teamB : m.teamA;
                const myScore = isHome ? m.scoreA : m.scoreB;
                const oppScore = isHome ? m.scoreB : m.scoreA;

                let result: 'win' | 'loss' | 'draw' = 'draw';
                if (myScore > oppScore) result = 'win';
                if (myScore < oppScore) result = 'loss';

                return { opponent, myScore, oppScore, result };
            });
        } else {
            // Generate mock Form
            const mockedForm = [];
            for (let i = 0; i < 5; i++) {
                const randOppIdx = Math.floor(pseudoRandom(teamId + "opp" + i) * mockTeams.length);
                const opponent = mockTeams[randOppIdx];
                const r = pseudoRandom(teamId + "res" + i);
                let result: 'win' | 'loss' | 'draw' = 'draw';
                if (r < 0.45) result = 'win';
                else if (r < 0.9) result = 'loss';

                let myScore = 0, oppScore = 0;
                if (result === 'win') { myScore = Math.floor(pseudoRandom(teamId + "s1" + i) * 4) + 1; oppScore = Math.floor(pseudoRandom(teamId + "s2" + i) * myScore); }
                else if (result === 'loss') { oppScore = Math.floor(pseudoRandom(teamId + "s1" + i) * 4) + 1; myScore = Math.floor(pseudoRandom(teamId + "s2" + i) * oppScore); }
                else { myScore = Math.floor(pseudoRandom(teamId + "s1" + i) * 3); oppScore = myScore; }

                mockedForm.push({ opponent, myScore, oppScore, result });
            }
            return mockedForm;
        }
    };

    const teamAForm = getTeamForm(currentMatch.teamA.id, currentMatch.sport);
    const teamBForm = getTeamForm(currentMatch.teamB.id, currentMatch.sport);

    const getTeamEmblem = (teamName: string) => {
        const foundCourse = Object.keys(COURSE_EMBLEMS).find(courseKey =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );
        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
    };

    const TeamHeaderDisplay = ({ team }: { team: any }) => {
        const emblemUrl = getTeamEmblem(team.name);
        return (
            <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                }}>
                    {emblemUrl ? (
                        <img
                            src={emblemUrl}
                            alt={team.name}
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                            }}
                        />
                    ) : null}
                    <div style={{
                        fontSize: '40px',
                        display: emblemUrl ? 'none' : 'block'
                    }}>
                        {team.logo}
                    </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{team.name.split(' - ')[0]}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{team.name.split(' - ')[1]}</div>
            </div>
        );
    };

    const eligibleSportsForMVP = ['Futsal', 'Futebol Society', 'Basquete 3x3', 'Vôlei'];
    const isEligibleForMVP = eligibleSportsForMVP.includes(currentMatch.sport) && currentMatch.status === 'finished';

    const mvpCandidates = mockAthletes.filter(a =>
        a.sports.includes(currentMatch.sport) &&
        (
            a.course === currentMatch.teamA.course || a.course === currentMatch.teamB.course ||
            a.institution.toLowerCase() === currentMatch.teamA.name.toLowerCase() ||
            a.institution.toLowerCase() === currentMatch.teamB.name.toLowerCase()
        )
    );

    const getEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal': return <Trophy size={16} color="#ffd700" />;
            case 'set_win': return <Trophy size={16} color="#ffd700" />;
            case 'yellow_card': return <div style={{ width: 12, height: 16, background: '#ffcc00', borderRadius: 2 }} />;
            case 'red_card': return <div style={{ width: 12, height: 16, background: '#ff4444', borderRadius: 2 }} />;
            case 'start': return <Play size={16} color="var(--accent-color)" />;
            case 'end': return <CheckCircle size={16} color="#44ff44" />;
            default: return null;
        }
    };

    const getEventLabel = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal': return 'GOL!';
            case 'set_win': return 'Fim do Set';
            case 'yellow_card': return 'Cartão Amarelo';
            case 'red_card': return 'Cartão Vermelho';
            case 'start': return 'Início da Partida';
            case 'end': return 'Fim da Partida';
            default: return '';
        }
    };

    const simulateMatch = () => {
        const isVolleyball = currentMatch.sport === 'Vôlei' || currentMatch.sport.includes('Vôlei');
        const scoreA = isVolleyball ? 2 : Math.floor(Math.random() * 5);
        const scoreB = isVolleyball ? (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 5);

        const newEvents: MatchEvent[] = [{ id: `start-${Date.now()}`, type: 'start', minute: 0 }];

        let currentMin = 5;
        for (let i = 0; i < scoreA; i++) {
            currentMin += Math.floor(Math.random() * 10) + 1;
            newEvents.push({ id: `goalA-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamA.id, player: `Jogador ${i + 1} A` });
        }
        currentMin = 5;
        for (let i = 0; i < scoreB; i++) {
            currentMin += Math.floor(Math.random() * 10) + 1;
            newEvents.push({ id: `goalB-${i}`, type: isVolleyball ? 'set_win' : 'goal', minute: currentMin, teamId: currentMatch.teamB.id, player: `Jogador ${i + 1} B` });
        }

        newEvents.push({ id: `end-${Date.now()}`, type: 'end', minute: 90 });

        setCurrentMatch(prev => ({
            ...prev,
            status: 'finished',
            scoreA,
            scoreB,
            events: newEvents
        }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div className="premium-card" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalSlideUp 0.3s ease-out',
                padding: 0
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'linear-gradient(to bottom, var(--bg-hover), var(--bg-primary))'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'var(--bg-hover)',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {currentMatch.sport}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TeamHeaderDisplay team={currentMatch.teamA} />

                        <div style={{ padding: '0 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)' }}>
                                <span>{currentMatch.scoreA}</span>
                                <span style={{ fontSize: '20px', color: 'var(--text-secondary)', fontWeight: 700 }}>X</span>
                                <span>{currentMatch.scoreB}</span>
                            </div>
                            {currentMatch.status === 'live' && (
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--live-color)',
                                    fontWeight: 700,
                                    background: 'rgba(255, 68, 68, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    marginTop: '5px',
                                    display: 'inline-block'
                                }}>
                                    AO VIVO
                                </div>
                            )}
                        </div>

                        <TeamHeaderDisplay team={currentMatch.teamB} />
                    </div>

                    <div style={{
                        marginTop: '15px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            {currentMatch.date.split('-').reverse().join('-')} às {currentMatch.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} />
                            {currentMatch.location}
                        </div>
                    </div>

                    {currentMatch.status === 'scheduled' && (
                        <div style={{ marginTop: '20px', textAlign: 'center', background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Quem vai vencer?</h4>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                <button
                                    onClick={() => user ? setVotedFor(currentMatch.teamA.id) : undefined}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: votedFor === currentMatch.teamA.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                        background: votedFor === currentMatch.teamA.id ? 'rgba(227, 6, 19, 0.1)' : 'var(--bg-main)',
                                        color: votedFor === currentMatch.teamA.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                        fontWeight: 700,
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: user ? 1 : 0.5
                                    }}
                                    disabled={!user}
                                >
                                    {currentMatch.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    onClick={() => user ? setVotedFor(currentMatch.teamB.id) : undefined}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: votedFor === currentMatch.teamB.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                        background: votedFor === currentMatch.teamB.id ? 'rgba(227, 6, 19, 0.1)' : 'var(--bg-main)',
                                        color: votedFor === currentMatch.teamB.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                        fontWeight: 700,
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: user ? 1 : 0.5
                                    }}
                                    disabled={!user}
                                >
                                    {currentMatch.teamB.name.split(' - ')[0]}
                                </button>
                            </div>

                            {/* Simulate Button (Admin or any for testing) */}
                            <div style={{ marginTop: '15px' }}>
                                <button
                                    onClick={simulateMatch}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px'
                                    }}
                                >
                                    <Play size={16} /> Simular Partida
                                </button>
                            </div>

                            {!user && (
                                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    Faça login para registrar seu palpite!
                                </div>
                            )}
                            {user && votedFor && (
                                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                    Palpite registrado!
                                </div>
                            )}
                        </div>
                    )}

                    {isEligibleForMVP && (
                        <div style={{ marginTop: '20px', textAlign: 'center', background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>Destaque da Partida</h4>
                            {mvpCandidates.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                    {mvpCandidates.map(candidate => (
                                        <button
                                            key={candidate.id}
                                            onClick={() => user ? setMvpVotedFor(candidate.id) : undefined}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: mvpVotedFor === candidate.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                                background: mvpVotedFor === candidate.id ? 'rgba(227, 6, 19, 0.1)' : 'var(--bg-main)',
                                                color: mvpVotedFor === candidate.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                cursor: user ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s',
                                                opacity: user ? 1 : 0.5,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            disabled={!user}
                                        >
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--bg-hover)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--accent-color)', fontSize: '12px', fontWeight: 'bold'
                                            }}>
                                                {candidate.firstName[0]}{candidate.lastName[0]}
                                            </div>
                                            <span>{candidate.firstName} {candidate.lastName}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Nenhum jogador cadastrado nesta partida.
                                </div>
                            )}

                            {!user && mvpCandidates.length > 0 && (
                                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    Faça login para votar no destaque!
                                </div>
                            )}
                            {user && mvpVotedFor && (
                                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                    Voto em destaque registrado!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Scrollable Content Body */}
                <div className="custom-scrollbar" style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'var(--bg-primary)'
                }}>
                    {/* Timeline Body */}
                    {currentMatch.sport !== 'Basquete 3x3' && (
                        <div style={{
                            padding: '20px',
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Cronologia</h3>

                            {(() => {
                                const matchEvents: MatchEvent[] = currentMatch.events ? [...currentMatch.events] : [];
                                if (currentMatch.status === 'finished' && !matchEvents.some(e => e.type === 'end')) {
                                    const maxMin = matchEvents.reduce((max, e) => Math.max(max, e.minute), 0);
                                    matchEvents.push({
                                        id: 'end-event',
                                        type: 'end',
                                        minute: maxMin + 1,
                                    });
                                }

                                return matchEvents.length > 0 ? (
                                    <div style={{ position: 'relative' }}>
                                        {/* Vertical Line */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '9px',
                                            top: '10px',
                                            bottom: '10px',
                                            width: '2px',
                                            background: 'var(--border-color)'
                                        }} />

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                            {[...matchEvents].sort((a, b) => a.minute - b.minute).map((event) => {
                                                const isTeamA = event.teamId === currentMatch.teamA.id;
                                                return (
                                                    <div key={event.id} style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: '25px' }}>
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            background: 'var(--bg-hover)',
                                                            border: '2px solid var(--border-color)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: '20px',
                                                            zIndex: 2
                                                        }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                                                        </div>

                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                {getEventIcon(event.type)}
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                        {getEventLabel(event.type)} {event.score && <span style={{ color: 'var(--accent-color)', marginLeft: '8px' }}>({event.score})</span>}
                                                                    </div>
                                                                    {(event.player || event.teamId) && (
                                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                                            {event.player ? `${event.player} (` : ''}
                                                                            {isTeamA ? currentMatch.teamA.name.split(' - ')[0] : currentMatch.teamB.name.split(' - ')[0]}
                                                                            {event.player ? ')' : ''}
                                                                            {event.type === 'set_win' ? ' venceu o set' : ''}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        <Clock size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                        <div>Nenhum evento registrado ainda.</div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Match Stats / History */}
                    <div style={{
                        padding: '20px',
                        borderTop: currentMatch.sport !== 'Basquete 3x3' ? '1px solid var(--border-color)' : 'none',
                        background: 'var(--bg-card)'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Confrontos diretos</h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                                {teamAWins > teamBWins && <Trophy size={16} color="#ffd700" style={{ marginBottom: '-4px' }} />}
                                <div style={{ fontSize: '32px', fontWeight: 900 }}>{teamAWins}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vitórias</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', textAlign: 'center' }}>{currentMatch.teamA.name.split(' - ')[0]}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-secondary)' }}>{draws}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Empates</div>
                                <div style={{ fontSize: '14px', marginTop: '8px', color: 'transparent' }}>-</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                                {teamBWins > teamAWins && <Trophy size={16} color="#ffd700" style={{ marginBottom: '-4px' }} />}
                                <div style={{ fontSize: '32px', fontWeight: 900 }}>{teamBWins}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vitórias</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px', textAlign: 'center' }}>{currentMatch.teamB.name.split(' - ')[0]}</div>
                            </div>
                        </div>

                        {/* Recent Form */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '40px' }}>

                            {/* Team A Form */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 600 }}>Últimos 5 jogos</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {teamAForm.length > 0 ? teamAForm.map((form: any, i: number) => {
                                        let bgColor = '';
                                        let letter = '';
                                        if (form.result === 'win') { bgColor = '#22c55e'; letter = 'V'; }
                                        else if (form.result === 'loss') { bgColor = '#ef4444'; letter = 'D'; }
                                        else { bgColor = '#eab308'; letter = 'E'; }

                                        return (
                                            <div key={i} style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '4px',
                                                background: bgColor,
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }} title={`${form.myScore} - ${form.oppScore} vs ${form.opponent.name}`}>
                                                {letter}
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sem histórico</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 10px' }} />

                            {/* Team B Form */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 600 }}>Últimos 5 jogos</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {teamBForm.length > 0 ? teamBForm.map((form: any, i: number) => {
                                        let bgColor = '';
                                        let letter = '';
                                        if (form.result === 'win') { bgColor = '#22c55e'; letter = 'V'; }
                                        else if (form.result === 'loss') { bgColor = '#ef4444'; letter = 'D'; }
                                        else { bgColor = '#eab308'; letter = 'E'; }

                                        return (
                                            <div key={i} style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '4px',
                                                background: bgColor,
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }} title={`${form.myScore} - ${form.oppScore} vs ${form.opponent.name}`}>
                                                {letter}
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sem histórico</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--text-secondary);
                }
            `}</style>
        </div>
    );
};

export default MatchModal;
