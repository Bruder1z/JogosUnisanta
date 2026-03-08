import { type FC, useState, useMemo } from 'react';
import { X, Trophy, Save, CheckCircle, Zap, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockMatches } from '../../data/mockData';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ onClose }) => {
    const { user, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'settings' | 'points'>('settings');

    // Settings state
    const [name, setName] = useState(user?.name || '');
    const [preferredCourse, setPreferredCourse] = useState(user?.preferredCourse || '');
    const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Calculate Points
    const simulatorStats = useMemo(() => {
        try {
            const stored = localStorage.getItem('jogos-unisanta-predictions');
            if (!stored) return { totalPoints: 0, correctGuesses: 0, totalGuesses: 0 };

            const predictions = JSON.parse(stored);
            let points = 0;
            let correct = 0;
            let total = 0;

            mockMatches.forEach(match => {
                if (match.status === 'finished') {
                    const pred = predictions[match.id];
                    if (pred && pred.scoreA !== '' && pred.scoreB !== '') {
                        total++;
                        // For each correct score, 1pt
                        if (Number(pred.scoreA) === match.scoreA && Number(pred.scoreB) === match.scoreB) {
                            points += 1;
                            correct += 1;
                        }
                    }
                }
            });

            return { totalPoints: points, correctGuesses: correct, totalGuesses: total };
        } catch {
            return { totalPoints: 0, correctGuesses: 0, totalGuesses: 0 };
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await updateUser({
            name,
            preferredCourse,
            favoriteTeam
        });

        setIsSaving(false);
        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Sidebar Panel */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '400px',
                background: '#1a1a1a', /* 365Scores dark shade */
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '-4px 0 25px rgba(0,0,0,0.5)',
                borderLeft: '1px solid #333'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    background: '#222',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <UserIcon size={20} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>{user?.name}</h2>
                            <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333', background: '#222' }}>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            flex: 1,
                            padding: '15px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'settings' ? '2px solid #e30613' : '2px solid transparent',
                            color: activeTab === 'settings' ? '#fff' : '#888',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        CONFIGURAÇÕES
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        style={{
                            flex: 1,
                            padding: '15px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'points' ? '2px solid #e30613' : '2px solid transparent',
                            color: activeTab === 'points' ? '#fff' : '#888',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        PONTUAÇÃO <Trophy size={14} color={activeTab === 'points' ? '#ffd700' : '#888'} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {activeTab === 'settings' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        background: '#2a2a2a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '12px 16px',
                                        color: '#fff',
                                        outline: 'none',
                                        fontSize: '14px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#e30613'}
                                    onBlur={e => e.target.style.borderColor = '#333'}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Curso / Faculdade</label>
                                <input
                                    type="text"
                                    value={preferredCourse}
                                    onChange={(e) => setPreferredCourse(e.target.value)}
                                    placeholder="Ex: Engenharia"
                                    style={{
                                        background: '#2a2a2a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '12px 16px',
                                        color: '#fff',
                                        outline: 'none',
                                        fontSize: '14px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#e30613'}
                                    onBlur={e => e.target.style.borderColor = '#333'}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Time / Atlética</label>
                                <input
                                    type="text"
                                    value={favoriteTeam}
                                    onChange={(e) => setFavoriteTeam(e.target.value)}
                                    placeholder="Ex: Fefesp"
                                    style={{
                                        background: '#2a2a2a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '12px 16px',
                                        color: '#fff',
                                        outline: 'none',
                                        fontSize: '14px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#e30613'}
                                    onBlur={e => e.target.style.borderColor = '#333'}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    marginTop: '10px',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    background: saveSuccess ? '#00c853' : '#e30613',
                                    color: '#fff',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    boxShadow: saveSuccess ? 'none' : '0 4px 12px rgba(227, 6, 19, 0.3)'
                                }}
                            >
                                {isSaving ? 'SALVANDO...' : saveSuccess ? (
                                    <><CheckCircle size={16} /> SALVO!</>
                                ) : (
                                    <><Save size={16} /> SALVAR ALTERAÇÕES</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'rgba(255, 215, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#ffd700'
                            }}>
                                <Trophy size={32} />
                            </div>

                            <h3 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 4px', color: '#fff' }}>
                                {simulatorStats.totalPoints} <span style={{ fontSize: '16px', color: '#888', fontWeight: 600 }}>PTS</span>
                            </h3>
                            <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 30px' }}>
                                Acertos exatos no Simulador
                            </p>

                            <div style={{
                                background: '#222',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '15px'
                            }}>
                                <div style={{ textAlign: 'center', borderRight: '1px solid #333' }}>
                                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Placares Exatos</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{simulatorStats.correctGuesses}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Total de Palpites</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{simulatorStats.totalGuesses}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '5px', fontWeight: 700, fontSize: '13px' }}>
                                    <Zap size={16} /> Como funciona?
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#a0aec0', textAlign: 'left', lineHeight: 1.5 }}>
                                    Para cada partida finalizada, se o seu palpite coincidir exatamente com o placar oficial, você ganha <strong>1 ponto</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Logout */}
                <div style={{ padding: '20px', borderTop: '1px solid #333', background: '#1a1a1a' }}>
                    <button
                        onClick={() => {
                            logout();
                            onClose();
                        }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'transparent',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#e30613',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#222'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={16} /> SAIR DA CONTA
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default ProfileModal;
