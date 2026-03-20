import { type FC } from 'react';
import { Trophy } from 'lucide-react';

interface LigaCardProps {
    name: string;
    description?: string;
    participantsCount?: number;
    isAdmin?: boolean;
    type?: 'global' | 'course' | 'private';
    onClick: () => void;
}

const LigaCard: FC<LigaCardProps> = ({ name, description, participantsCount, isAdmin, type = 'private', onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="premium-card hover-glow"
            style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                height: '100%'
            }}
        >
            {isAdmin && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    zIndex: 2
                }}>
                    Admin
                </div>
            )}

            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: type === 'global' ? '#ffd70015' : type === 'course' ? '#dc262615' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${type === 'global' ? '#ffd70030' : type === 'course' ? '#dc262630' : 'rgba(255,255,255,0.1)'}`
            }}>
                <Trophy size={20} color={type === 'global' ? '#ffd700' : type === 'course' ? '#dc2626' : 'white'} />
            </div>

            <div style={{ flex: 1 }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                }}>
                    {name}
                </h3>
                <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {description || 'Sem descrição.'}
                </p>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: '4px'
            }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {type === 'global' ? 'Todos os usuários' : type === 'course' ? 'Todos do curso' : `${participantsCount} participantes`}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Ver Ranking →
                </span>
            </div>
        </div>
    );
};

export default LigaCard;
