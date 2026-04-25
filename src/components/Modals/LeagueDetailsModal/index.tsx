import React, { useEffect, useState } from 'react';
import { Plus, Settings, Shield, Trash2, Trophy, Users, X } from 'lucide-react';
import { useNotification } from '../../NotificationContext';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ModalShell from '../ModalShell';
import './LeagueDetailsModal.css';
import type {
  LeagueDetailsLeague,
  LeagueDetailsModalProps,
  LeagueRankingRow,
  LeagueRequestRow,
} from './types';

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

const normalizeLeague = (league: LeagueDetailsLeague): LeagueDetailsLeague => ({
  ...league,
  participants: league.participants ?? [],
});

const LeagueDetailsModal: React.FC<LeagueDetailsModalProps> = ({ league: rawLeague, onClose }) => {
  const league = normalizeLeague(rawLeague);
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth();
  const { matches } = useData();
  const [ranking, setRanking] = useState<LeagueRankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'manage'>('ranking');
  const [leagueRequests, setLeagueRequests] = useState<LeagueRequestRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(league.name);
  const [editedDescription, setEditedDescription] = useState(league.description);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'desc' | null>(null);

  const isAdmin = league.owner_email === currentUser?.email || currentUser?.role === 'superadmin';
  const isSpecialLeague = league.type === 'global' || league.type === 'course';
  const canManage = currentUser?.role === 'superadmin' || league.owner_email === currentUser?.email;

  useEffect(() => {
    const fetchLeagueRanking = async (isInitial = false) => {
      if (isInitial) setLoading(true);

      try {
        let usersQuery = supabase.from('users').select('email, name, surname, preferredcourse, role');

        if (league?.type === 'course') {
          usersQuery = usersQuery.eq('preferredcourse', league.course);
        } else if (league?.type === 'private') {
          usersQuery = usersQuery.in('email', parseParticipants(league.participants));
        }

        const { data: usersData } = await usersQuery;
        if (!usersData) return;

        const { data: predsData } = await supabase.from('predictions').select('*');
        const finishedMatches = matches.filter((match) => match.status === 'finished');
        const validPreds = predsData || [];
        const scores: Record<string, LeagueRankingRow> = {};

        usersData.forEach((user) => {
          const isSuperAdmin = user.role === 'superadmin' || user.email === 'superadmin@gmail.com';
          scores[user.email] = {
            email: user.email,
            name: isSuperAdmin ? 'Mestre' : `${user.name} ${user.surname || ''}`.trim(),
            course: user.preferredcourse,
            points: 0,
          };
        });

        validPreds.forEach((pred: any) => {
          const match = finishedMatches.find((item) => item.id === pred.match_id);

          if (match && scores[pred.user_email]) {
            const predA = Number(pred.score_a);
            const predB = Number(pred.score_b);
            const actualA = match.scoreA;
            const actualB = match.scoreB;

            const isExact = predA === actualA && predB === actualB;
            const predWinner = predA > predB ? 'A' : predB > predA ? 'B' : 'draw';
            const actualWinner = actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'draw';

            if (isExact) scores[pred.user_email].points += 3;
            else if (predWinner === actualWinner) scores[pred.user_email].points += 1;
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

    if (error) console.error('Erro ao buscar solicitações:', error);
    else if (data) setLeagueRequests(data as LeagueRequestRow[]);
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      void fetchLeagueRequests();
    }
  }, [activeTab, league.id, isAdmin]);

  const handleRemoveParticipant = async (email: string) => {
    if (!confirm(`Remover ${email} da liga?`)) return;

    const updatedParticipants = parseParticipants(league.participants).filter((participant) => participant !== email);
    const { error } = await supabase
      .from('leagues')
      .update({ participants: updatedParticipants })
      .eq('id', league.id);

    if (!error) {
      league.participants = updatedParticipants;
      setRanking((previous) => previous.filter((item) => item.email !== email));
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
      const { error: requestsError } = await supabase
        .from('league_requests')
        .delete()
        .eq('league_id', league.id);

      if (requestsError) {
        console.error('Erro ao excluir solicitações:', requestsError);
        throw new Error(`Erro ao excluir solicitações: ${requestsError.message}`);
      }

      const { error: leagueError, count } = await supabase
        .from('leagues')
        .delete({ count: 'exact' })
        .eq('id', league.id);

      if (leagueError) {
        console.error('Erro ao excluir liga:', leagueError);
        throw new Error(`Erro ao excluir liga: ${leagueError.message}`);
      }

      if (count === 0) {
        throw new Error("A liga não foi excluída no banco de dados. Isso geralmente acontece quando as políticas de segurança (RLS) do Supabase não permitem a exclusão. Verifique se a tabela 'leagues' tem uma política (Policy) de DELETE configurada para o usuário autenticado.");
      }

      setShowDeleteConfirm(false);
      showNotification('Liga excluída com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Falha total na exclusão:', error);
      showNotification(error.message || 'Erro desconhecido ao excluir liga. Verifique sua conexão ou permissões.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveRequest = async (request: LeagueRequestRow) => {
    try {
      const updatedParticipants = parseParticipants(league.participants);

      if (!updatedParticipants.some((participant) => participant.toLowerCase() === request.user_email.toLowerCase())) {
        updatedParticipants.push(request.user_email.toLowerCase());
      }

      const { error: updateError } = await supabase
        .from('leagues')
        .update({ participants: updatedParticipants })
        .eq('id', league.id);

      if (updateError) throw updateError;

      const { error: requestError } = await supabase
        .from('league_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      league.participants = updatedParticipants;
      setLeagueRequests((previous) => previous.filter((item) => item.id !== request.id));
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
      const updatedParticipants = parseParticipants(league.participants).filter(
        (participant) => participant.toLowerCase() !== currentUser.email.toLowerCase(),
      );

      const { error } = await supabase
        .from('leagues')
        .update({ participants: updatedParticipants })
        .eq('id', league.id);

      if (error) throw error;

      alert('Você saiu da liga.');
      onClose();
    } catch (error) {
      console.error('Erro ao sair da liga:', error);
      alert('Erro ao sair da liga.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('league_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Erro ao recusar:', error);
      showNotification('Erro ao recusar solicitação.');
      return;
    }

    setLeagueRequests((previous) => previous.filter((request) => request.id !== requestId));
    showNotification('Solicitação recusada.');
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      overlayClassName="leagueDetailsOverlay"
      cardClassName="premium-card leagueDetailsModal"
      showCloseButton={false}
    >
      <div className="leagueDetailsHeader">
        <div className="leagueDetailsHeaderRow">
          <div className="leagueDetailsHeaderIcon" style={{ background: isSpecialLeague ? '#dc262615' : 'rgba(255,255,255,0.05)' }}>
            <Trophy size={24} color={isSpecialLeague ? '#dc2626' : 'white'} />
          </div>
          <div className="leagueDetailsHeaderMain">
            {isEditing ? (
              <div className="leagueDetailsEditForm">
                <input
                  value={editedName}
                  onChange={(event) => setEditedName(event.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Nome da Liga"
                  className="leagueDetailsEditInput leagueDetailsEditName"
                  style={{ borderBottom: focusedField === 'name' ? '2px solid #dc2626' : '2px solid rgba(255,255,255,0.2)' }}
                />
                <input
                  value={editedDescription}
                  onChange={(event) => setEditedDescription(event.target.value)}
                  onFocus={() => setFocusedField('desc')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Descrição da Liga"
                  className="leagueDetailsEditInput leagueDetailsEditDescription"
                  style={{ borderBottom: focusedField === 'desc' ? '2px solid #dc2626' : '2px solid rgba(255,255,255,0.2)' }}
                />
                <div className="leagueDetailsEditActions">
                  <button
                    onClick={handleUpdateLeague}
                    disabled={isSaving}
                    className={`leagueDetailsSmallAction leagueDetailsSmallPrimary ${isSaving ? 'leagueDetailsSaving' : ''}`}
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
                    className="leagueDetailsSmallAction leagueDetailsSmallSecondary"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="leagueDetailsTitleRow">
                  <h2 className="leagueDetailsTitle">{league.name}</h2>
                  {isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="leagueDetailsEditButton">
                      EDITAR
                    </button>
                  )}
                </div>
                <p className="leagueDetailsDescription">{league.description}</p>
              </>
            )}
          </div>
        </div>

        <div className="leagueDetailsHeaderActions">
          {!isSpecialLeague && !isAdmin && parseParticipants(league.participants).some(
            (participant) => participant.toLowerCase() === currentUser?.email?.toLowerCase(),
          ) && (
              <button onClick={handleLeaveLeague} className="leagueDetailsLeaveButton">
                <Shield size={12} /> DEIXAR LIGA
              </button>
            )}
          <button onClick={onClose} className="leagueDetailsCloseButton">
            <X size={24} />
          </button>
        </div>
      </div>

      {canManage ? (
        <div className="leagueDetailsTabs">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`leagueDetailsTabButton ${activeTab === 'ranking' ? 'leagueDetailsTabButtonActive' : ''}`}
          >
            CLASSIFICAÇÃO
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`leagueDetailsTabButton leagueDetailsTabButtonManage ${activeTab === 'manage' ? 'leagueDetailsTabButtonActive' : ''}`}
          >
            <Settings size={16} /> GERENCIAR
          </button>
        </div>
      ) : (
        <div className="leagueDetailsTabs">
          <button
            onClick={() => setActiveTab('ranking')}
            className="leagueDetailsTabButton leagueDetailsTabButtonActive"
          >
            CLASSIFICAÇÃO
          </button>
        </div>
      )}

      <div className="leagueDetailsContent">
        {activeTab === 'ranking' ? (
          <div className="leagueDetailsContentInner" style={{ paddingTop: 0 }}>
            {loading ? (
              <div className="leagueDetailsLoading">Carregando ranking...</div>
            ) : (
              <table className="leagueDetailsTable">
                <thead className="leagueDetailsTableHead">
                  <tr className="leagueDetailsTableHeadRow">
                    <th className="leagueDetailsTh leagueDetailsThLeft" style={{ width: '60px' }}>Pos</th>
                    <th className="leagueDetailsTh leagueDetailsThLeft">Membro</th>
                    <th className="leagueDetailsTh leagueDetailsThCenter" style={{ width: '80px' }}>Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row, index) => (
                    <tr key={row.email} className={`leagueDetailsRow ${row.email === currentUser?.email ? 'leagueDetailsRowCurrentUser' : ''}`}>
                      <td className={`leagueDetailsTd leagueDetailsRank ${index === 0 ? 'leagueDetailsRankTop1' : index === 1 ? 'leagueDetailsRankTop2' : index === 2 ? 'leagueDetailsRankTop3' : ''}`}>
                        {index + 1}º
                      </td>
                      <td className="leagueDetailsTd leagueDetailsTdLeft">
                        <div className="leagueDetailsMemberName">{row.name}</div>
                        <div className="leagueDetailsMemberCourse">{row.course}</div>
                      </td>
                      <td className="leagueDetailsTd leagueDetailsPoints">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="leagueDetailsContentInner">
            <section>
              <h3 className="leagueDetailsSectionTitle">
                <Plus size={16} color="#dc2626" /> Link de Convite
              </h3>
              <div className="leagueDetailsLinkBox">
                <input
                  readOnly
                  value={`${window.location.origin}/?join=${league.id}`}
                  className="leagueDetailsLinkInput"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?join=${league.id}`);
                    showNotification('Link copiado!');
                  }}
                  className="leagueDetailsCopyButton"
                >
                  COPIAR
                </button>
              </div>
              <p className="leagueDetailsSectionNote">Compartilhe este link para que novos participantes entrem na sua liga.</p>
            </section>

            {leagueRequests.length > 0 && (
              <section>
                <h3 className="leagueDetailsSectionTitle">
                  <Users size={16} color="#dc2626" /> Solicitações Pendentes ({leagueRequests.length})
                </h3>
                <div className="leagueDetailsRequestList">
                  {leagueRequests.map((request) => (
                    <div key={request.id} className="leagueDetailsRequestCard">
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{request.user_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{request.user_email}</div>
                      </div>
                      <div className="leagueDetailsRequestActions">
                        <button onClick={() => handleApproveRequest(request)} className="leagueDetailsRequestAction leagueDetailsRequestActionAccept">ACEITAR</button>
                        <button onClick={() => handleRejectRequest(request.id)} className="leagueDetailsRequestAction leagueDetailsRequestActionReject">RECUSAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="leagueDetailsSectionTitle">
                <Users size={16} color="#dc2626" /> Participantes ({parseParticipants(league.participants).length || '-'})
              </h3>
              <div className="leagueDetailsParticipantList">
                {parseParticipants(league.participants).map((email) => (
                  <div key={email} className="leagueDetailsParticipantCard">
                    <span className="leagueDetailsParticipantEmail">
                      {email}
                      {email === league.owner_email && <Shield size={12} style={{ display: 'inline', marginLeft: 4, color: '#ffd700' }} />}
                    </span>
                    {email !== league.owner_email && (
                      <button onClick={() => handleRemoveParticipant(email)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="leagueDetailsDeleteSection">
              {showDeleteConfirm ? (
                <div className="leagueDetailsDeleteBox">
                  <p className="leagueDetailsDeleteText">TEM CERTEZA? ESTA AÇÃO NÃO PODE SER DESFEITA.</p>
                  <div className="leagueDetailsDeleteActions">
                    <button onClick={handleDeleteLeague} disabled={isSaving} className="leagueDetailsDeleteConfirmButton" style={isSaving ? { opacity: 0.7 } : undefined}>
                      {isSaving ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={isSaving} className="leagueDetailsCancelButton">
                      CANCELAR
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="leagueDetailsDangerButton">
                  EXCLUIR LIGA PERMANENTEMENTE
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default LeagueDetailsModal;