import type { FC } from 'react';

const LigaCard: FC = () => {
    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
            width: '320px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
        }}>
            <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#000000',
                textTransform: 'uppercase',
                textAlign: 'center',
            }}>
                LIGA CLÁSSICA
            </h3>

            <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: '#777777',
                textAlign: 'center',
                lineHeight: 1.4,
            }}>
                Dispute o primeiro lugar do ranking de pontos corridos com seus amigos!
            </p>

            <img
                src="/images/logo-liga.png"
                alt="Logo Liga Clássica"
                style={{
                    maxWidth: '200px',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    margin: '8px 0',
                }}
            />

            <button
                style={{
                    width: '100%',
                    backgroundColor: '#dc2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
                CRIAR LIGA
            </button>
        </div>
    );
};

export default LigaCard;
