import { type FC, useMemo, useState } from 'react';
import { X, Trophy, Save, CheckCircle, Zap, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AVAILABLE_COURSES } from '../../../data/mockData';
import './styles.css';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ onClose }) => {
    const { matches } = useData();
    const { user, updateUser, logout, userPredictions } = useAuth();
    const [activeTab, setActiveTab] = useState<'settings' | 'points'>('settings');
    const [name, setName] = useState(user?.name || '');
    const [preferredCourse, setPreferredCourse] = useState(user?.preferredCourse || (user as any)?.preferredcourse || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const simulatorStats = useMemo(() => {
        let points = 0;
        let exact = 0;
        let winners = 0;
        let total = 0;

        const finishedMatches = matches.filter((match: any) => match.status === 'finished');

        finishedMatches.forEach((match: any) => {
            const pred = userPredictions[match.id];
            if (pred && pred.scoreA !== '' && pred.scoreB !== '') {
                total++;
                const predA = Number(pred.scoreA);
                const predB = Number(pred.scoreB);
                const actualA = match.scoreA;
                const actualB = match.scoreB;

                const isExact = predA === actualA && predB === actualB;
                const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';
                const isWinner = predWinner === actualWinner;

                if (isExact) {
                    points += 3;
                    exact++;
                } else if (isWinner) {
                    points += 1;
                    winners++;
                }
            }
        });

        return { totalPoints: points, exactScores: exact, winners, totalGuesses: total };
    }, [matches, userPredictions]);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await updateUser({ name, preferredCourse });

        setIsSaving(false);
        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (!user) return null;

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal-backdrop" onClick={onClose} />

            <div className="profile-modal-card">
                <div className="profile-modal-header">
                    <div className="profile-modal-user">
                        <div className="profile-modal-avatar">
                            <UserIcon size={20} color="#fff" />
                        </div>
                        <div>
                            <h2 className="profile-modal-name">{user?.name}</h2>
                            {(user?.preferredCourse || (user as any)?.preferredcourse) && (
                                <span className="profile-modal-course">
                                    {user?.preferredCourse || (user as any)?.preferredcourse}
                                </span>
                            )}
                        </div>
                    </div>

                    <button onClick={onClose} className="profile-modal-close">
                        <X size={24} />
                    </button>
                </div>

                <div className="profile-modal-tabs">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`profile-modal-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    >
                        CONFIGURAÇÕES
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`profile-modal-tab points ${activeTab === 'points' ? 'active' : ''}`}
                    >
                        PONTUAÇÃO <Trophy size={14} color={activeTab === 'points' ? '#ffd700' : '#888'} />
                    </button>
                </div>

                <div className="profile-modal-body">
                    {activeTab === 'settings' ? (
                        <div className="profile-modal-section">
                            <div className="profile-modal-field">
                                <label className="profile-modal-label">Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="profile-modal-input"
                                />
                            </div>

                            <div className="profile-modal-field">
                                <label className="profile-modal-label">Curso de Preferência</label>
                                <select
                                    value={preferredCourse}
                                    onChange={(event) => setPreferredCourse(event.target.value)}
                                    className="profile-modal-select"
                                >
                                    <option value="" disabled>Selecione um curso...</option>
                                    {AVAILABLE_COURSES.map((course) => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`profile-modal-save-btn ${saveSuccess ? 'success' : ''}`}
                            >
                                {isSaving ? 'SALVANDO...' : saveSuccess ? (
                                    <><CheckCircle size={16} /> SALVO!</>
                                ) : (
                                    <><Save size={16} /> SALVAR ALTERAÇÕES</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="profile-modal-points">
                            <div className="profile-modal-points-icon">
                                <Trophy size={32} />
                            </div>

                            <h3 className="profile-modal-points-total">
                                {simulatorStats.totalPoints} <span className="profile-modal-points-label">PTS</span>
                            </h3>
                            <p className="profile-modal-points-subtitle">Pontuação Total no Bolão</p>

                            <div className="profile-modal-stats">
                                <div className="profile-modal-stat">
                                    <div className="profile-modal-stat-label">Exatos (3pts)</div>
                                    <div className="profile-modal-stat-value">{simulatorStats.exactScores}</div>
                                </div>
                                <div className="profile-modal-stat">
                                    <div className="profile-modal-stat-label">Vencedor (1pt)</div>
                                    <div className="profile-modal-stat-value">{simulatorStats.winners}</div>
                                </div>
                                <div className="profile-modal-stat">
                                    <div className="profile-modal-stat-label">Total Palpites</div>
                                    <div className="profile-modal-stat-value">{simulatorStats.totalGuesses}</div>
                                </div>
                            </div>

                            <div className="profile-modal-info-box">
                                <div className="profile-modal-info-title">
                                    <Zap size={16} /> Como funciona?
                                </div>
                                <p className="profile-modal-info-text">
                                    Ao acertar o placar são <strong>3 pontos</strong> e ao acertar o ganhador é <strong>1 ponto</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-modal-footer">
                    <button
                        onClick={() => {
                            logout();
                            onClose();
                        }}
                        className="profile-modal-logout-btn"
                    >
                        <LogOut size={16} /> SAIR DA CONTA
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;