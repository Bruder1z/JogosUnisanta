import React, { useEffect, useState } from 'react';
import { X, Trophy, Check } from 'lucide-react';
import { useNotification } from '../../NotificationContext';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import ModalShell from '../ModalShell';
import './JoinLeagueModal.css';
import type { JoinLeagueModalProps, LeagueRow } from './types';

const parseParticipants = (participants: unknown): string[] => {
    if (Array.isArray(participants)) {
        return participants.map((participant) => String(participant));
    }

    if (typeof participants === 'string' && participants) {
        try {
            const parsed = JSON.parse(participants);
            return Array.isArray(parsed)
                ? parsed.map((participant) => String(participant))
                : participants.split(',').map((participant) => participant.trim());
        } catch {
            return participants.split(',').map((participant) => participant.trim());
        }
    }

    if (participants && typeof participants === 'object') {
        return Object.values(participants as Record<string, unknown>).map((participant) => String(participant));
    }

    return [];
};

const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({ leagueId, onClose, onJoined }) => {
    const { showNotification } = useNotification();
    const { user, openLoginModal } = useAuth();
    const [league, setLeague] = useState<LeagueRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchLeague = async () => {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('leagues')
                .select('id, name, participants')
                .eq('id', leagueId)
                .single();

            if (fetchError || !data) {
                setError('Liga não encontrada ou link inválido.');
            } else {
                setLeague(data as LeagueRow);
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

        if (!league) return;

        setIsJoining(true);

        try {
            const userEmail = user.email.toLowerCase();

            const { data: allLeagues, error: countError } = await supabase
                .from('leagues')
                .select('id, participants');

            if (countError) {
                console.error('Erro ao contar ligas:', countError);
            } else {
                const privateLeagueCount = (allLeagues || []).filter((item) => {
                    const participants = parseParticipants(item.participants);
                    return participants.some((participant) => participant.toLowerCase() === userEmail);
                }).length;

                const automaticCount = 1 + (user.preferredCourse ? 1 : 0);
                const totalCount = privateLeagueCount + automaticCount;

                if (totalCount >= 5) {
                    showNotification('Você já participa de 5 ligas, que é o máximo permitido. Saia de uma liga antes de entrar em outra.', 'error');
                    setIsJoining(false);
                    return;
                }
            }

            const currentParticipants = parseParticipants(league.participants);

            if (currentParticipants.some((participant) => participant.toLowerCase() === userEmail)) {
                showNotification('Você já faz parte desta liga!', 'info');
                onJoined();
                return;
            }

            const updatedParticipants = Array.from(new Set([...currentParticipants, userEmail]));

            const { data, error: updateError, status } = await supabase
                .from('leagues')
                .update({ participants: updatedParticipants })
                .eq('id', leagueId)
                .select();

            console.log('Supabase response status:', status);

            if (updateError) {
                console.error('Supabase Update Error:', updateError);
                showNotification(`ERRO SUPABASE (${updateError.code}): ${updateError.message}\n\nDica: Verifique se você rodou o SQL das permissões (RLS) e se a coluna 'participants' é do tipo texto[] ou jsonb.`, 'error');
                return;
            }

            console.log('Update success data:', data);

            if (data && data.length > 0) {
                showNotification(`Sucesso! Bem-vindo à liga ${league.name}!`, 'success');
                onJoined();
            } else {
                showNotification('A atualização foi enviada mas nenhuma linha foi alterada. Isso geralmente acontece se o ID da liga estiver incorreto ou por restrição de segurança (RLS).', 'warning');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) return null;

    return (
        <ModalShell
            isOpen={true}
            onClose={onClose}
            overlayClassName="joinLeagueOverlay"
            cardClassName="premium-card joinLeagueModal joinLeagueFadeIn"
            showCloseButton={false}
        >
            {error ? (
                <>
                    <div className="joinLeagueErrorIcon">
                        <X size={48} style={{ margin: '0 auto' }} />
                    </div>
                    <h2 className="joinLeagueTitle">{error}</h2>
                    <button onClick={onClose} className="joinLeaguePrimaryButton">
                        VOLTAR
                    </button>
                </>
            ) : (
                <>
                    <div className="joinLeagueIconWrap">
                        <Trophy size={32} style={{ color: 'var(--accent-color)' }} />
                    </div>
                    <h2 className="joinLeagueHeading">CONVITE RECEBIDO!</h2>
                    <p className="joinLeagueDescription">
                        Você foi convidado para participar da liga:<br />
                        <strong className="joinLeagueLeagueName">{league?.name}</strong>
                    </p>

                    <div className="joinLeagueButtons">
                        <button onClick={handleJoin} disabled={isJoining} className="joinLeaguePrimaryButton">
                            <Check size={18} /> {isJoining ? 'ENTRANDO...' : 'ACEITAR CONVITE'}
                        </button>
                        <button onClick={onClose} className="joinLeagueSecondaryButton">
                            RECUSAR
                        </button>
                    </div>
                </>
            )}
        </ModalShell>
    );
};

export default JoinLeagueModal;