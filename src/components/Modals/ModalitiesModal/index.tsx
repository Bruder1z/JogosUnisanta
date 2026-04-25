import { type FC } from 'react';
import { Trophy, X } from 'lucide-react';
import { AVAILABLE_SPORTS, SPORT_ICONS } from '../../../data/mockData';
import ModalShell from '../ModalShell';
import './ModalitiesModal.css';
import type { ModalitiesModalProps } from './types';

const ModalitiesModal: FC<ModalitiesModalProps> = ({ onClose, onSelectSport }) => {
  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      overlayClassName="modalitiesOverlay"
      backdropClassName="modalitiesBackdrop"
      cardClassName="premium-card modalitiesCard"
      showCloseButton={false}
    >
      <div className="modalitiesHeader">
        <div className="modalitiesTitleWrap">
          <Trophy size={20} color="var(--accent-color)" />
          <h2 className="modalitiesTitle">TODAS AS MODALIDADES</h2>
        </div>
        <button onClick={onClose} className="modalitiesCloseButton" aria-label="Fechar modalidades">
          <X size={20} />
        </button>
      </div>

      <div className="modalitiesBody">
        <div className="modalitiesGrid">
          {AVAILABLE_SPORTS.map((sport) => (
            <div
              key={sport}
              onClick={() => {
                onSelectSport(sport);
                onClose();
              }}
              className="hover-glow modalitiesItem"
            >
              <div className="modalitiesIcon">{SPORT_ICONS[sport] || '🏆'}</div>
              <div className="modalitiesLabel">{sport}</div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
};

export default ModalitiesModal;