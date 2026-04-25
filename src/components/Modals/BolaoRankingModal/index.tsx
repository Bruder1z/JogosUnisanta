import React, { useEffect, useState } from 'react';
import { Crown, Eye, Medal, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import ModalShell from '../ModalShell';
import './BolaoRankingModal.css';
import type {
  BolaoPredictionMatchRow,
  BolaoPredictionRow,
  BolaoRankingModalProps,
  BolaoUserRanking,
  BolaoUserRow,
} from './types';

const SUPERADMIN_EMAIL = 'superadmin@gmail.com';

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const getWinner = (scoreA: number, scoreB: number) => {
  if (scoreA > scoreB) return 'A';
  if (scoreB > scoreA) return 'B';
  return 'draw';
};

const createUserScore = (
  email: string,
  name: string,
  surname?: string,
  preferredCourse?: string,
): BolaoUserRanking => ({
  email,
  name,
  surname,
  preferredCourse,
  avatar: undefined,
  points: 0,
  exactMatches: 0,
  winnerMatches: 0,
});

const buildRanking = (
  users: BolaoUserRow[],
  predictions: BolaoPredictionRow[],
  finishedMatches: ReturnType<typeof useData>['matches'],
) => {
  const userScores: Record<string, BolaoUserRanking> = {};

  users
    .filter((user) => user.role !== 'superadmin')
    .forEach((user) => {
      const isSuperAdmin = user.role === 'superadmin' || user.email === SUPERADMIN_EMAIL;
      userScores[user.email] = createUserScore(
        user.email,
        isSuperAdmin ? 'Mestre' : (user.name || user.email),
        isSuperAdmin ? undefined : user.surname || undefined,
        user.preferredcourse || undefined,
      );
    });

  predictions.forEach((prediction) => {
    if (!userScores[prediction.user_email]) {
      const isSuperAdmin = prediction.user_email === SUPERADMIN_EMAIL;
      userScores[prediction.user_email] = createUserScore(
        prediction.user_email,
        isSuperAdmin ? 'Mestre' : prediction.user_email.split('@')[0],
      );
    }
  });

  predictions.forEach((prediction) => {
    const match = finishedMatches.find((item) => item.id === prediction.match_id);
    const rankingEntry = userScores[prediction.user_email];

    if (!match || !rankingEntry || prediction.score_a === null || prediction.score_b === null) {
      return;
    }

    const predictedA = toNumber(prediction.score_a);
    const predictedB = toNumber(prediction.score_b);
    const actualA = match.scoreA;
    const actualB = match.scoreB;

    const isExact = predictedA === actualA && predictedB === actualB;
    const isWinner = getWinner(predictedA, predictedB) === getWinner(actualA, actualB);

    if (isExact) {
      rankingEntry.points += 3;
      rankingEntry.exactMatches += 1;
      return;
    }

    if (isWinner) {
      rankingEntry.points += 1;
      rankingEntry.winnerMatches += 1;
    }
  });

  return Object.values(userScores).sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.exactMatches !== left.exactMatches) return right.exactMatches - left.exactMatches;
    if (right.winnerMatches !== left.winnerMatches) return right.winnerMatches - left.winnerMatches;
    return left.name.localeCompare(right.name);
  });
};

const buildPredictionRows = (
  predictions: BolaoPredictionRow[],
  matches: ReturnType<typeof useData>['matches'],
): BolaoPredictionMatchRow[] =>
  predictions
    .map((prediction) => ({
      prediction,
      match: matches.find((match) => match.id === prediction.match_id),
    }))
    .filter((row): row is BolaoPredictionMatchRow => Boolean(row.match));

