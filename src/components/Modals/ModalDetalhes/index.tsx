import { type FC, useEffect, useState } from 'react';
import { X, Trophy, Users, Calendar, School } from 'lucide-react';
import './styles.css';

interface ModalDetalhesProps {
    isOpen: boolean;
    onClose: () => void;
    courseData: {
        name: string;
        university: string;
        icon: React.ReactNode;
        emblemUrl: string | null;
    } | null;
}

const ModalDetalhes: FC<ModalDetalhesProps> = ({ isOpen, onClose, courseData }) => {
    const [stats, setStats] = useState({ age: 22, athletes: 150 });

    useEffect(() => {
        if (isOpen) {
            setStats({
                age: Math.floor(Math.random() * (24 - 21 + 1)) + 21,
                athletes: Math.floor(Math.random() * (74 - 21 + 1)) + 21,
            });
        }
    }, [isOpen]);

    if (!isOpen || !courseData) return null;

    return (
        <div className="modal-detalhes-overlay" onClick={onClose}>
            <div className="modal-detalhes-card animate-in" onClick={(event) => event.stopPropagation()}>
                <div className="modal-detalhes-header-gradient" />

                <button onClick={onClose} className="modal-detalhes-close-btn">
                    <X size={20} />
                </button>

                <div className="modal-detalhes-content">
                    <div className="modal-detalhes-top">
                        <div className="modal-detalhes-emblem">
                            {courseData.emblemUrl ? (
                                <img
                                    src={courseData.emblemUrl}
                                    alt="Mascote"
                                    className="modal-detalhes-emblem-image"
                                />
                            ) : (
                                <div className="modal-detalhes-icon">
                                    {courseData.icon}
                                </div>
                            )}
                        </div>

                        <h2 className="modal-detalhes-title">{courseData.name}</h2>

                        <div className="modal-detalhes-badge">
                            <Trophy size={16} />
                            Participante dos Jogos Unisanta
                        </div>
                    </div>

                    <div className="modal-detalhes-divider" />

                    <div className="modal-detalhes-stats">
                        <div className="modal-detalhes-stat">
                            <div className="modal-detalhes-stat-label">
                                <School size={16} />
                                Local
                            </div>
                            <div>
                                <div className="modal-detalhes-stat-value">Unisanta</div>
                                <div className="modal-detalhes-stat-subvalue">Santos - Brasil</div>
                            </div>
                        </div>

                        <div className="modal-detalhes-stat">
                            <div className="modal-detalhes-stat-label">
                                <Calendar size={16} />
                                Idade
                            </div>
                            <div>
                                <div className="modal-detalhes-stat-number">
                                    {stats.age} <span className="modal-detalhes-stat-unit">anos</span>
                                </div>
                                <div className="modal-detalhes-stat-subvalue">Média de idade dos atletas</div>
                            </div>
                        </div>

                        <div className="modal-detalhes-stat">
                            <div className="modal-detalhes-stat-label">
                                <Users size={16} />
                                Participantes
                            </div>
                            <div>
                                <div className="modal-detalhes-stat-number accent">{stats.athletes}</div>
                                <div className="modal-detalhes-stat-subvalue">Alunos Participantes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalhes;