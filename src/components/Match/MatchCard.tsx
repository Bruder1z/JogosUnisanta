import { type FC } from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { Match } from '../../data/mockData';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
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
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{match.teamA.logo}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{match.teamA.name.split(' - ')[0]}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{match.teamA.name.split(' - ')[1]}</div>
                </div>

                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, display: 'flex', gap: '15px' }}>
                        <span>{match.scoreA}</span>
                        <span style={{ color: 'var(--border-color)' }}>-</span>
                        <span>{match.scoreB}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '5px' }}>VS</div>
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{match.teamB.logo}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{match.teamB.name.split(' - ')[0]}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{match.teamB.name.split(' - ')[1]}</div>
                </div>
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
                    {match.date}
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
