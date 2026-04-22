import React from 'react';
import { X, Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { COURSE_EMBLEMS } from '../../../data/mockData';
import { useData } from '../../context/DataContext';
import './styles.css';

interface RankingModalProps {
    onClose: () => void;
}

const RankingModal: React.FC<RankingModalProps> = ({ onClose }) => {
    const { ranking } = useData();

    const getTeamEmblem = (teamName: string) => {
        const foundCourse = Object.keys(COURSE_EMBLEMS).find((courseKey) =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );

        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
    };

    const getTrendIcon = (points: number, index: number) => {
        if (points > 100) return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
        if (points === 0) return <span title="Estável"><Minus size={14} color="var(--text-secondary)" /></span>;
        if (index % 3 === 0) return <span title="Caiu"><TrendingDown size={14} color="#ef4444" /></span>;
        return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
    };

    return (
        <div className="ranking-modal-overlay">
            <div className="premium-card animate-in ranking-modal-card">
                <div className="ranking-modal-header">
                    <div className="ranking-modal-title-wrap">
                        <div className="ranking-modal-icon-box">
                            <Trophy size={24} color="white" />
                        </div>
                        <div>
                            <h2 className="ranking-modal-title">Ranking Geral</h2>
                            <p className="ranking-modal-subtitle">Classificação do 1º ao 45º lugar</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="ranking-modal-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="ranking-modal-content">
                    <table className="ranking-modal-table">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Atlética / Faculdade</th>
                                <th className="points">Pontos</th>
                                <th className="trend">Tendência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((item, index) => {
                                const courseName = item.course.split(' - ')[0];
                                const institution = item.course.split(' - ')[1];
                                const isTop3 = index < 3;
                                const highlightClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

                                const emblemUrl = item.course in COURSE_EMBLEMS
                                    ? `/emblemas/${COURSE_EMBLEMS[item.course]}`
                                    : getTeamEmblem(item.course);

                                return (
                                    <tr
                                        key={item.course}
                                        className={`ranking-modal-row ${isTop3 ? 'top3' : ''}`}
                                    >
                                        <td className="ranking-modal-position-cell">
                                            <div className={`ranking-modal-position-badge ${isTop3 ? `top3 ${highlightClass}` : ''}`}>
                                                {index + 1}º
                                            </div>
                                        </td>
                                        <td className="ranking-modal-team-cell">
                                            <div className="ranking-modal-team-wrap">
                                                <div className="ranking-modal-emblem-box">
                                                    {emblemUrl ? (
                                                        <img
                                                            src={emblemUrl}
                                                            alt={courseName}
                                                            className="ranking-modal-emblem-image"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = 'none';
                                                                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <span
                                                        className="ranking-modal-emblem-fallback"
                                                        style={{ display: emblemUrl ? 'none' : 'flex' }}
                                                    >
                                                        {courseName[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className={`ranking-modal-team-name ${isTop3 ? 'top3' : 'default'}`}>
                                                        {courseName}
                                                    </div>
                                                    <div className="ranking-modal-team-institution">{institution}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="ranking-modal-points-cell">
                                            <div className={`ranking-modal-points ${isTop3 ? `top3 ${highlightClass}` : ''}`}>
                                                {item.points}
                                            </div>
                                        </td>
                                        <td className="ranking-modal-trend-cell">
                                            <div className="ranking-modal-trend">
                                                {getTrendIcon(item.points, index)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="ranking-modal-footer">
                    <div className="ranking-modal-footer-text">
                        <Medal size={14} />
                        Ranking oficial dos 45 cursos participantes • Atualizado em {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankingModal;