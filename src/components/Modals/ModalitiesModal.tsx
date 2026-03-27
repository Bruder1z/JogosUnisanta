import { type FC } from 'react';
import { X, Trophy } from 'lucide-react';
import { AVAILABLE_SPORTS, SPORT_ICONS } from '../../data/mockData';

interface ModalitiesModalProps {
    onClose: () => void;
    onSelectSport: (sport: string) => void;
}

const ModalitiesModal: FC<ModalitiesModalProps> = ({ onClose, onSelectSport }) => {
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
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalFadeIn 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 25px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Trophy size={20} color="var(--accent-color)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>TODAS AS MODALIDADES</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
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
                </div>

                {/* Body - Grid of Modalities */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 25px',
                    background: 'var(--bg-primary)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px'
                    }}>
                        {AVAILABLE_SPORTS.map((sport) => (
                            <div
                                key={sport}
                                onClick={() => {
                                    onSelectSport(sport);
                                    onClose();
                                }}
                                className="hover-glow"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    padding: '15px 10px',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '100px'
                                }}
                            >
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                                    {SPORT_ICONS[sport] || '🏆'}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    lineHeight: '1.2'
                                }}>
                                    {sport}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ModalitiesModal;
