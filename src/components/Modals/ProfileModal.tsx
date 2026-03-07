import { type FC, useState, useMemo } from 'react';
import { X, Settings, Trophy, Save, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockMatches } from '../../data/mockData';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ onClose }) => {
    const { user, updateUser } = useAuth();
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
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)'
                }}
            />

            <div className="premium-card" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalOpen 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                {/* Header with Tabs */}
                <div style={{
                    padding: '24px 24px 0',
                    background: 'linear-gradient(to bottom, var(--bg-hover), transparent)',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Meu Perfil</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '24px' }}>
                        <button
                            onClick={() => setActiveTab('settings')}
                            style={{
                                padding: '12px 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'settings' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Settings size={18} /> Configurações
                        </button>
                        <button
                            onClick={() => setActiveTab('points')}
                            style={{
                                padding: '12px 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'points' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'points' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Trophy size={18} /> Meus Pontos
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
                    {activeTab === 'settings' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    style={{
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Curso / Faculdade</label>
                                <input
                                    type="text"
                                    value={preferredCourse}
                                    onChange={(e) => setPreferredCourse(e.target.value)}
                                    placeholder="Ex: Engenharia"
                                    style={{
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time / Atlética Favorita</label>
                                <input
                                    type="text"
                                    value={favoriteTeam}
                                    onChange={(e) => setFavoriteTeam(e.target.value)}
                                    placeholder="Ex: Fefesp"
                                    style={{
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    marginTop: '10px',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: saveSuccess ? '#00c853' : 'var(--accent-color)',
                                    color: 'white',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 4px 15px rgba(227, 6, 19, 0.3)'
                                }}
                            >
                                {isSaving ? 'Salvando...' : saveSuccess ? (
                                    <><CheckCircle size={18} /> Salvo!</>
                                ) : (
                                    <><Save size={18} /> Salvar Alterações</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '2px solid #ffd700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#ffd700'
                            }}>
                                <Zap size={40} style={{ margin: 'auto' }} />
                            </div>

                            <h3 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 8px' }}>
                                {simulatorStats.totalPoints} <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>pts</span>
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
                                Você acertou {simulatorStats.correctGuesses} de {simulatorStats.totalGuesses} palpites finalizados!
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '15px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Acertos</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{simulatorStats.correctGuesses}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Palpites</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{simulatorStats.totalGuesses}</div>
                                </div>
                            </div>

                            <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Cada palpite com placar exato vale 1 ponto. Continue simulando para subir no ranking!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalOpen {
                    from { transform: scale(0.95) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ProfileModal;
