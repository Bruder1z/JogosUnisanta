import { type FC, useState } from 'react';
import { X, Clock, MapPin, Trophy, Play, CheckCircle } from 'lucide-react';
import { type Match, type MatchEvent, mockAthletes, COURSE_EMBLEMS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface MatchModalProps {
    match: Match;
    onClose: () => void;
}

const MatchModal: FC<MatchModalProps> = ({ match, onClose }) => {
    const { user } = useAuth();
    const [votedFor, setVotedFor] = useState<string | null>(null);
    const [mvpVotedFor, setMvpVotedFor] = useState<string | null>(null);

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
    const isEligibleForMVP = eligibleSportsForMVP.includes(match.sport) && match.status === 'finished';

    const mvpCandidates = mockAthletes.filter(a =>
        a.sports.includes(match.sport) &&
        (
            a.course === match.teamA.course || a.course === match.teamB.course ||
            a.institution.toLowerCase() === match.teamA.name.toLowerCase() ||
            a.institution.toLowerCase() === match.teamB.name.toLowerCase()
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
            padding: '20px'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)'
                }}
            />

            {/* Modal Content */}
            <div className="premium-card" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalSlideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '30px',
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
                        {match.sport}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TeamHeaderDisplay team={match.teamA} />

                        <div style={{ padding: '0 30px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)' }}>
                                <span>{match.scoreA}</span>
                                <span style={{ fontSize: '24px', color: 'var(--text-secondary)', fontWeight: 700 }}>X</span>
                                <span>{match.scoreB}</span>
                            </div>
                            {match.status === 'live' && (
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

                        <TeamHeaderDisplay team={match.teamB} />
                    </div>

                    <div style={{
                        marginTop: '25px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            {match.date.split('-').reverse().join('-')} às {match.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} />
                            {match.location}
                        </div>
                    </div>

                    {match.status === 'scheduled' && (
                        <div style={{ marginTop: '30px', textAlign: 'center', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>Quem vai vencer?</h4>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                <button
                                    onClick={() => user ? setVotedFor(match.teamA.id) : undefined}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: votedFor === match.teamA.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                        background: votedFor === match.teamA.id ? 'rgba(227, 6, 19, 0.1)' : 'var(--bg-main)',
                                        color: votedFor === match.teamA.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                        fontWeight: 700,
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: user ? 1 : 0.5
                                    }}
                                    disabled={!user}
                                >
                                    {match.teamA.name.split(' - ')[0]}
                                </button>
                                <button
                                    onClick={() => user ? setVotedFor(match.teamB.id) : undefined}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: votedFor === match.teamB.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                        background: votedFor === match.teamB.id ? 'rgba(227, 6, 19, 0.1)' : 'var(--bg-main)',
                                        color: votedFor === match.teamB.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                        fontWeight: 700,
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: user ? 1 : 0.5
                                    }}
                                    disabled={!user}
                                >
                                    {match.teamB.name.split(' - ')[0]}
                                </button>
                            </div>
                            {!user && (
                                <div style={{ marginTop: '15px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    Faça login para registrar seu palpite!
                                </div>
                            )}
                            {user && votedFor && (
                                <div style={{ marginTop: '15px', fontSize: '13px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                    Voto registrado!
                                </div>
                            )}
                        </div>
                    )}

                    {isEligibleForMVP && (
                        <div style={{ marginTop: '30px', textAlign: 'center', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
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
                                <div style={{ marginTop: '15px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    Faça login para votar no destaque!
                                </div>
                            )}
                            {user && mvpVotedFor && (
                                <div style={{ marginTop: '15px', fontSize: '13px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                    Voto em destaque registrado!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Timeline Body */}
                {match.sport !== 'Basquete 3x3' && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '30px',
                        background: 'var(--bg-primary)'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Cronologia</h3>

                        {match.events && match.events.length > 0 ? (
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
                                    {[...match.events].sort((a, b) => a.minute - b.minute).map((event) => {
                                        const isTeamA = event.teamId === match.teamA.id;
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
                                                                    {isTeamA ? match.teamA.name.split(' - ')[0] : match.teamB.name.split(' - ')[0]}
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
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MatchModal;
