import { type FC, useState } from 'react';
import LeagueFormModal from '../Modals/LeagueFormModal';

const LigaCard: FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div 
                className="premium-card"
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    width: '320px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.3s ease',
                }}
            >
                <h3 style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    letterSpacing: '1px',
                }}>
                    LIGA CLÁSSICA
                </h3>

                <p style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontWeight: 500,
                }}>
                    Dispute o primeiro lugar do ranking de pontos corridos com seus amigos!
                </p>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '16px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    <img
                        src="/images/logo-liga.png"
                        alt="Logo Liga Clássica"
                        style={{
                            maxWidth: '180px',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--accent-color)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 12px rgba(227, 6, 19, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(227, 6, 19, 0.4)';
                        e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(227, 6, 19, 0.3)';
                        e.currentTarget.style.filter = 'brightness(1)';
                    }}
                >
                    CRIAR LIGA
                </button>
            </div>

            <LeagueFormModal 
                aberto={isModalOpen} 
                setAberto={setIsModalOpen} 
            />
        </>
    );
};

export default LigaCard;
