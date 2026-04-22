import { useNotification } from '../../NotificationContext';
import React, { useEffect, useState } from 'react';
import { X, Trophy, Check } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import './styles.css';

interface JoinLeagueModalProps {
    leagueId: string;
    onClose: () => void;
    onJoined: () => void;
}


const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({ leagueId, onClose, onJoined }) => {
    const { showNotification } = useNotification();
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
            const userEmail = user.email.toLowerCase();

            // ── Count how many leagues the user already participates in ──
            const { data: allLeagues, error: countError } = await supabase
                .from('leagues')
                .select('id, participants');

            if (countError) {
                console.error('Erro ao contar ligas:', countError);
            } else {
                const privateLeagueCount = (allLeagues || []).filter((l: any) => {
                    const parts: string[] = Array.isArray(l.participants)
                        ? l.participants
                        : typeof l.participants === 'string'
                            ? (() => { try { return JSON.parse(l.participants); } catch { return l.participants.split(',').map((p: string) => p.trim()); } })()
                            : [];
                    return parts.some((p: string) => p.toLowerCase() === userEmail);
                }).length;

                // Automatic leagues: 1 global + 1 course (if user has a preferred course)
                const automaticCount = 1 + (user.preferredCourse ? 1 : 0);
                const totalCount = privateLeagueCount + automaticCount;

                if (totalCount >= 5) {
                    showNotification('Você já participa de 5 ligas, que é o máximo permitido. Saia de uma liga antes de entrar em outra.', 'error');
                    setIsJoining(false);
                    return;
                }
            }

            // ── Proceed with join ──
            console.log("League object before join:", league);
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
                showNotification('Você já faz parte desta liga!', 'info');
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
                showNotification(`ERRO SUPABASE (${error.code}): ${error.message}\n\nDica: Verifique se você rodou o SQL das permissões (RLS) e se a coluna 'participants' é do tipo texto[] ou jsonb.`, 'error');
            } else {
                console.log("Update success data:", data);
                if (data && data.length > 0) {
                    showNotification(`Sucesso! Bem-vindo à liga ${league.name}!`, 'success');
                    onJoined();
                } else {
                    showNotification('A atualização foi enviada mas nenhuma linha foi alterada. Isso geralmente acontece se o ID da liga estiver incorreto ou por restrição de segurança (RLS).', 'warning');
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
        <div className="join-league-overlay">
            <div className="join-league-card fade-in">
                {error ? (
                    <>
                        <div className="join-league-error-icon-wrapper">
                            <X size={48} className="join-league-error-icon" />
                        </div>
                        <h2 className="join-league-error-title">{error}</h2>
                        <button onClick={onClose} className="join-league-btn-back">VOLTAR</button>
                    </>
                ) : (
                    <>
                        <div className="join-league-success-icon-wrapper">
                            <Trophy size={32} className="join-league-success-icon" />
                        </div>
                        <h2 className="join-league-title">
                            CONVITE RECEBIDO!
                        </h2>
                        <p className="join-league-desc">
                            Você foi convidado para participar da liga:<br />
                            <strong className="join-league-name-highlight">{league.name}</strong>
                        </p>

                        <div className="join-league-btn-group">
                            <button
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="join-league-btn-accept"
                            >
                                <Check size={18} /> {isJoining ? 'ENTRANDO...' : 'ACEITAR CONVITE'}
                            </button>
                            <button
                                onClick={onClose}
                                className="join-league-btn-reject"
                            >
                                RECUSAR
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default JoinLeagueModal;
