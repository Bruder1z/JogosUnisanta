import { type FC, useMemo, useState } from 'react';
import { CheckCircle, LogOut, Save, Trophy, User as UserIcon, X, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AVAILABLE_COURSES, type Match } from '../../../data/mockData';
import ModalShell from '../ModalShell';
import './ProfileModal.css';
import type { ProfileModalProps, ProfileStats } from './types';

const getPreferredCourse = (preferredCourse?: string, preferredcourse?: string) => preferredCourse || preferredcourse || '';

const ProfileModal: FC<ProfileModalProps> = ({ onClose }) => {
    const { matches } = useData();
    const { user, updateUser, logout, userPredictions } = useAuth();
    const [activeTab, setActiveTab] = useState<'settings' | 'points'>('settings');
    const [name, setName] = useState(user?.name || '');
    const [preferredCourse, setPreferredCourse] = useState(
        getPreferredCourse(user?.preferredCourse, (user as { preferredcourse?: string } | null)?.preferredcourse),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const simulatorStats = useMemo<ProfileStats>(() => {
        let points = 0;
        let exact = 0;
        let winners = 0;
        let total = 0;

        const finishedMatches = matches.filter((match: Match) => match.status === 'finished');

        finishedMatches.forEach((match: Match) => {
            const prediction = userPredictions[match.id];

            if (prediction && prediction.scoreA !== '' && prediction.scoreB !== '') {
                total++;

                const predA = Number(prediction.scoreA);
                const predB = Number(prediction.scoreB);
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

        const success = await updateUser({
            name,
            preferredCourse,
        });

        setIsSaving(false);

        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    return (
        <ModalShell
            isOpen={true}
            onClose={onClose}
            overlayClassName="profileOverlay"
            backdropClassName="profileBackdrop"
            cardClassName="profilePanel"
            showCloseButton={false}
        >
            <div className="profileHeader">
                <div className="profileUserWrap">
                    <div className="profileAvatar">
                        <UserIcon size={20} color="#fff" />
                    </div>
                    <div>
                        <h2 className="profileTitle">{user?.name}</h2>
                        {(user?.preferredCourse || (user as { preferredcourse?: string } | null)?.preferredcourse) && (
                            <span className="profileSubtitle">
                                {user?.preferredCourse || (user as { preferredcourse?: string } | null)?.preferredcourse}
                            </span>
                        )}
                    </div>
                </div>

                <button onClick={onClose} className="profileCloseButton" aria-label="Fechar perfil">
                    <X size={24} />
                </button>
            </div>

            <div className="profileTabs">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`profileTabButton ${activeTab === 'settings' ? 'profileTabButtonActive' : ''}`}
                >
                    CONFIGURAÇÕES
                </button>
                <button
                    onClick={() => setActiveTab('points')}
                    className={`profileTabButton profileTabButtonPoints ${activeTab === 'points' ? 'profileTabButtonActive' : ''}`}
                >
                    PONTUAÇÃO <Trophy size={14} color={activeTab === 'points' ? '#ffd700' : '#888'} />
                </button>
            </div>

            <div className="profileBody">
                {activeTab === 'settings' ? (
                    <div className="profileSettings">
                        <div className="profileField">
                            <label className="profileLabel">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="profileInput"
                            />
                        </div>

                        <div className="profileField">
                            <label className="profileLabel">Curso de Preferência</label>
                            <select
                                value={preferredCourse}
                                onChange={(event) => setPreferredCourse(event.target.value)}
                                className="profileSelect"
                            >
                                <option value="" disabled>
                                    Selecione um curso...
                                </option>
                                {AVAILABLE_COURSES.map((course) => (
                                    <option key={course} value={course}>
                                        {course}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`profileSaveButton ${saveSuccess ? 'profileSaveButtonSuccess' : ''} ${isSaving ? 'profileSaveButtonDisabled' : ''}`}
                        >
                            {isSaving ? 'SALVANDO...' : saveSuccess ? (
                                <>
                                    <CheckCircle size={16} /> SALVO!
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> SALVAR ALTERAÇÕES
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="profilePoints">
                        <div className="profilePointsIcon">
                            <Trophy size={32} />
                        </div>

                        <h3 className="profilePointsValue">
                            {simulatorStats.totalPoints} <span className="profilePointsUnit">PTS</span>
                        </h3>
                        <p className="profilePointsSubtitle">Pontuação Total no Palpitômetro</p>

                        <div className="profileStatsGrid">
                            <div className="profileStat">
                                <div className="profileStatLabel">Exatos (3pts)</div>
                                <div className="profileStatValue">{simulatorStats.exactScores}</div>
                            </div>
                            <div className="profileStat">
                                <div className="profileStatLabel">Vencedor (1pt)</div>
                                <div className="profileStatValue">{simulatorStats.winners}</div>
                            </div>
                            <div className="profileStat">
                                <div className="profileStatLabel">Total Palpites</div>
                                <div className="profileStatValue">{simulatorStats.totalGuesses}</div>
                            </div>
                        </div>

                        <div className="profileHelpBox">
                            <div className="profileHelpHeader">
                                <Zap size={16} /> Como funciona?
                            </div>
                            <p className="profileHelpText">
                                Ao acertar o placar são <strong>3 pontos</strong> e ao acertar o ganhador é <strong>1 ponto</strong>.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="profileFooter">
                <button
                    onClick={() => {
                        logout();
                        onClose();
                    }}
                    className="profileLogoutButton"
                >
                    <LogOut size={16} /> SAIR DA CONTA
                </button>
            </div>
        </ModalShell>
    );
};

export default ProfileModal;