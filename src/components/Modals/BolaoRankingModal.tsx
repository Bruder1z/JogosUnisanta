import React, { useEffect, useState } from 'react';
import { X, Medal, Crown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase } from '../../services/supabaseClient';

interface BolaoRankingModalProps {
    onClose: () => void;
}

interface BolaoUserRanking {
    email: string;
    name: string;
    avatar?: string;
    points: number;
    exactMatches: number;
    winnerMatches: number;
}

const BolaoRankingModal: React.FC<BolaoRankingModalProps> = ({ onClose }) => {
    const { matches } = useData();
    const [ranking, setRanking] = useState<BolaoUserRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalRanking = async () => {
            // 1. Fetch users (exclude superadmin)
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('email, name, role');
            
            if (usersError) {
                console.error('Error fetching users:', usersError);
                // Continue with empty array if error
            }

            const validUsers = (usersData || []).filter(u => u.role !== 'superadmin');

            // 2. Fetch all predictions
            const { data: predsData, error: predsError } = await supabase
                .from('predictions')
                .select('*');

            if (predsError) {
                console.error('Error fetching predictions:', predsError);
                // Continue with empty array if error
            }

            const validPreds = predsData || [];

            // 3. Compute points
            const finishedMatches = matches.filter(m => m.status === 'finished');
            
            const userScores: Record<string, BolaoUserRanking> = {};
            
            validUsers.forEach(u => {
                userScores[u.email] = {
                    email: u.email,
                    name: u.name || u.email,
                    avatar: undefined,
                    points: 0,
                    exactMatches: 0,
                    winnerMatches: 0,
                };
            });

            // Fallback for predictions from users who might not be in validUsers (e.g. deleted or RLS blocked)
            validPreds.forEach(pred => {
                if (!userScores[pred.user_email]) {
                    userScores[pred.user_email] = {
                        email: pred.user_email,
                        name: pred.user_email.split('@')[0],
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

            // 4. Sort ranking
            const sortedRanking = Object.values(userScores).sort((a, b) => b.points - a.points);
            setRanking(sortedRanking);
            setLoading(false);
        };

        fetchGlobalRanking();
    }, [matches]);

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
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Ranking do Bolão</h2>
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

                                    return (
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
                                                        <div style={{ fontSize: '15px', fontWeight: 700, color: isTop3 ? 'white' : 'var(--text-primary)' }}>{user.name}</div>
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
                                                    {user.points}
                                                </div>
                                            </td>
                                        </tr>
                                    );
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
