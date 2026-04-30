import React, { useEffect, useState } from 'react';
import { X, Medal, Crown, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

interface BolaoRankingModalProps {
    onClose: () => void;
}

interface BolaoUserRanking {
    email: string;
    name: string;
    surname?: string;
    preferredCourse?: string;
    avatar?: string;
    points: number;
    exactMatches: number;
    winnerMatches: number;
}

const BolaoRankingModal: React.FC<BolaoRankingModalProps> = ({ onClose }) => {
    const { matches } = useData();
    const { user: currentUser } = useAuth();
    const [ranking, setRanking] = useState<BolaoUserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userPredictions, setUserPredictions] = useState<any[]>([]);
    const [loadingPreds, setLoadingPreds] = useState(false);
    // Função para buscar palpites do usuário
    const fetchUserPredictions = async (email: string) => {
        setLoadingPreds(true);
        const { data: preds } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_email', email);
        setUserPredictions(preds || []);
        setLoadingPreds(false);
    };

    useEffect(() => {
        const fetchGlobalRanking = async (isInitial = false) => {
            if (isInitial) setLoading(true);
            try {
                // 1. Fetch users (exclude superadmin)
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('email, name, surname, preferredcourse, role');

                if (usersError) console.error('Error fetching users:', usersError);

                const validUsers = (usersData || []).filter(u => u.role !== 'superadmin');

                // 2. Fetch all predictions
                const { data: predsData, error: predsError } = await supabase
                    .from('predictions')
                    .select('*');

                if (predsError) console.error('Error fetching predictions:', predsError);

                const validPreds = predsData || [];

                // 3. Compute points
                const finishedMatches = matches.filter(m => m.status === 'finished');
                const userScores: Record<string, BolaoUserRanking> = {};

                validUsers.forEach(u => {
                    const isSuperAdmin = u.role === 'superadmin' || u.role === 'admin' || u.email === 'superadmin@gmail.com';
                    userScores[u.email] = {
                        email: u.email,
                        name: isSuperAdmin ? "Mestre" : (u.name || u.email),
                        surname: isSuperAdmin ? "" : u.surname,
                        preferredCourse: u.preferredcourse,
                        avatar: undefined,
                        points: 0,
                        exactMatches: 0,
                        winnerMatches: 0,
                    };
                });

                validPreds.forEach(pred => {
                    if (!userScores[pred.user_email]) {
                        const isSuperAdmin = pred.user_email === 'superadmin@gmail.com';
                        userScores[pred.user_email] = {
                            email: pred.user_email,
                            name: isSuperAdmin ? "Mestre" : pred.user_email.split('@')[0],
                            points: 0,
                            exactMatches: 0,
                            winnerMatches: 0,
                        };
                    }
                });

                validPreds.forEach(pred => {
                    const match = finishedMatches.find(m => m.id === pred.match_id);
                    if (match && userScores[pred.user_email] && pred.score_a !== null && pred.score_b !== null) {
                        const predA = Number(pred.score_a);
                        const predB = Number(pred.score_b);
                        const actualA = match.scoreA;
                        const actualB = match.scoreB;

                        const isExact = predA === actualA && predB === actualB;
                        const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                        const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';
                        const isWinner = predWinner === actualWinner;

                        if (isExact) {
                            userScores[pred.user_email].points += 3;
                            userScores[pred.user_email].exactMatches += 1;
                        } else if (isWinner) {
                            userScores[pred.user_email].points += 1;
                            userScores[pred.user_email].winnerMatches += 1;
                        }
                    }
                });

                const sortedRanking = Object.values(userScores).sort((a, b) => b.points - a.points);
                setRanking(sortedRanking);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalRanking(true);
        const interval = setInterval(() => fetchGlobalRanking(false), 60000);
        return () => clearInterval(interval);
    }, []); // No context dependency for polling

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
                maxWidth: '600px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                background: 'var(--bg-card)'
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
                            background: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)'
                        }}>
                            <Crown size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Ranking Geral</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Classificação geral dos usuários</p>
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
                    scrollbarColor: '#dc2626 transparent'
                }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando ranking...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                                <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '15px 20px', width: '60px', textAlign: 'center' }}>Pos</th>
                                    <th style={{ padding: '15px 20px' }}>Usuário</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center' }}>Pontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((user, index) => {
                                    const isTop3 = index < 3;
                                    const highlightColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : null;

                                    const rows = [
                                        <tr
                                            key={user.email}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                background: isTop3 ? `linear-gradient(90deg, ${highlightColor}15 0%, transparent 100%)` : 'transparent',
                                                transition: 'background 0.2s',
                                                position: 'relative'
                                            }}
                                            className="hover-glow-subtle"
                                        >
                                            <td style={{ padding: '15px 20px', textAlign: 'center' }}>
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
                                                    border: isTop3 ? `1px solid ${highlightColor}` : 'none',
                                                    margin: '0 auto'
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
                                                        background: 'rgba(255,255,255,0.08)',
                                                        borderRadius: '50%',
                                                        fontSize: '14px',
                                                        fontWeight: 800,
                                                        color: '#fff',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: 700, color: isTop3 ? 'white' : 'var(--text-primary)' }}>
                                                            {user.name} {user.surname ? user.surname : ''}

                                                        </div>
                                                        {user.preferredCourse ? <span style={{ color: '#dc2626', fontWeight: 500, fontSize: '13px' }}>({user.preferredCourse})</span> : null}

                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <span style={{
                                                        fontSize: '18px',
                                                        fontWeight: 900,
                                                        color: isTop3 ? (highlightColor as string) : 'white',
                                                        fontVariantNumeric: 'tabular-nums'
                                                    }}>{user.points}</span>
                                                    {currentUser?.email === user.email && (
                                                        <button
                                                            style={{
                                                                background: selectedUser === user.email ? '#dc2626' : 'transparent',
                                                                border: 'none',
                                                                borderRadius: 4,
                                                                padding: 4,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'background 0.2s',
                                                            }}
                                                            title={selectedUser === user.email ? 'Fechar partidas' : 'Ver partidas'}
                                                            onClick={() => {
                                                                if (selectedUser === user.email) {
                                                                    setSelectedUser(null);
                                                                    setUserPredictions([]);
                                                                } else {
                                                                    setSelectedUser(user.email);
                                                                    fetchUserPredictions(user.email);
                                                                }
                                                            }}
                                                        >
                                                            <Eye size={20} color={selectedUser === user.email ? 'white' : '#dc2626'} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ];
                                    if (selectedUser === user.email) {
                                        rows.push(
                                            <tr key={user.email + '-panel'}>
                                                <td colSpan={3}>
                                                    <div style={{ marginTop: 10, marginBottom: 10, background: '#222', borderRadius: 8, padding: 12, color: '#fff', boxShadow: '0 2px 8px #0002' }}>
                                                        {loadingPreds ? (
                                                            <div>Carregando partidas...</div>
                                                        ) : userPredictions.length === 0 ? (
                                                            <div>Nenhum palpite encontrado.</div>
                                                        ) : (
                                                            <table style={{ width: '100%', fontSize: 13, color: '#fff' }}>
                                                                <thead>
                                                                    <tr style={{ color: '#dc2626' }}>
                                                                        <th style={{ textAlign: 'left', padding: 4 }}>Partida</th>
                                                                        <th style={{ textAlign: 'center', padding: 4 }}>Palpite</th>
                                                                        <th style={{ textAlign: 'center', padding: 4 }}>Real</th>
                                                                        <th style={{ textAlign: 'center', padding: 4 }}>Correto?</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {userPredictions.map(pred => {
                                                                        const match = matches.find(m => m.id === pred.match_id);
                                                                        if (!match) return null;
                                                                        const isFinished = match.status === 'finished';
                                                                        const isExact = isFinished && Number(pred.score_a) === match.scoreA && Number(pred.score_b) === match.scoreB;
                                                                        const predWinner = Number(pred.score_a) > Number(pred.score_b) ? 'A' : Number(pred.score_b) > Number(pred.score_a) ? 'B' : 'draw';
                                                                        const actualWinner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : 'draw';
                                                                        const isWinner = isFinished && !isExact && predWinner === actualWinner;
                                                                        return (
                                                                            <tr key={pred.match_id} style={{ background: isExact ? '#16a34a55' : isWinner ? '#facc1555' : 'transparent' }}>
                                                                                <td style={{ padding: 4 }}>{match.teamA.name} x {match.teamB.name}</td>
                                                                                <td style={{ textAlign: 'center', padding: 4 }}>{pred.score_a} x {pred.score_b}</td>
                                                                                <td style={{ textAlign: 'center', padding: 4 }}>{isFinished ? `${match.scoreA} x ${match.scoreB}` : '-'}</td>
                                                                                <td style={{ textAlign: 'center', padding: 4 }}>
                                                                                    {isFinished ? (isExact ? <span style={{ color: '#16a34a', fontWeight: 700 }}>Exato</span> : isWinner ? <span style={{ color: '#facc15', fontWeight: 700 }}>Vencedor</span> : <span style={{ color: '#dc2626' }}>Errado</span>) : <span style={{ color: '#888' }}>-</span>}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return rows;
                                })}
                                {ranking.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
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
                        Placar Exato (+3pts) • Vencedor Correto (+1pt)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BolaoRankingModal;
