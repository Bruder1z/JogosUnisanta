import React from 'react';
import { X, Trophy, Medal } from 'lucide-react';
import { COURSE_EMBLEMS, mockRanking } from '../../data/mockData';
import { useData } from '../context/DataContext';

interface RankingModalProps {
    onClose: () => void;
    useOfficialRanking?: boolean;
}

const RankingModal: React.FC<RankingModalProps> = ({ onClose, useOfficialRanking }) => {
    const { ranking: liveRanking, customEmblems } = useData();
    const ranking = useOfficialRanking ? mockRanking : liveRanking;
    const getTeamEmblem = (teamName: string) => {
        // 1. Priorizar emblema customizado
        if (customEmblems[teamName]) {
            return customEmblems[teamName];
        }
        
        // 2. Tentar emblema padrão
        if (teamName in COURSE_EMBLEMS) {
            return `/emblemas/${COURSE_EMBLEMS[teamName]}`;
        }
        
        // 3. Buscar por match parcial
        const foundCourse = Object.keys(COURSE_EMBLEMS).find(courseKey =>
            courseKey.toLowerCase().includes(teamName.toLowerCase())
        );
        return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
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
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-hover)',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Fechar"
                    >
                        <X size={16} />
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
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        textAlign: 'left',
                        tableLayout: 'fixed' // Force columns to respect widths
                    }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '12px 8px', width: '45px', textAlign: 'center' }}>Pos</th>
                                <th style={{ padding: '12px 8px' }}>Curso</th>
                                <th style={{ padding: '12px 8px', width: '65px', textAlign: 'center' }}>Pontos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((item, index) => {
                                const courseName = item.course.split(' - ')[0];
                                const institution = item.course.split(' - ')[1] || '';
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
                                        <td style={{ padding: '10px 5px', width: '45px', textAlign: 'center' }}>
                                            <div style={{
                                                width: isTop3 ? '30px' : '26px',
                                                height: isTop3 ? '30px' : '26px',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: isTop3 ? '14px' : '12px',
                                                fontWeight: 800,
                                                background: highlightColor || 'var(--bg-hover)',
                                                color: isTop3 ? '#000' : 'var(--text-secondary)',
                                                boxShadow: isTop3 ? `0 0 10px ${highlightColor}40` : 'none',
                                                border: isTop3 ? `1px solid ${highlightColor}` : 'none',
                                                margin: '0 auto'
                                            }}>
                                                {index + 1}º
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', minWidth: 0 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '6px',
                                                    padding: '4px',
                                                    flexShrink: 0
                                                }}>
                                                {(() => {
                                                        const emblemUrl = getTeamEmblem(item.course);
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
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '6px',
                                                                        background: 'rgba(255,255,255,0.08)',
                                                                        backdropFilter: 'blur(8px)',
                                                                        border: '1px solid rgba(255,255,255,0.12)',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '11px',
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
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(255,255,255,0.08)',
                                                                backdropFilter: 'blur(8px)',
                                                                border: '1px solid rgba(255,255,255,0.12)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                color: 'var(--accent-color)'
                                                            }}>
                                                                {courseName[0]}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div style={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: 700, 
                                                        color: isTop3 ? 'white' : 'var(--text-primary)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        lineHeight: '1.2'
                                                    }}>{courseName}</div>
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        color: 'var(--text-secondary)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        marginTop: '1px'
                                                    }}>{institution}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 5px', textAlign: 'center', width: '65px' }}>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: 900,
                                                color: isTop3 ? (highlightColor as string) : 'white',
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {item.points}
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