const BolaoRankingModal: React.FC<BolaoRankingModalProps> = ({ onClose }) => {
  const { matches } = useData();
  const { user: currentUser } = useAuth();
  const [ranking, setRanking] = useState<BolaoUserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPredictions, setUserPredictions] = useState<BolaoPredictionRow[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);

  const fetchUserPredictions = async (email: string) => {
    setLoadingPreds(true);
    const { data: preds } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_email', email);

    setUserPredictions((preds || []) as BolaoPredictionRow[]);
    setLoadingPreds(false);
  };

  useEffect(() => {
    let isActive = true;

    const fetchGlobalRanking = async (isInitial = false) => {
      if (isInitial) setLoading(true);

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('email, name, surname, preferredcourse, role');

        if (usersError) console.error('Error fetching users:', usersError);

        const { data: predsData, error: predsError } = await supabase
          .from('predictions')
          .select('*');

        if (predsError) console.error('Error fetching predictions:', predsError);

        if (!isActive) return;

        const finishedMatches = matches.filter((match) => match.status === 'finished');
        const sortedRanking = buildRanking(
          (usersData || []) as BolaoUserRow[],
          (predsData || []) as BolaoPredictionRow[],
          finishedMatches,
        );

        setRanking(sortedRanking);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchGlobalRanking(true);
    const interval = setInterval(() => fetchGlobalRanking(false), 60000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [matches]);

  const handleTogglePredictions = async (email: string) => {
    if (selectedUser === email) {
      setSelectedUser(null);
      setUserPredictions([]);
      return;
    }

    setSelectedUser(email);
    await fetchUserPredictions(email);
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      overlayClassName="bolaoRankingOverlay"
      cardClassName="premium-card animate-in bolaoRankingModal"
      showCloseButton={false}
    >
      <div className="bolaoRankingHeader">
        <div className="bolaoRankingHeaderContent">
          <div className="bolaoRankingHeaderIcon">
            <Crown size={24} color="white" />
          </div>
          <div>
            <h2 className="bolaoRankingTitle">Ranking Geral</h2>
            <p className="bolaoRankingSubtitle">Classificação geral dos usuários</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bolaoRankingCloseButton"
          aria-label="Fechar ranking"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bolaoRankingContent">
        {loading ? (
          <div className="bolaoRankingLoading">Carregando ranking...</div>
        ) : (
          <table className="bolaoRankingTable">
            <thead className="bolaoRankingTableHead">
              <tr className="bolaoRankingTableHeadRow">
                <th className="bolaoRankingTh bolaoRankingThCenter" style={{ width: '60px' }}>Pos</th>
                <th className="bolaoRankingTh">Usuário</th>
                <th className="bolaoRankingTh bolaoRankingThCenter">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((user, index) => {
                const isTop3 = index < 3;
                const highlightColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : undefined;
                const isSelected = selectedUser === user.email;
                const predictionRows = isSelected ? buildPredictionRows(userPredictions, matches) : [];

                return (
                  <React.Fragment key={user.email}>
                    <tr
                      className={`bolaoRankingRow ${isTop3 ? 'bolaoRankingTop3' : ''} bolaoRankingRowHover`}
                      style={isTop3 ? { background: `linear-gradient(90deg, ${highlightColor}15 0%, transparent 100%)` } : undefined}
                    >
                      <td className="bolaoRankingCell bolaoRankingCellCenter">
                        <div
                          className={`bolaoRankingBadge ${isTop3 ? 'bolaoRankingBadgeTop3' : ''}`}
                          style={isTop3 ? {
                            background: highlightColor,
                            border: `1px solid ${highlightColor}`,
                            boxShadow: `0 0 15px ${highlightColor}40`,
                            width: 32,
                            height: 32,
                            fontSize: 15,
                            color: '#000',
                          } : undefined}
                        >
                          {index + 1}º
                        </div>
                      </td>
                      <td className="bolaoRankingCell">
                        <div className="bolaoRankingUserInfo">
                          <div className="bolaoRankingAvatar">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="bolaoRankingAvatarImage" />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className={`bolaoRankingUserName ${isTop3 ? 'bolaoRankingUserNameTop3' : ''}`}>
                              {user.name} {user.surname ? user.surname : ''}
                            </div>
                            {user.preferredCourse ? (
                              <span className="bolaoRankingCourse">({user.preferredCourse})</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="bolaoRankingCell bolaoRankingCellCenter">
                        <div className="bolaoRankingPointsWrap">
                          <span
                            className="bolaoRankingPoints"
                            style={isTop3 ? { color: highlightColor } : undefined}
                          >
                            {user.points}
                          </span>
                          {currentUser?.email === user.email && (
                            <button
                              className={`bolaoRankingPreviewButton ${isSelected ? 'bolaoRankingPreviewButtonSelected' : ''}`}
                              title={isSelected ? 'Fechar partidas' : 'Ver partidas'}
                              onClick={() => {
                                void handleTogglePredictions(user.email);
                              }}
                            >
                              <Eye size={20} color={isSelected ? 'white' : '#dc2626'} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isSelected && (
                      <tr className="bolaoRankingDetailsRow">
                        <td colSpan={3}>
                          <div className="bolaoRankingDetailsPanel">
                            {loadingPreds ? (
                              <div className="bolaoRankingPredictionsLoading">Carregando partidas...</div>
                            ) : predictionRows.length === 0 ? (
                              <div className="bolaoRankingPredictionsEmpty">Nenhum palpite encontrado.</div>
                            ) : (
                              <table className="bolaoRankingPredictionsTable">
                                <thead>
                                  <tr className="bolaoRankingPredictionsHeadRow">
                                    <th className="bolaoRankingPredictionCell" style={{ textAlign: 'left' }}>Partida</th>
                                    <th className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">Palpite</th>
                                    <th className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">Real</th>
                                    <th className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">Correto?</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {predictionRows.map(({ prediction, match }) => {
                                    const isFinished = match.status === 'finished';
                                    const isExact = isFinished && toNumber(prediction.score_a) === match.scoreA && toNumber(prediction.score_b) === match.scoreB;
                                    const predictedWinner = getWinner(toNumber(prediction.score_a), toNumber(prediction.score_b));
                                    const actualWinner = getWinner(match.scoreA, match.scoreB);
                                    const isWinner = isFinished && !isExact && predictedWinner === actualWinner;

                                    return (
                                      <tr
                                        key={`${prediction.match_id}-${prediction.user_email}`}
                                        style={{ background: isExact ? '#16a34a55' : isWinner ? '#facc1555' : 'transparent' }}
                                      >
                                        <td className="bolaoRankingPredictionCell">{match.teamA.name} x {match.teamB.name}</td>
                                        <td className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">{prediction.score_a} x {prediction.score_b}</td>
                                        <td className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">{isFinished ? `${match.scoreA} x ${match.scoreB}` : '-'}</td>
                                        <td className="bolaoRankingPredictionCell bolaoRankingPredictionCellCenter">
                                          {isFinished ? (
                                            isExact ? (
                                              <span className="bolaoRankingPredictionExact">Exato</span>
                                            ) : isWinner ? (
                                              <span className="bolaoRankingPredictionWinner">Vencedor</span>
                                            ) : (
                                              <span className="bolaoRankingPredictionWrong">Errado</span>
                                            )
                                          ) : (
                                            <span className="bolaoRankingPredictionPending">-</span>
                                          )}
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
                    )}
                  </React.Fragment>
                );
              })}
              {ranking.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="bolaoRankingEmpty">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bolaoRankingFooter">
        <div className="bolaoRankingFooterText">
          <Medal size={14} />
          Placar Exato (+3pts) • Vencedor Correto (+1pt)
        </div>
      </div>
    </ModalShell>
  );
};

export default BolaoRankingModal;