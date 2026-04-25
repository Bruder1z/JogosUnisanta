import { type FC, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './SummaryPanel.css';
import type { SummaryPanelProps } from './types';

const SummaryPanel: FC<SummaryPanelProps> = ({
  totalPoints = 0,
  exactScores = 0,
  winners = 0,
}) => {
  const [day, setDay] = useState(1);

  const handlePrevDay = () => {
    if (day > 1) setDay(day - 1);
  };

  const handleNextDay = () => {
    setDay(day + 1);
  };

  return (
    <div className="summaryPanel">
      <div className="summaryPanelNav">
        <button
          onClick={handlePrevDay}
          disabled={day === 1}
          className={`summaryPanelNavButton ${day === 1 ? 'summaryPanelNavButtonDisabled' : 'summaryPanelNavButtonEnabled'}`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="summaryPanelDay">DIA | {day}</div>

        <button
          onClick={handleNextDay}
          className="summaryPanelNavButton summaryPanelNavButtonEnabled"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="summaryPanelStats">
        <div className="summaryPanelColumn summaryPanelColumnLeft">
          <div className="summaryPanelValue">
            {totalPoints} PONTO{totalPoints !== 1 ? 'S' : ''}
          </div>
          <div className="summaryPanelLabel summaryPanelLabelMuted">
            PONTUAÇÃO TOTAL
          </div>
        </div>

        <div className="summaryPanelColumn summaryPanelColumnCenter">
          <div className="summaryPanelLabel">VENCEDORES</div>
          <div className="summaryPanelValue summaryPanelValueSm">{winners}</div>
        </div>

        <div className="summaryPanelColumn summaryPanelColumnRight">
          <div className="summaryPanelLabel">PLACARES EXATOS</div>
          <div className="summaryPanelValue summaryPanelValueSm">{exactScores}</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;