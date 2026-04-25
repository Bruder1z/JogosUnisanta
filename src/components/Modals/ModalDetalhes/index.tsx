import { type FC, useEffect, useState } from 'react';
import { Calendar, School, Trophy, Users, X } from 'lucide-react';
import ModalShell from '../ModalShell';
import './ModalDetalhes.css';
import type { ModalDetalhesProps } from './types';

const getRandomStats = () => ({
    age: Math.floor(Math.random() * (24 - 21 + 1)) + 21,
    athletes: Math.floor(Math.random() * (74 - 21 + 1)) + 21,
});

const ModalDetalhes: FC<ModalDetalhesProps> = ({ isOpen, onClose, courseData }) => {
    const [stats, setStats] = useState(getRandomStats());

    useEffect(() => {
        if (isOpen) {
            setStats(getRandomStats());
        }
    }, [isOpen]);

    if (!isOpen || !courseData) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            overlayClassName="modalDetalhesOverlay"
            backdropClassName="modalDetalhesBackdrop"
            cardClassName="modalDetalhesCard"
            showCloseButton={false}
        >
            <div className="modalDetalhesGradient" />

            <button onClick={onClose} className="modalDetalhesCloseButton" aria-label="Fechar detalhes">
                <X size={20} />
            </button>

            <div className="modalDetalhesContent">
                <div className="modalDetalhesTopSection">
                    <div className="modalDetalhesEmblemWrap">
                        {courseData.emblemUrl ? (
                            <img src={courseData.emblemUrl} alt={courseData.name} className="modalDetalhesEmblemImage" />
                        ) : (
                            <div className="modalDetalhesEmblemFallback">{courseData.icon}</div>
                        )}
                    </div>

                    <h2 className="modalDetalhesTitle">{courseData.name}</h2>

                    <div className="modalDetalhesBadge">
                        <Trophy size={16} />
                        Participante dos Jogos Unisanta
                    </div>
                </div>

                <div className="modalDetalhesDivider" />

                <div className="modalDetalhesStatsGrid">
                    <div className="modalDetalhesStatColumn">
                        <div className="modalDetalhesStatLabel">
                            <School size={16} />
                            Local
                        </div>
                        <div>
                            <div className="modalDetalhesStatValue">Unisanta</div>
                            <div className="modalDetalhesSubtext">Santos - Brasil</div>
                        </div>
                    </div>

                    <div className="modalDetalhesStatColumn">
                        <div className="modalDetalhesStatLabel">
                            <Calendar size={16} />
                            Idade
                        </div>
                        <div>
                            <div className="modalDetalhesStatValue modalDetalhesStatValueLarge">
                                {stats.age} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>anos</span>
                            </div>
                            <div className="modalDetalhesStatNote">Média de idade dos atletas</div>
                        </div>
                    </div>

                    <div className="modalDetalhesStatColumn">
                        <div className="modalDetalhesStatLabel">
                            <Users size={16} />
                            Participantes
                        </div>
                        <div>
                            <div className="modalDetalhesStatValue modalDetalhesStatValueLarge modalDetalhesStatValueAccent">
                                {stats.athletes}
                            </div>
                            <div className="modalDetalhesStatNote">Alunos Participantes</div>
                        </div>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
};

export default ModalDetalhes;