import React from 'react';
import { X, Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { COURSE_EMBLEMS } from '../../data/mockData';
import { useData } from '../context/DataContext';

interface RankingModalProps {
    onClose: () => void;
}

const RankingModal: React.FC<RankingModalProps> = ({ onClose }) => {
    const { ranking } = useData();
    const getTeamEmblem = (teamName: string) => {
        const foundCourse = Object.keys(COURSE_EMBLEMS).find(courseKey =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );
        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
    };

    const getTrendIcon = (points: number, index: number) => {
        // Mock trend logic based on points or random for visual
        if (points > 100) return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
        if (points === 0) return <span title="Estável"><Minus size={14} color="var(--text-secondary)" /></span>;
        if (index % 3 === 0) return <span title="Caiu"><TrendingDown size={14} color="#ef4444" /></span>;
        return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div className="premium-card animate-in" style={{
                width: '100%',
                maxWidth: '800px', // Wider for trend column
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '25px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '12px',
                            background: 'var(--accent-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(255, 46, 46, 0.3)'
                        }}>
                            <Trophy size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Ranking Geral</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Classificação do 1º ao 45º lugar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-hover)',
                            border: 'none',
                            color: 'white',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    overflowY: 'auto',
                    padding: '0',
                    flex: 1,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--accent-color) transparent'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '15px 20px' }}>Pos</th>
                                <th style={{ padding: '15px 20px' }}>Atlética / Faculdade</th>
                                <th style={{ padding: '15px 20px', textAlign: 'center' }}>Pontos</th>
                                <th style={{ padding: '15px 20px', textAlign: 'center' }}>Tendência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((item, index) => {
                                const courseName = item.course.split(' - ')[0];
                                const institution = item.course.split(' - ')[1];
                                // const icon = COURSE_ICONS[courseName] || '🏆';

                                const isTop3 = index < 3;
                                const highlightColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : null;

                                return (
                                    <tr
                                        key={item.course}
                                        style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: isTop3 ? `linear-gradient(90deg, ${highlightColor}15 0%, transparent 100%)` : 'transparent',
                                            transition: 'background 0.2s',
                                            position: 'relative'
                                        }}
                                        className="hover-glow-subtle"
                                    >
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{
                                                width: isTop3 ? '32px' : '28px',
                                                height: isTop3 ? '32px' : '28px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: isTop3 ? '15px' : '13px',
                                                fontWeight: 800,
                                                background: highlightColor || 'var(--bg-hover)',
                                                color: isTop3 ? '#000' : 'var(--text-secondary)',
                                                boxShadow: isTop3 ? `0 0 15px ${highlightColor}40` : 'none',
                                                border: isTop3 ? `1px solid ${highlightColor}` : 'none'
                                            }}>
                                                {index + 1}º
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '8px',
                                                    padding: '4px'
                                                }}>
                                                {(() => {
                                                        const emblemUrl = item.course in COURSE_EMBLEMS
                                                            ? `/emblemas/${COURSE_EMBLEMS[item.course]}`
                                                            : getTeamEmblem(item.course);
                                                        if (emblemUrl) {
                                                            return (
                                                                <>
                                                                    <img
                                                                        src={emblemUrl}
                                                                        alt={courseName}
                                                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (fallback) fallback.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <span style={{
                                                                        display: 'none',
                                                                        width: '28px',
                                                                        height: '28px',
                                                                        borderRadius: '8px',
                                                                        background: 'rgba(255,255,255,0.08)',
                                                                        backdropFilter: 'blur(8px)',
                                                                        border: '1px solid rgba(255,255,255,0.12)',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '13px',
                                                                        fontWeight: 800,
                                                                        color: 'var(--accent-color)'
                                                                    }}>
                                                                        {courseName[0]}
                                                                    </span>
                                                                </>
                                                            );
                                                        }
                                                        return (
                                                            <span style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(255,255,255,0.08)',
                                                                backdropFilter: 'blur(8px)',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '13px',
                                                                fontWeight: 800,
                                                                color: 'var(--accent-color)'
                                                            }}>
                                                                {courseName[0]}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: 700, color: isTop3 ? 'white' : 'var(--text-primary)' }}>{courseName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{institution}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                color: isTop3 ? (highlightColor as string) : 'white',
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {item.points}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}>
                                                {getTrendIcon(item.points, index)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Medal size={14} />
                        Ranking oficial dos 45 cursos participantes • Atualizado em {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankingModal;
