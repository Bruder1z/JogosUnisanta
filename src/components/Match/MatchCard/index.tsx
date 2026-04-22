import { type FC } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { type Match, COURSE_EMBLEMS } from '../../../data/mockData';
import './styles.css';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
    const isBeachTennis = match.sport === 'Beach Tennis';
    const isSwimming = match.sport === 'Natação';
    const isPenaltyShootoutSport = match.sport === 'Futsal' || match.sport === 'Futebol Society' || match.sport === 'Futebol X1';

    const getEventTimestamp = (eventId: string) => {
        const raw = eventId.split('_')[1] || eventId;
        const parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const penaltyResult = (() => {
        if (!isPenaltyShootoutSport || match.status !== 'finished') return null;

        const startIdx = (match.events || []).findIndex(
            (event) => event.type === 'halftime' && event.description?.startsWith('⚽ Início da Disputa de Pênaltis')
        );

        if (startIdx === -1) return null;

        const shootoutEvents = (match.events || [])
            .slice(startIdx + 1)
            .filter((event) => event.type === 'penalty_scored' || event.type === 'penalty_missed');

        if (shootoutEvents.length === 0) return null;

        const scoredA = shootoutEvents.filter((event) => event.type === 'penalty_scored' && event.teamId === match.teamA.id).length;
        const scoredB = shootoutEvents.filter((event) => event.type === 'penalty_scored' && event.teamId === match.teamB.id).length;
        const winnerName = scoredA > scoredB ? match.teamA.name.split(' - ')[0] : match.teamB.name.split(' - ')[0];

        return { scoredA, scoredB, winnerName };
    })();

    const getBeachTennisSummary = () => {
        const initial = {
            setsA: 0,
            setsB: 0,
            gamesA: 0,
            gamesB: 0,
            pointsA: 0,
            pointsB: 0,
            setResults: [] as string[],
        };

        if (!isBeachTennis) return initial;

        const events = [...(match.events || [])].sort(
            (left, right) => (left.minute - right.minute) || (getEventTimestamp(left.id) - getEventTimestamp(right.id))
        );

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
                const gamesA = segmentEvents.filter((item) => item.type === 'set_win' && item.description?.startsWith('Game para ') && item.teamId === match.teamA.id).length;
                const gamesB = segmentEvents.filter((item) => item.type === 'set_win' && item.description?.startsWith('Game para ') && item.teamId === match.teamB.id).length;
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
            setResults,
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
                    athleteTime,
                };
            })
            .sort((left, right) => left.rank - right.rank)
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

    const getTeamEmblem = (team: Match['teamA']) => {
        if ((team as any).logo) return (team as any).logo;
        if (team.course && team.course in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[team.course]}`;
        }

        const strictName = team.name.split(' - ')[0];
        if (strictName in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[strictName]}`;
        }
        return null;
    };

    const TeamDisplay = ({ team }: { team: Match['teamA'] }) => {
        const emblemUrl = getTeamEmblem(team);

        return (
            <div className="match-card-team">
                <div className="match-card-team-logo-wrap">
                    {emblemUrl ? (
                        <img
                            src={emblemUrl}
                            alt={team.name}
                            className="match-card-team-logo"
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'block';
                            }}
                        />
                    ) : null}
                    <div className="match-card-team-logo-fallback" style={{ display: emblemUrl ? 'none' : 'block' }}>
                        {team.logo}
                    </div>
                </div>
                <div className="match-team-name">{team.name.split(' - ')[0]}</div>
                <div className="match-card-team-institution">{team.name.split(' - ')[1]}</div>
                {team.faculty && (
                    <div className="match-card-team-faculty">{team.faculty}</div>
                )}
            </div>
        );
    };

    const phaseSports = ['Vôlei', 'Vôlei de Praia', 'Futevôlei', 'Beach Tennis'];
    const showPhase = phaseSports.includes(match.sport) && match.stage;

    return (
        <div className="premium-card hover-glow match-card-wrapper" onClick={onClick}>
            <div className="match-card-header">
                <div className="match-card-header-left">
                    <span>{match.sport.toUpperCase()} - {match.category.toUpperCase()}</span>
                    {showPhase && (
                        <span className={`match-card-stage ${match.stage === 'Fase Final' ? 'final' : 'classification'}`}>
                            {match.stage === 'Fase Final' ? '🏆 Fase Final' : '📋 Fase de Classificação'}
                        </span>
                    )}
                </div>
                <div className="match-card-header-right">
                    {match.status === 'live' && <span className="match-card-live-dot" />}
                    <span className={match.status === 'live' ? 'match-card-status-live' : 'match-card-status-other'}>
                        {match.status === 'live' ? 'AO VIVO' : match.status === 'finished' ? 'FINALIZADO' : match.time}
                    </span>
                </div>
            </div>

            {isSwimming ? (
                <div className="match-card-swimming-wrapper">
                    {match.status === 'finished' ? (
                        <div className="match-card-swimming-grid">
                            {swimmingPodium.map((podiumTeam, index) => (
                                <div key={`${podiumTeam.courseLabel}-${index}`} className="match-card-swimming-podium">
                                    {getCourseEmblem(podiumTeam.courseKey) && (
                                        <div className="match-card-swimming-podium-emblem">
                                            <img
                                                src={getCourseEmblem(podiumTeam.courseKey) || ''}
                                                alt={podiumTeam.courseLabel}
                                            />
                                        </div>
                                    )}
                                    <div className={`match-card-swimming-position ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                                        {index + 1}º LUGAR
                                    </div>
                                    <div className="match-card-swimming-athlete">
                                        {podiumTeam.athleteName ? podiumTeam.athleteName : 'Atleta não informado'}
                                        {podiumTeam.athleteTime ? ` (${podiumTeam.athleteTime})` : ''}
                                    </div>
                                    <div className="match-card-swimming-course">{podiumTeam.courseLabel}</div>
                                    <div className="match-card-swimming-faculty">{podiumTeam.faculty}</div>
                                </div>
                            ))}
                            {swimmingPodium.length === 0 && (
                                <div className="match-card-swimming-empty">Pódio ainda não disponível.</div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="match-card-participants-title">CURSOS PARTICIPANTES</div>
                            <div className="match-card-participants-grid">
                                {swimmingParticipants.map((team) => (
                                    <div key={team.id} className="match-card-participant">
                                        {getCourseEmblem(team.course) && (
                                            <img
                                                src={getCourseEmblem(team.course) || ''}
                                                alt={team.name}
                                                className="match-card-participant-logo"
                                            />
                                        )}
                                        <span className="match-card-participant-name">
                                            {team.name.split(' - ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="match-card-teams">
                    <TeamDisplay team={match.teamA} />

                    <div className="match-card-score-wrap">
                        <div className="match-score">
                            <span>{isBeachTennis ? beachSummary.setsA : match.scoreA}</span>
                            <span className="match-score-separator">X</span>
                            <span>{isBeachTennis ? beachSummary.setsB : match.scoreB}</span>
                        </div>

                        {isBeachTennis && (
                            <div className="match-card-beach-wrap">
                                <div className="match-card-beach-games">Games: {beachSummary.gamesA} - {beachSummary.gamesB}</div>
                                {match.status === 'live' && (
                                    <div className="match-card-beach-points">
                                        {(() => {
                                            const isTieBreak = (match.stage === 'Fase de Classificação' && match.scoreA === 6 && match.scoreB === 6)
                                                || (match.stage === 'Fase Final' && match.scoreA === 8 && match.scoreB === 8);

                                            return isTieBreak
                                                ? `Pontos: ${beachSummary.pointsA} - ${beachSummary.pointsB}`
                                                : `Pontos: ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsA, 3)]} - ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsB, 3)]}`;
                                        })()}
                                    </div>
                                )}
                                {beachSummary.setResults.length > 0 && (
                                    <div className="match-card-beach-sets">Sets: {beachSummary.setResults.join(' | ')}</div>
                                )}
                            </div>
                        )}

                        {['Vôlei', 'Vôlei de Praia', 'Tênis de Mesa', 'Futevôlei'].includes(match.sport) && match.status === 'live' && (
                            <div className="match-card-beach-points-label">
                                {(() => {
                                    const lastSetWinEvent = [...(match.events || [])].reverse().find((event) => event.type === 'set_win');
                                    const events = lastSetWinEvent
                                        ? match.events?.slice(match.events.indexOf(lastSetWinEvent) + 1) || []
                                        : match.events || [];
                                    const ptsA = events.filter((event) => event.type === 'goal' && event.teamId === match.teamA.id).length;
                                    const ptsB = events.filter((event) => event.type === 'goal' && event.teamId === match.teamB.id).length;
                                    return `${ptsA} - ${ptsB} (Pt)`;
                                })()}
                            </div>
                        )}

                        {penaltyResult && (
                            <div className="match-card-penalty">
                                <div className="match-card-penalty-title">🥅 PÊNALTIS</div>
                                <div className="match-card-penalty-score">{penaltyResult.scoredA} x {penaltyResult.scoredB}</div>
                                <div className="match-card-penalty-winner">{penaltyResult.winnerName} venceu</div>
                            </div>
                        )}
                    </div>

                    <TeamDisplay team={match.teamB} />
                </div>
            )}

            <div className="match-card-footer">
                <div className="match-card-footer-item">
                    <Clock size={14} />
                    {match.date.split('-').reverse().join('-')}
                </div>
                <div className="match-card-footer-item">
                    <MapPin size={14} />
                    {match.location.replace(/\s*\(.*?\)\s*$/, '').trim()}
                </div>
            </div>
        </div>
    );
};

export default MatchCard;