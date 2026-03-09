import { type FC } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { type Match, COURSE_EMBLEMS } from '../../data/mockData';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
    const getTeamEmblem = (teamName: string) => {
        const foundCourse = Object.keys(COURSE_EMBLEMS).find(courseKey =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );
        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
    };

    const TeamDisplay = ({ team }: { team: any }) => {
        const emblemUrl = getTeamEmblem(team.name);

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
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{team.name.split(' - ')[0]}</div>
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
            className="premium-card hover-glow"
            onClick={onClick}
            style={{
                padding: '20px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>{match.sport.toUpperCase()} - {match.category.toUpperCase()}</span>
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <TeamDisplay team={match.teamA} />

                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span>{match.scoreA}</span>
                        <span style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 600 }}>X</span>
                        <span>{match.scoreB}</span>
                    </div>
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
