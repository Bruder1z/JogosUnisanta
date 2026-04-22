import React, { useEffect, useState } from 'react';
import { X, Trophy, Users, Settings, Plus, Trash2, Shield } from 'lucide-react';
import { useNotification } from '../../NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../../services/supabaseClient';
import type { Match } from '../../../data/mockData';
import './styles.css';

interface LeagueDetailsModalProps {
    league: any;
    onClose: () => void;
}

interface LeagueRankingRow {
    email: string;
    name: string;
    course?: string;
    points: number;
}

const parseParticipants = (participants: unknown): string[] => {
    if (Array.isArray(participants)) {
        return participants.map((participant) => String(participant));
    }

    if (typeof participants === 'string' && participants.trim()) {
        try {
            const parsed = JSON.parse(participants);
            if (Array.isArray(parsed)) {
                return parsed.map((participant) => String(participant));
            }
        } catch {
            return participants.split(',').map((participant) => participant.trim()).filter(Boolean);
        }
    }

    return [];
};

const LeagueDetailsModal: React.FC<LeagueDetailsModalProps> = ({ league, onClose }) => {
    const { showNotification } = useNotification();
    const { user: currentUser } = useAuth();
    const { matches } = useData();
    const [ranking, setRanking] = useState<LeagueRankingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ranking' | 'manage'>('ranking');
    const [leagueRequests, setLeagueRequests] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(league.name);
    const [editedDescription, setEditedDescription] = useState(league.description);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isAdmin = league.owner_email === currentUser?.email || currentUser?.role === 'superadmin';
    const isSpecialLeague = league.type === 'global' || league.type === 'course';
    const canManage = currentUser?.role === 'superadmin' || league.owner_email === currentUser?.email;

    useEffect(() => {
        const fetchLeagueRanking = async (isInitial = false) => {
            if (isInitial) setLoading(true);

            try {
                let usersQuery = supabase.from('users').select('email, name, surname, preferredcourse, role');

                if (league?.type === 'global') {
                    usersQuery = usersQuery;
                } else if (league?.type === 'course') {
                    usersQuery = usersQuery.eq('preferredcourse', league.course);
                } else {
                    usersQuery = usersQuery.in('email', parseParticipants(league?.participants));
                }

                const { data: usersData } = await usersQuery;
                if (!usersData) return;

                const { data: predsData } = await supabase.from('predictions').select('*');
                const validPreds = predsData || [];
                const finishedMatches = matches.filter((match: Match) => match.status === 'finished');

                const scores: Record<string, LeagueRankingRow> = {};

                usersData.forEach((user: any) => {
                    const isSuperAdmin = user.role === 'superadmin' || user.email === 'superadmin@gmail.com';
                    scores[user.email] = {
                        email: user.email,
                        name: isSuperAdmin ? 'Mestre' : `${user.name} ${user.surname || ''}`.trim(),
                        course: user.preferredcourse,
                        points: 0,
                    };
                });

                validPreds.forEach((pred: any) => {
                    if (!scores[pred.user_email]) {
                        const isSuperAdmin = pred.user_email === 'superadmin@gmail.com';
                        scores[pred.user_email] = {
                            email: pred.user_email,
                            name: isSuperAdmin ? 'Mestre' : pred.user_email.split('@')[0],
                            points: 0,
                        };
                    }
                });

                validPreds.forEach((pred: any) => {
                    const match = finishedMatches.find((finishedMatch: Match) => finishedMatch.id === pred.match_id);
                    if (!match || !scores[pred.user_email]) return;

                    const predA = Number(pred.score_a);
                    const predB = Number(pred.score_b);
                    const actualA = match.scoreA;
                    const actualB = match.scoreB;

                    const isExact = predA === actualA && predB === actualB;
                    const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                    const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';

                    if (isExact) {
                        scores[pred.user_email].points += 3;
                    } else if (predWinner === actualWinner) {
                        scores[pred.user_email].points += 1;
                    }
                });

                setRanking(Object.values(scores).sort((left, right) => right.points - left.points));
            } catch (error) {
                console.error('Erro ao carregar ranking da liga:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueRanking(true);
        const interval = setInterval(() => fetchLeagueRanking(false), 60000);
        return () => clearInterval(interval);
    }, [league.id, league.course, league.participants, league.type, matches]);

    const fetchLeagueRequests = async () => {
        if (!isAdmin) return;

        const { data, error } = await supabase
            .from('league_requests')
            .select('*')
            .eq('league_id', league.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
            return;
        }

        setLeagueRequests(data || []);
    };

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchLeagueRequests();
        }
    }, [activeTab, league.id]);

    const handleRemoveParticipant = async (email: string) => {
        if (!confirm(`Remover ${email} da liga?`)) return;

        const updatedParticipants = parseParticipants(league.participants).filter((participant) => participant !== email);
        const { error } = await supabase.from('leagues').update({ participants: updatedParticipants }).eq('id', league.id);

        if (!error) {
            league.participants = updatedParticipants;
            setRanking((prev) => prev.filter((participant) => participant.email !== email));
            showNotification('Participante removido.');
        }
    };

    const handleUpdateLeague = async () => {
        if (!editedName.trim()) {
            showNotification('O nome da liga não pode estar vazio.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('leagues')
                .update({
                    name: editedName.trim(),
                    description: editedDescription.trim(),
                })
                .eq('id', league.id);

            if (error) throw error;

            league.name = editedName.trim();
            league.description = editedDescription.trim();
            setIsEditing(false);
            showNotification('Informações da liga atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar liga:', error);
            showNotification('Erro ao atualizar informações da liga.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!league.id) {
            showNotification('Erro: ID da liga não encontrado.');
            return;
        }

        setIsSaving(true);
        try {
            const { error: requestError } = await supabase.from('league_requests').delete().eq('league_id', league.id);
            if (requestError) throw requestError;

            const { error: leagueError, count } = await supabase
                .from('leagues')
                .delete({ count: 'exact' })
                .eq('id', league.id);

            if (leagueError) throw leagueError;

            if (count === 0) {
                throw new Error('A liga não foi excluída no banco de dados.');
            }

            setShowDeleteConfirm(false);
            showNotification('Liga excluída com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Falha total na exclusão:', error);
            showNotification(error.message || 'Erro desconhecido ao excluir liga.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveRequest = async (request: any) => {
        try {
            const updatedParticipants = parseParticipants(league.participants);
            if (!updatedParticipants.some((participant) => participant.toLowerCase() === request.user_email.toLowerCase())) {
                updatedParticipants.push(request.user_email.toLowerCase());
            }

            const { error: updateError } = await supabase.from('leagues').update({ participants: updatedParticipants }).eq('id', league.id);
            if (updateError) throw updateError;

            const { error: requestError } = await supabase.from('league_requests').update({ status: 'approved' }).eq('id', request.id);
            if (requestError) throw requestError;

            league.participants = updatedParticipants;
            setLeagueRequests((prev) => prev.filter((currentRequest) => currentRequest.id !== request.id));
            showNotification('Solicitação aprovada!');
        } catch (error) {
            console.error('Erro ao aprovar:', error);
            showNotification('Erro ao aprovar solicitação.');
        }
    };

    const handleLeaveLeague = async () => {
        if (!currentUser?.email) return;

        if (!confirm('Deseja realmente sair desta liga?')) return;

        try {
            const updatedParticipants = parseParticipants(league.participants).filter((participant) => participant.toLowerCase() !== currentUser.email?.toLowerCase());
            const { error } = await supabase.from('leagues').update({ participants: updatedParticipants }).eq('id', league.id);

            if (error) throw error;

            alert('Você saiu da liga.');
            onClose();
        } catch (error) {
            console.error('Erro ao sair da liga:', error);
            alert('Erro ao sair da liga.');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { error } = await supabase.from('league_requests').update({ status: 'rejected' }).eq('id', requestId);

        if (error) {
            console.error('Erro ao recusar:', error);
            showNotification('Erro ao recusar solicitação.');
            return;
        }

        setLeagueRequests((prev) => prev.filter((request) => request.id !== requestId));
        showNotification('Solicitação recusada.');
    };

    return (
        <div className="league-details-overlay">
            <div className="league-details-card premium-card">
                <div className="league-details-header">
                    <div className="league-details-header-row">
                        <div className={`league-details-icon-box ${isSpecialLeague ? 'special' : ''}`}>
                            <Trophy size={24} color={isSpecialLeague ? '#dc2626' : 'white'} />
                        </div>

                        <div className="league-details-header-content">
                            {isEditing ? (
                                <div className="league-details-edit-form">
                                    <input
                                        value={editedName}
                                        onChange={(event) => setEditedName(event.target.value)}
                                        placeholder="Nome da Liga"
                                        className="league-details-input name"
                                    />
                                    <input
                                        value={editedDescription}
                                        onChange={(event) => setEditedDescription(event.target.value)}
                                        placeholder="Descrição da Liga"
                                        className="league-details-input desc"
                                    />
                                    <div className="league-details-edit-actions">
                                        <button onClick={handleUpdateLeague} disabled={isSaving} className="league-details-btn save">
                                            {isSaving ? 'SALVANDO...' : 'SALVAR'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedName(league.name);
                                                setEditedDescription(league.description);
                                            }}
                                            disabled={isSaving}
                                            className="league-details-btn cancel"
                                        >
                                            CANCELAR
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="league-details-title-row">
                                        <h2 className="league-details-title">{league.name}</h2>
                                        {isAdmin && (
                                            <button onClick={() => setIsEditing(true)} className="league-details-edit-btn">
                                                EDITAR
                                            </button>
                                        )}
                                    </div>
                                    <p className="league-details-subtitle">{league.description}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="league-details-header-actions">
                        {!isSpecialLeague && !isAdmin && parseParticipants(league.participants).some((participant) => participant.toLowerCase() === currentUser?.email?.toLowerCase()) && (
                            <button onClick={handleLeaveLeague} className="league-details-btn leave">
                                DEIXAR LIGA
                            </button>
                        )}
                        <button onClick={onClose} className="league-details-btn icon">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {canManage ? (
                    <div className="league-details-tabs">
                        <button onClick={() => setActiveTab('ranking')} className={`league-details-tab ${activeTab === 'ranking' ? 'active' : ''}`}>
                            CLASSIFICAÇÃO
                        </button>
                        <button onClick={() => setActiveTab('manage')} className={`league-details-tab manage ${activeTab === 'manage' ? 'active' : ''}`}>
                            <Settings size={16} /> GERENCIAR
                        </button>
                    </div>
                ) : (
                    <div className="league-details-tabs">
                        <button onClick={() => setActiveTab('ranking')} className="league-details-tab active">
                            CLASSIFICAÇÃO
                        </button>
                    </div>
                )}

                <div className="league-details-content">
                    {activeTab === 'ranking' ? (
                        <div className="league-details-ranking-wrap">
                            {loading ? (
                                <div className="league-details-loading">Carregando ranking...</div>
                            ) : (
                                <table className="league-details-table">
                                    <thead>
                                        <tr>
                                            <th className="pos">Pos</th>
                                            <th>Membro</th>
                                            <th className="points">Pontos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((row, index) => {
                                            const positionClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

                                            return (
                                                <tr key={row.email} className={row.email === currentUser?.email ? 'current-user' : ''}>
                                                    <td className={`pos league-details-position ${positionClass}`}>{index + 1}º</td>
                                                    <td>
                                                        <div className="league-details-member-name">{row.name}</div>
                                                        <div className="league-details-member-course">{row.course}</div>
                                                    </td>
                                                    <td className="points league-details-points">{row.points}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div className="league-details-manage">
                            <section>
                                <h3 className="league-details-section-title">
                                    <Plus size={16} color="#dc2626" /> Link de Convite
                                </h3>
                                <div className="league-details-link-box">
                                    <input
                                        readOnly
                                        value={`${window.location.origin}/?join=${league.id}`}
                                        className="league-details-link-input"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/?join=${league.id}`);
                                            showNotification('Link copiado!');
                                        }}
                                        className="league-details-copy-btn"
                                    >
                                        COPIAR
                                    </button>
                                </div>
                                <p className="league-details-section-note">Compartilhe este link para que novos participantes entrem na sua liga.</p>
                            </section>

                            {leagueRequests.length > 0 && (
                                <section>
                                    <h3 className="league-details-section-title">
                                        <Users size={16} color="#dc2626" /> Solicitações Pendentes ({leagueRequests.length})
                                    </h3>
                                    <div className="league-details-requests">
                                        {leagueRequests.map((request) => (
                                            <div key={request.id} className="league-details-request-item">
                                                <div>
                                                    <div className="league-details-request-name">{request.user_name}</div>
                                                    <div className="league-details-request-email">{request.user_email}</div>
                                                </div>
                                                <div className="league-details-request-actions">
                                                    <button onClick={() => handleApproveRequest(request)} className="league-details-request-btn accept">
                                                        ACEITAR
                                                    </button>
                                                    <button onClick={() => handleRejectRequest(request.id)} className="league-details-request-btn reject">
                                                        RECUSAR
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="league-details-section-title">
                                    <Users size={16} color="#dc2626" /> Participantes ({parseParticipants(league.participants).length || '-'})
                                </h3>
                                <div className="league-details-participants">
                                    {parseParticipants(league.participants).map((email) => (
                                        <div key={email} className="league-details-participant-item">
                                            <span className="league-details-participant-name">
                                                {email} {email === league.owner_email && <Shield size={12} style={{ display: 'inline', marginLeft: 4, color: '#ffd700' }} />}
                                            </span>
                                            {email !== league.owner_email && (
                                                <button onClick={() => handleRemoveParticipant(email)} className="league-details-participant-remove">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="league-details-danger-box">
                                {showDeleteConfirm ? (
                                    <div className="league-details-danger-confirm">
                                        <p className="league-details-danger-text">TEM CERTEZA? ESTA AÇÃO NÃO PODE SER DESFEITA.</p>
                                        <div className="league-details-danger-actions">
                                            <button onClick={handleDeleteLeague} disabled={isSaving} className="league-details-danger-btn delete">
                                                {isSaving ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
                                            </button>
                                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isSaving} className="league-details-danger-btn cancel">
                                                CANCELAR
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="league-details-danger-btn full">
                                        EXCLUIR LIGA PERMANENTEMENTE
                                    </button>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeagueDetailsModal;