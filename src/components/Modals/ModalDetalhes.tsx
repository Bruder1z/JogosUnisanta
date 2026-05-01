import { type FC, useEffect, useState } from 'react';
import { X, Trophy, Users, Calendar, School } from 'lucide-react';

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
                athletes: Math.floor(Math.random() * (74 - 21 + 1)) + 21
            });
        }
    }, [isOpen]);

    if (!isOpen || !courseData) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#121212',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '650px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>

                {/* Header Gradient */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '120px',
                    background: 'linear-gradient(to bottom, rgba(227, 6, 19, 0.1), transparent)',
                    pointerEvents: 'none'
                }} />

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ padding: '40px' }}>

                    {/* Top Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {/* Emblem */}
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden'
                        }}>
                            {courseData.emblemUrl ? (
                                <img
                                    src={courseData.emblemUrl}
                                    alt="Mascote"
                                    style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ color: '#000', fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {courseData.icon}
                                </div>
                            )}
                        </div>

                        {/* Identification */}
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: '8px',
                            lineHeight: 1.2
                        }}>
                            {courseData.name}
                        </h2>

                        {/* Subtitle */}
                        <div className="participant-badge" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(227, 6, 19, 0.15)',
                            color: 'var(--accent-color)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                        }}>
                            <Trophy size={16} style={{ flexShrink: 0 }} />
                            <span style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                Participante dos Jogos Unisanta
                            </span>
                        </div>
                    </div>

                    {/* Horizontal Divider */}
                    <div style={{
                        height: '1px',
                        backgroundColor: 'var(--border-color)',
                        margin: '35px 0'
                    }} />

                    {/* Bottom Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '20px'
                    }}>
                        {/* Col 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                <School size={16} />
                                Local
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {courseData.university}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {courseData.university.toLowerCase().includes('unaerp') || 
                                     courseData.university.toLowerCase().includes('unoeste') 
                                        ? 'Guarujá - Brasil' 
                                        : 'Santos - Brasil'}
                                </div>
                            </div>
                        </div>

                        {/* Col 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                <Calendar size={16} />
                                Idade
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                                    {stats.age} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>anos</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    Média de idade dos atletas
                                </div>
                            </div>
                        </div>

                        {/* Col 3 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                <Users size={16} />
                                Participantes
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-color)', lineHeight: 1 }}>
                                    {stats.athletes}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    Alunos Participantes
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                /* Mobile adjustments for participant badge */
                @media (max-width: 480px) {
                    .participant-badge {
                        font-size: 12px !important;
                        padding: 6px 12px !important;
                        gap: 6px !important;
                    }
                    
                    .participant-badge svg {
                        width: 14px !important;
                        height: 14px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ModalDetalhes;
