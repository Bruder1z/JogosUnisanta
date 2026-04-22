import { type FC } from 'react';
import { X, Trophy } from 'lucide-react';
import { AVAILABLE_SPORTS, SPORT_ICONS } from '../../../data/mockData';
import './styles.css';

interface ModalitiesModalProps {
    onClose: () => void;
    onSelectSport: (sport: string) => void;
}

const ModalitiesModal: FC<ModalitiesModalProps> = ({ onClose, onSelectSport }) => {
    return (
        <div className="modalities-overlay">
            <div className="modalities-backdrop" onClick={onClose} />

            <div className="premium-card modalities-card">
                <div className="modalities-header">
                    <div className="modalities-header-title">
                        <Trophy size={20} color="var(--accent-color)" />
                        <h2>TODAS AS MODALIDADES</h2>
                    </div>
                    <button onClick={onClose} className="modalities-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="modalities-body">
                    <div className="modalities-grid">
                        {AVAILABLE_SPORTS.map((sport) => (
                            <div
                                key={sport}
                                onClick={() => {
                                    onSelectSport(sport);
                                    onClose();
                                }}
                                className="hover-glow modalities-item"
                            >
                                <div className="modalities-icon">
                                    {SPORT_ICONS[sport] || '🏆'}
                                </div>
                                <div className="modalities-name">
                                    {sport}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalitiesModal;