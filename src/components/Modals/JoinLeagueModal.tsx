import React, { useEffect, useState } from 'react';
import { X, Trophy, Check } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface JoinLeagueModalProps {
    leagueId: string;
    onClose: () => void;
    onJoined: () => void;
}

const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({ leagueId, onClose, onJoined }) => {
    const { user, openLoginModal } = useAuth();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchLeague = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('leagues')
                .select('*')
                .eq('id', leagueId)
                .single();

            if (error || !data) {
                setError('Liga não encontrada ou link inválido.');
            } else {
                setLeague(data);
            }
            setLoading(false);
        };

        if (leagueId) fetchLeague();
    }, [leagueId]);

    const handleJoin = async () => {
        if (!user) {
            openLoginModal();
            return;
        }

        setIsJoining(true);
        try {
            console.log("League object before join:", league);
            const userEmail = user.email.toLowerCase();
            let currentParticipants: string[] = [];
            
            if (Array.isArray(league.participants)) {
                currentParticipants = league.participants;
            } else if (typeof league.participants === 'string' && league.participants) {
                try {
                    currentParticipants = JSON.parse(league.participants);
                } catch {
                    currentParticipants = league.participants.split(',').map((p: string) => p.trim());
                }
            } else if (league.participants) {
                // If it's an object but not an array (e.g. JSONB object)
                currentParticipants = Object.values(league.participants);
            }

            if (currentParticipants.some((p: string) => p.toLowerCase() === userEmail)) {
                alert('Você já faz parte desta liga!');
                onJoined();
                return;
            }

            const updatedParticipants = Array.from(new Set([...currentParticipants, userEmail]));
            
            console.log("Attempting to update participants to:", updatedParticipants);
            
            const { data, error, status } = await supabase
                .from('leagues')
                .update({ participants: updatedParticipants })
                .eq('id', leagueId)
                .select();

            console.log("Supabase response status:", status);
            if (error) {
                console.error("Supabase Update Error:", error);
                alert(`ERRO SUPABASE (${error.code}): ${error.message}\n\nDica: Verifique se você rodou o SQL das permissões (RLS) e se a coluna 'participants' é do tipo texto[] ou jsonb.`);
            } else {
                console.log("Update success data:", data);
                if (data && data.length > 0) {
                    alert(`Sucesso! Bem-vindo à liga ${league.name}!`);
                    onJoined();
                } else {
                    alert('A atualização foi enviada mas nenhuma linha foi alterada. Isso geralmente acontece se o ID da liga estiver incorreto ou por restrição de segurança (RLS).');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 4000, padding: '20px'
        }}>
            <div className="premium-card fade-in" style={{
                width: '100%', maxWidth: '400px', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: '20px',
                padding: '32px', textAlign: 'center'
            }}>
                {error ? (
                    <>
                        <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                             <X size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '24px' }}>{error}</h2>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--accent-color)',
                            color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer'
                        }}>VOLTAR</button>
                    </>
                ) : (
                    <>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                            border: '2px solid var(--accent-color)'
                        }}>
                            <Trophy size={32} style={{ color: 'var(--accent-color)' }} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '8px', textTransform: 'uppercase' }}>
                            CONVITE RECEBIDO!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', lineHeight: 1.5 }}>
                            Você foi convidado para participar da liga:<br/>
                            <strong style={{ color: 'white', fontSize: '18px' }}>{league.name}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={handleJoin}
                                disabled={isJoining}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--accent-color)',
                                    color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Check size={18} /> {isJoining ? 'ENTRANDO...' : 'ACEITAR CONVITE'}
                            </button>
                            <button 
                                onClick={onClose}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', background: 'none',
                                    border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                RECUSAR
                            </button>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default JoinLeagueModal;
