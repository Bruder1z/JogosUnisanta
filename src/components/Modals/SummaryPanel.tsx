import { type FC, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SummaryPanelProps {
    totalPoints?: number;
    exactScores?: number;
    winners?: number;
}

const SummaryPanel: FC<SummaryPanelProps> = ({ 
    totalPoints = 0, 
    exactScores = 0, 
    winners = 0 
}) => {
    const [day, setDay] = useState(1);

    const handlePrevDay = () => {
        if (day > 1) setDay(day - 1);
    };

    const handleNextDay = () => {
        setDay(day + 1);
    };

    return (
        <div style={{ marginBottom: '12px' }}>
            {/* Navigation Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '10px',
            }}>
                <button
                    onClick={handlePrevDay}
                    disabled={day === 1}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: day === 1 ? 'not-allowed' : 'pointer',
                        color: day === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        transition: 'color 0.2s',
                    }}
                >
                    <ChevronLeft size={20} />
                </button>

                <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    minWidth: '100px',
                    textAlign: 'center',
                }}>
                    DIA | {day}
                </div>

                <button
                    onClick={handleNextDay}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'white'; }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Statistics Card */}
            <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '12px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '18px',
                alignItems: 'center',
            }}>
                {/* Column 1: Total Points */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                }}>
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 1,
                    }}>
                        {totalPoints} PONTO{totalPoints !== 1 ? 'S' : ''}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                    }}>
                        PONTUAÇÃO TOTAL
                    </div>
                </div>

                {/* Column 2: Winners */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    paddingLeft: '18px',
                    paddingRight: '18px',
                }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                    }}>
                        VENCEDORES
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 900,
                        color: 'white',
                    }}>
                        {winners}
                    </div>
                </div>

                {/* Column 3: Exact Scores */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                    }}>
                        PLACARES EXATOS
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 900,
                        color: 'white',
                    }}>
                        {exactScores}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPanel;
