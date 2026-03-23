import React, { useEffect, useState } from 'react';
import { X, Trophy, Users, Settings, Plus, Trash2, Shield } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../context/DataContext';

interface LeagueDetailsModalProps {
    league: any;
    onClose: () => void;
}

const LeagueDetailsModal: React.FC<LeagueDetailsModalProps> = ({ league, onClose }) => {
    const { user: currentUser } = useAuth();
    const { matches } = useData();
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ranking' | 'manage'>('ranking');

    const isAdmin = league.owner_email === currentUser?.email || currentUser?.role === 'superadmin';
    const isSpecialLeague = league.type === 'global' || league.type === 'course';
    const [leagueRequests, setLeagueRequests] = useState<any[]>([]);
    
    // States for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(league.name);
    const [editedDescription, setEditedDescription] = useState(league.description);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'desc' | null>(null);

    useEffect(() => {
        const fetchLeagueRanking = async (isInitial = false) => {
            if (isInitial) setLoading(true);
            try {
                // 1. Fetch users for this league
                let usersQuery = supabase.from('users').select('email, name, surname, preferredcourse, role');
                
                if (league?.type === 'global') {
                    usersQuery = usersQuery; // Fetch everyone
                } else if (league?.type === 'course') {
                    usersQuery = usersQuery.eq('preferredcourse', league.course);
                } else {
                    usersQuery = usersQuery.in('email', league?.participants || []);
                }

                const { data: usersData } = await usersQuery;
                if (!usersData) return;

                // 2. Fetch predictions
                const { data: predsData } = await supabase.from('predictions').select('*');
                const validPreds = predsData || [];
                const finishedMatches = matches.filter(m => m.status === 'finished');

                const scores: Record<string, any> = {};
                usersData.forEach(u => {
                    const isSuperAdmin = u.role === 'superadmin' || u.email === 'superadmin@gmail.com';
                    scores[u.email] = {
                        email: u.email,
                        name: isSuperAdmin ? "Mestre" : `${u.name} ${u.surname || ''}`.trim(),
                        course: u.preferredcourse,
                        points: 0,
                    };
                });

                validPreds.forEach(pred => {
                    const match = finishedMatches.find(m => m.id === pred.match_id);
                    if (match && scores[pred.user_email]) {
                        const predA = Number(pred.score_a);
                        const predB = Number(pred.score_b);
                        const actualA = match.scoreA;
                        const actualB = match.scoreB;

                        const isExact = predA === actualA && predB === actualB;
                        const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
                        const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';
                        const isWinner = predWinner === actualWinner;

                        if (isExact) scores[pred.user_email].points += 3;
                        else if (isWinner) scores[pred.user_email].points += 1;
                    }
                });

                const sorted = Object.values(scores).sort((a, b) => b.points - a.points);
                setRanking(sorted);
            } catch (err) {
                console.error("Erro ao carregar ranking da liga:", err);
            } finally {
                setLoading(false);
            }
        };

        // Fetch immediately on mount
        fetchLeagueRanking(true);

        // Then poll every 60 seconds
        const interval = setInterval(() => fetchLeagueRanking(false), 60000);

        return () => clearInterval(interval);
    }, [league.id]); // Apenas re-roda se trocar de liga

    const fetchLeagueRequests = async () => {
        if (!isAdmin) return;
        const { data, error } = await supabase
            .from('league_requests')
            .select('*')
            .eq('league_id', league.id)
            .eq('status', 'pending');
        
        if (error) console.error("Erro ao buscar solicitações:", error);
        else if (data) setLeagueRequests(data);
    };

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchLeagueRequests();
        }
    }, [activeTab, league.id]);


    const handleRemoveParticipant = async (email: string) => {
        if (confirm(`Remover ${email} da liga?`)) {
            const updatedParticipants = (league.participants || []).filter((p: string) => p !== email);
            const { error } = await supabase
                .from('leagues')
                .update({ participants: updatedParticipants })
                .eq('id', league.id);

            if (!error) {
                league.participants = updatedParticipants;
                // Update local ranking to reflect removal
                setRanking(prev => prev.filter(p => p.email !== email));
                alert('Participante removido.');
            }
        }
    };

    const handleUpdateLeague = async () => {
        if (!editedName.trim()) {
            alert("O nome da liga não pode estar vazio.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('leagues')
                .update({
                    name: editedName.trim(),
                    description: editedDescription.trim()
                })
                .eq('id', league.id);

            if (error) throw error;

            league.name = editedName.trim();
            league.description = editedDescription.trim();
            setIsEditing(false);
            alert("Informações da liga atualizadas com sucesso!");
        } catch (err) {
            console.error("Erro ao atualizar liga:", err);
            alert("Erro ao atualizar informações da liga.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!league.id) {
            alert("Erro: ID da liga não encontrado.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Delete all requests first to avoid foreign key errors
            const { error: reqError } = await supabase
                .from('league_requests')
                .delete()
                .eq('league_id', league.id);
            
            if (reqError) {
                console.error("Erro ao excluir solicitações:", reqError);
                throw new Error(`Erro ao excluir solicitações: ${reqError.message}`);
            }

            // 2. Delete the league itself
            const { error: leagueError, count } = await supabase
                .from('leagues')
                .delete({ count: 'exact' })
                .eq('id', league.id);

            if (leagueError) {
                console.error("Erro ao excluir liga:", leagueError);
                throw new Error(`Erro ao excluir liga: ${leagueError.message}`);
            }

            if (count === 0) {
                throw new Error("A liga não foi excluída no banco de dados. Isso geralmente acontece quando as políticas de segurança (RLS) do Supabase não permitem a exclusão. Verifique se a tabela 'leagues' tem uma política (Policy) de DELETE configurada para o usuário autenticado.");
            }
            
            setShowDeleteConfirm(false);
            alert("Liga excluída com sucesso!");
            onClose();
        } catch (err: any) {
            console.error("Falha total na exclusão:", err);
            alert(err.message || "Erro desconhecido ao excluir liga. Verifique sua conexão ou permissões.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveRequest = async (request: any) => {
        try {
            const updatedParticipants = [...(league.participants || [])];
            if (!updatedParticipants.some(p => p.toLowerCase() === request.user_email.toLowerCase())) {
                updatedParticipants.push(request.user_email.toLowerCase());
            }

            const { error: uError } = await supabase
                .from('leagues')
                .update({ participants: updatedParticipants })
                .eq('id', league.id);
            
            if (uError) throw uError;

            const { error: rError } = await supabase
                .from('league_requests')
                .update({ status: 'approved' })
                .eq('id', request.id);
            
            if (rError) throw rError;

            league.participants = updatedParticipants;
            setLeagueRequests(prev => prev.filter(r => r.id !== request.id));
            alert("Solicitação aprovada!");
        } catch (err) {
            console.error("Erro ao aprovar:", err);
            alert("Erro ao aprovar solicitação.");
        }
    };
    const handleLeaveLeague = async () => {
        if (!currentUser?.email) return;
        if (confirm('Deseja realmente sair desta liga?')) {
            try {
                const updatedParticipants = (league.participants || []).filter((p: string) => p.toLowerCase() !== currentUser.email?.toLowerCase());
                const { error } = await supabase
                    .from('leagues')
                    .update({ participants: updatedParticipants })
                    .eq('id', league.id);

                if (error) throw error;
                
                alert('Você saiu da liga.');
                onClose(); // Close modal and let Simulator refresh
            } catch (err) {
                console.error("Erro ao sair da liga:", err);
                alert("Erro ao sair da liga.");
            }
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('league_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);
        
        if (error) {
            console.error("Erro ao recusar:", error);
            alert("Erro ao recusar solicitação.");
        } else {
            setLeagueRequests(prev => prev.filter(r => r.id !== requestId));
            alert("Solicitação recusada.");
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 3000, padding: '20px'
        }}>
            <div className="premium-card" style={{
                width: '100%', maxWidth: '600px', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: isSpecialLeague ? '#dc262615' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Trophy size={24} color={isSpecialLeague ? '#dc2626' : 'white'} />
                        </div>
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                    <input 
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Nome da Liga"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: focusedField === 'name' ? '2px solid #dc2626' : '2px solid rgba(255,255,255,0.2)',
                                            padding: '4px',
                                            color: 'white',
                                            fontSize: '20px',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            width: '100%'
                                        }}
                                    />
                                    <input 
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        onFocus={() => setFocusedField('desc')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Descrição da Liga"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: focusedField === 'desc' ? '2px solid #dc2626' : '2px solid rgba(255,255,255,0.2)',
                                            padding: '4px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '13px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            width: '100%'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button 
                                            onClick={handleUpdateLeague}
                                            disabled={isSaving}
                                            style={{
                                                background: '#dc2626', color: 'white', border: 'none',
                                                padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                                                cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => { if(!isSaving) e.currentTarget.style.background = '#b91c1c' }}
                                            onMouseLeave={(e) => { if(!isSaving) e.currentTarget.style.background = '#dc2626' }}
                                        >
                                            {isSaving ? 'SALVANDO...' : 'SALVAR'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedName(league.name);
                                                setEditedDescription(league.description);
                                            }}
                                            disabled={isSaving}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
                                                padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                                                cursor: 'pointer', transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        >
                                            CANCELAR
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, textTransform: 'uppercase', color: 'white' }}>{league.name}</h2>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => setIsEditing(true)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '4px',
                                                    padding: '2px 8px',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            >
                                                EDITAR
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{league.description}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {!isSpecialLeague && !isAdmin && (league.participants || []).some((p: string) => p.toLowerCase() === currentUser?.email?.toLowerCase()) && (
                            <button 
                                onClick={handleLeaveLeague}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
                                DEIXAR LIGA
                            </button>
                        )}
                        <button onClick={onClose} style={{
                            background: 'none',
                            border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {isAdmin && (
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                        <button 
                            onClick={() => setActiveTab('ranking')}
                            style={{
                                flex: 1, padding: '14px', background: 'none', border: 'none',
                                color: activeTab === 'ranking' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700, borderBottom: activeTab === 'ranking' ? '2px solid #dc2626' : 'none',
                                cursor: 'pointer'
                            }}
                        >CLASSIFICAÇÃO</button>
                        <button 
                            onClick={() => setActiveTab('manage')}
                            style={{
                                flex: 1, padding: '14px', background: 'none', border: 'none',
                                color: activeTab === 'manage' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700, borderBottom: activeTab === 'manage' ? '2px solid #dc2626' : 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <Settings size={16} /> GERENCIAR
                        </button>
                    </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                    {activeTab === 'ranking' ? (
                        <div style={{ width: '100%' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando ranking...</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                                        <tr style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <th style={{ padding: '15px 20px', textAlign: 'left', width: '60px' }}>Pos</th>
                                            <th style={{ padding: '15px 20px', textAlign: 'left' }}>Membro</th>
                                            <th style={{ padding: '15px 20px', textAlign: 'center', width: '80px' }}>Pontos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((row, index) => (
                                            <tr key={row.email} style={{ 
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                background: row.email === currentUser?.email ? 'rgba(220, 38, 38, 0.05)' : 'transparent'
                                            }}>
                                                <td style={{ padding: '15px 20px', fontWeight: 800 }}>{index + 1}º</td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{row.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#dc2626' }}>{row.course}</div>
                                                </td>
                                                <td style={{ padding: '15px 20px', textAlign: 'center', fontSize: '16px', fontWeight: 900 }}>{row.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        </div>
                    ) : (
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Share Link */}
                            <section>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={16} color="#dc2626" /> Link de Convite
                                </h3>
                                <div style={{ 
                                    background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', display: 'flex',
                                    alignItems: 'center', gap: '12px'
                                }}>
                                    <input 
                                        readOnly 
                                        value={`${window.location.origin}/?join=${league.id}`}
                                        style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '12px' }}
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/?join=${league.id}`);
                                            alert('Link copiado!');
                                        }}
                                        style={{
                                            background: '#dc2626', color: 'white', border: 'none',
                                            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >COPIAR</button>
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Compartilhe este link para que novos participantes entrem na sua liga.
                                </p>
                            </section>

                            {/* Pending Requests */}
                            {leagueRequests.length > 0 && (
                                <section>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={16} color="#dc2626" /> Solicitações Pendentes ({leagueRequests.length})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {leagueRequests.map((request) => (
                                            <div key={request.id} style={{
                                                padding: '16px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.05)',
                                                border: '1px solid rgba(220, 38, 38, 0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{request.user_name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{request.user_email}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => handleApproveRequest(request)}
                                                        style={{
                                                            background: '#dc2626', color: 'white', border: 'none',
                                                            padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                                                            cursor: 'pointer'
                                                        }}
                                                    >ACEITAR</button>
                                                    <button 
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                                                            padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                                                            cursor: 'pointer'
                                                        }}
                                                    >RECUSAR</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Participants List */}
                            <section>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={16} color="#dc2626" /> Participantes ({league.participants?.length || 0})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {league.participants?.map((email: string) => (
                                        <div key={email} style={{
                                            padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                            <span style={{ fontSize: '14px' }}>{email} {email === league.owner_email && <Shield size={12} style={{ display: 'inline', marginLeft: 4, color: '#ffd700' }} />}</span>
                                            {email !== league.owner_email && (
                                                <button onClick={() => handleRemoveParticipant(email)} style={{
                                                    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'
                                                }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={{ borderTop: '1px solid rgba(255,0,0,0.1)', paddingTop: '24px' }}>
                                {showDeleteConfirm ? (
                                    <div style={{ 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>
                                            TEM CERTEZA? ESTA AÇÃO NÃO PODE SER DESFEITA.
                                        </p>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={handleDeleteLeague}
                                                disabled={isSaving}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '8px', 
                                                    background: '#dc2626', color: 'white', border: 'none', 
                                                    fontWeight: 800, cursor: 'pointer', fontSize: '12px',
                                                    opacity: isSaving ? 0.7 : 1
                                                }}
                                            >
                                                {isSaving ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
                                            </button>
                                            <button 
                                                onClick={() => setShowDeleteConfirm(false)}
                                                disabled={isSaving}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '8px', 
                                                    background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', 
                                                    fontWeight: 800, cursor: 'pointer', fontSize: '12px'
                                                }}
                                            >
                                                CANCELAR
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ef4444',
                                            background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
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
