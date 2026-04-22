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
        <div className="summary-panel-wrapper">
            <div className="summary-panel-nav">
                <button
                    onClick={handlePrevDay}
                    disabled={day === 1}
                    className="summary-panel-nav-btn"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="summary-panel-day">DIA | {day}</div>

                <button
                    onClick={handleNextDay}
                    className="summary-panel-nav-btn"
                    onMouseEnter={(event) => {
                        event.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.color = 'white';
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="summary-panel-card">
                <div className="summary-panel-col left">
                    <div className="summary-panel-total-points">
                        {totalPoints} PONTO{totalPoints !== 1 ? 'S' : ''}
                    </div>
                    <div className="summary-panel-label">PONTUAÇÃO TOTAL</div>
                </div>

                <div className="summary-panel-col center">
                    <div className="summary-panel-label light">VENCEDORES</div>
                    <div className="summary-panel-value">{winners}</div>
                </div>

                <div className="summary-panel-col right">
                    <div className="summary-panel-label light">PLACARES EXATOS</div>
                    <div className="summary-panel-value">{exactScores}</div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPanel;
