import { type FC } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { type Match, COURSE_EMBLEMS } from '../../data/mockData';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
    const isBeachTennis = match.sport === 'Beach Tennis';

    const getEventTimestamp = (eventId: string) => {
        const raw = eventId.split('_')[1] || eventId;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getBeachTennisSummary = () => {
        const initial = {
            setsA: 0,
            setsB: 0,
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
                currentGamePointsA = 0;
                currentGamePointsB = 0;
            }
        });

        return {
            setsA,
            setsB,
            pointsA: currentGamePointsA,
            pointsB: currentGamePointsB,
            setResults
        };
    };

    const beachSummary = getBeachTennisSummary();
    const BEACH_POINT_LABELS = ['0', '15', '30', '40'];

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
                                Games: {match.scoreA} - {match.scoreB}
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
                </div>

                <TeamDisplay team={match.teamB} />
            </div>

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
                    {match.location}
                </div>
            </div>
        </div>
    );
};

export default MatchCard;
