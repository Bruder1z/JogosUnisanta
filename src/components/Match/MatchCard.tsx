import { type FC } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { type Match, COURSE_EMBLEMS } from '../../data/mockData';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
    const isBeachTennis = match.sport === 'Beach Tennis';
    const isSwimming = match.sport === 'Natação';
    const isPenaltyShootoutSport = match.sport === 'Futsal' || match.sport === 'Futebol Society' || match.sport === 'Futebol X1';

    // Extrai resultado da disputa de pênaltis dos eventos
    const penaltyResult = (() => {
        if (!isPenaltyShootoutSport || match.status !== 'finished') return null;
        const startIdx = (match.events || []).findIndex(
            (e) => e.type === 'halftime' && e.description?.startsWith('⚽ Início da Disputa de Pênaltis')
        );
        if (startIdx === -1) return null;
        const shootoutEvents = (match.events || []).slice(startIdx + 1).filter(
            (e) => e.type === 'penalty_scored' || e.type === 'penalty_missed'
        );
        if (shootoutEvents.length === 0) return null;
        const scoredA = shootoutEvents.filter((e) => e.type === 'penalty_scored' && e.teamId === match.teamA.id).length;
        const scoredB = shootoutEvents.filter((e) => e.type === 'penalty_scored' && e.teamId === match.teamB.id).length;
        const winnerName = scoredA > scoredB
            ? match.teamA.name.split(' - ')[0]
            : match.teamB.name.split(' - ')[0];
        return { scoredA, scoredB, winnerName };
    })();

    const getEventTimestamp = (eventId: string) => {
        const raw = eventId.split('_')[1] || eventId;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getBeachTennisSummary = () => {
        const initial = {
            setsA: 0,
            setsB: 0,
            gamesA: 0,
            gamesB: 0,
            pointsA: 0,
            pointsB: 0,
            setResults: [] as string[]
        };

        if (!isBeachTennis) return initial;

        const events = [...(match.events || [])]
            .sort((a, b) => (a.minute - b.minute) || (getEventTimestamp(a.id) - getEventTimestamp(b.id)));

        let currentSetStartIndex = 0;
        let currentGamePointsA = 0;
        let currentGamePointsB = 0;
        let currentGamesA = 0;
        let currentGamesB = 0;
        let setsA = 0;
        let setsB = 0;
        const setResults: string[] = [];

        events.forEach((event, index) => {
            if (event.type === 'goal') {
                if (event.teamId === match.teamA.id) currentGamePointsA += 1;
                if (event.teamId === match.teamB.id) currentGamePointsB += 1;
                return;
            }

            if (event.type === 'set_win' && event.description?.startsWith('Game para ')) {
                if (event.teamId === match.teamA.id) currentGamesA += 1;
                if (event.teamId === match.teamB.id) currentGamesB += 1;
                currentGamePointsA = 0;
                currentGamePointsB = 0;
                return;
            }

            if (event.type === 'set_win' && event.description?.startsWith('Set para ')) {
                const segmentEvents = events.slice(currentSetStartIndex, index + 1);
                const gamesA = segmentEvents.filter(e => e.type === 'set_win' && e.description?.startsWith('Game para ') && e.teamId === match.teamA.id).length;
                const gamesB = segmentEvents.filter(e => e.type === 'set_win' && e.description?.startsWith('Game para ') && e.teamId === match.teamB.id).length;
                setResults.push(`${gamesA}-${gamesB}`);
                if (event.teamId === match.teamA.id) setsA += 1;
                if (event.teamId === match.teamB.id) setsB += 1;
                currentSetStartIndex = index + 1;
                currentGamesA = 0;
                currentGamesB = 0;
                currentGamePointsA = 0;
                currentGamePointsB = 0;
            }
        });

        return {
            setsA,
            setsB,
            gamesA: currentGamesA,
            gamesB: currentGamesB,
            pointsA: currentGamePointsA,
            pointsB: currentGamePointsB,
            setResults
        };
    };

    const beachSummary = getBeachTennisSummary();
    const BEACH_POINT_LABELS = ['0', '15', '30', '40'];

    const getSwimmingParticipants = () => {
        const raw = match.participants;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw) as Match['teamA'][];
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const swimmingParticipants = isSwimming
        ? (getSwimmingParticipants().length ? getSwimmingParticipants() : [match.teamA, match.teamB])
        : [];

    const getSwimmingPodium = () => {
        const resultEvents = (match.events || [])
            .filter((event) => event.type === 'swimming_result' && event.description)
            .map((event) => {
                const description = event.description || '';
                const rankMatch = description.match(/^(\d+)\s*º?\s*-/i);
                const rank = rankMatch ? Number(rankMatch[1]) : Number.MAX_SAFE_INTEGER;
                const parts = description.split(' - ');
                const courseName = (parts[parts.length - 1] || '').trim();
                const athleteRaw = parts.length >= 3
                    ? parts.slice(1, parts.length - 1).join(' - ').trim()
                    : '';

                const timeMatch = athleteRaw.match(/\(([^)]+)\)\s*$/);
                const athleteName = athleteRaw.replace(/\s*\([^)]+\)\s*$/, '').trim();
                const athleteTime = timeMatch ? timeMatch[1].trim() : '';

                const matchedParticipant = swimmingParticipants.find((participant) => {
                    const shortName = participant.name.split(' - ')[0].trim().toLowerCase();
                    const fullCourse = (participant.course || '').trim().toLowerCase();
                    const target = courseName.toLowerCase();
                    return shortName === target || fullCourse === target;
                });

                const resolvedCourseLabel = matchedParticipant
                    ? matchedParticipant.name.split(' - ')[0]
                    : (courseName || 'Curso não informado');
                const resolvedCourseKey = matchedParticipant?.course || resolvedCourseLabel;
                const resolvedFaculty = matchedParticipant?.faculty
                    || (matchedParticipant?.name.includes(' - ') ? matchedParticipant.name.split(' - ')[1] : '')
                    || (resolvedCourseKey.includes(' - ') ? resolvedCourseKey.split(' - ')[1] : '')
                    || 'Faculdade não informada';

                return {
                    rank,
                    courseLabel: resolvedCourseLabel,
                    courseKey: resolvedCourseKey,
                    faculty: resolvedFaculty,
                    athleteName,
                    athleteTime
                };
            })
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 3);

        return resultEvents;
    };

    const swimmingPodium = isSwimming && match.status === 'finished' ? getSwimmingPodium() : [];

    const getCourseEmblem = (course: string) => {
        if (course in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[course]}`;
        }
        return null;
    };

    const getTeamEmblem = (team: any) => {
        if (team.logo) return team.logo;
        if (team.course && team.course in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[team.course]}`;
        }
        
        const strictName = team.name.split(' - ')[0];
        if (strictName in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[strictName]}`;
        }
        return null;
    };

    const TeamDisplay = ({ team }: { team: any }) => {
        const emblemUrl = getTeamEmblem(team);

        return (
            <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
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
                        fontSize: '32px',
                        display: emblemUrl ? 'none' : 'block'
                    }}>
                        {team.logo}
                    </div>
                </div>
                <div className="match-team-name" style={{ fontSize: '14px', fontWeight: 600 }}>{team.name.split(' - ')[0]}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{team.name.split(' - ')[1]}</div>
                {team.faculty && (
                    <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: 600, marginTop: '2px' }}>
                        {team.faculty}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="premium-card hover-glow match-card-wrapper"
            onClick={onClick}
            style={{
                padding: '20px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {(() => {
                const PHASE_SPORTS = ['Vôlei', 'Vôlei de Praia', 'Futevôlei', 'Beach Tennis'];
                const showPhase = PHASE_SPORTS.includes(match.sport) && match.stage;
                return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{match.sport.toUpperCase()} - {match.category.toUpperCase()}</span>
                            {showPhase && (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: match.stage === 'Fase Final' ? '#f59e0b' : 'var(--accent-color)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    {match.stage === 'Fase Final' ? '🏆 Fase Final' : '📋 Fase de Classificação'}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {match.status === 'live' && (
                                <span style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'var(--live-color)',
                                    boxShadow: '0 0 8px var(--live-color)'
                                }}></span>
                            )}
                            <span style={{ color: match.status === 'live' ? 'var(--live-color)' : 'var(--text-secondary)' }}>
                                {match.status === 'live' ? 'AO VIVO' : match.status === 'finished' ? 'FINALIZADO' : match.time}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {isSwimming ? (
                <div style={{ marginBottom: '20px' }}>
                    {match.status === 'finished' ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {swimmingPodium.map((podiumTeam, index) => (
                                <div
                                    key={`${podiumTeam.courseLabel}-${index}`}
                                    style={{
                                        minWidth: '140px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        background: 'rgba(255,255,255,0.04)',
                                        textAlign: 'center'
                                    }}
                                >
                                    {getCourseEmblem(podiumTeam.courseKey) && (
                                        <div style={{ height: '46px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img
                                                src={getCourseEmblem(podiumTeam.courseKey) || ''}
                                                alt={podiumTeam.courseLabel}
                                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : '#cd7f32' }}>
                                        {index + 1}º LUGAR
                                    </div>
                                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        {podiumTeam.athleteName ? podiumTeam.athleteName : 'Atleta não informado'}
                                        {podiumTeam.athleteTime ? ` (${podiumTeam.athleteTime})` : ''}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'white', marginTop: '4px', fontWeight: 700 }}>
                                        {podiumTeam.courseLabel}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'white', marginTop: '4px' }}>
                                        {podiumTeam.faculty}
                                    </div>
                                </div>
                            ))}
                            {swimmingPodium.length === 0 && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    Pódio ainda não disponível.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                                CURSOS PARTICIPANTES
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {swimmingParticipants.map((team) => (
                                    <div
                                        key={team.id}
                                        style={{
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {getCourseEmblem(team.course) && (
                                            <img
                                                src={getCourseEmblem(team.course) || ''}
                                                alt={team.name}
                                                style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                                            />
                                        )}
                                        <span
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)',
                                                background: 'rgba(255,255,255,0.04)',
                                                fontSize: '12px',
                                                fontWeight: 700
                                            }}
                                        >
                                            {team.name.split(' - ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <TeamDisplay team={match.teamA} />

                    <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="match-score" style={{ fontSize: '32px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span>{isBeachTennis ? beachSummary.setsA : match.scoreA}</span>
                            <span style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>X</span>
                            <span>{isBeachTennis ? beachSummary.setsB : match.scoreB}</span>
                        </div>
                        {isBeachTennis && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '-5px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700 }}>
                                    Games: {beachSummary.gamesA} - {beachSummary.gamesB}
                                </div>
                                {match.status === 'live' && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                        {(() => {
                                            const isTieBreak = (match.stage === "Fase de Classificação" && match.scoreA === 6 && match.scoreB === 6) ||
                                                               (match.stage === "Fase Final" && match.scoreA === 8 && match.scoreB === 8);
                                            return isTieBreak
                                                ? `Pontos: ${beachSummary.pointsA} - ${beachSummary.pointsB}`
                                                : `Pontos: ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsA, 3)]} - ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsB, 3)]}`;
                                        })()}
                                    </div>
                                )}
                                {beachSummary.setResults.length > 0 && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        Sets: {beachSummary.setResults.join(' | ')}
                                    </div>
                                )}
                            </div>
                        )}
                        {['Vôlei', 'Vôlei de Praia', 'Tênis de Mesa', 'Futevôlei'].includes(match.sport) && match.status === 'live' && (
                            <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700, marginTop: '-5px' }}>
                                {(() => {
                                    const lastSetWinEvent = [...(match.events || [])].reverse().find(e => e.type === 'set_win');
                                    const events = lastSetWinEvent
                                        ? match.events?.slice(match.events.indexOf(lastSetWinEvent) + 1) || []
                                        : match.events || [];
                                    const ptsA = events.filter(e => e.type === 'goal' && e.teamId === match.teamA.id).length;
                                    const ptsB = events.filter(e => e.type === 'goal' && e.teamId === match.teamB.id).length;
                                    return `${ptsA} - ${ptsB} (Pt)`;
                                })()}
                            </div>
                        )}
                        {penaltyResult && (
                            <div style={{ marginTop: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>
                                    🥅 PÊNALTIS
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>
                                    {penaltyResult.scoredA} x {penaltyResult.scoredB}
                                </div>
                                <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>
                                    {penaltyResult.winnerName} venceu
                                </div>
                            </div>
                        )}
                    </div>

                    <TeamDisplay team={match.teamB} />
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                paddingTop: '15px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    {match.date.split('-').reverse().join('-')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} />
                    {match.location.replace(/\s*\(.*?\)\s*$/, '').trim()}
                </div>
            </div>
        </div>
    );
};

export default MatchCard;
