import { useMemo, type FC } from 'react';
import { Medal, Minus, Trophy, TrendingDown, TrendingUp, X } from 'lucide-react';
import { COURSE_EMBLEMS, mockRanking, type RankingEntry } from '../../../data/mockData';
import { useData } from '../../context/DataContext';
import ModalShell from '../ModalShell';
import './RankingModal.css';
import type { RankingModalProps } from './types';

const getTeamEmblem = (teamName: string, customEmblems: Record<string, string>) => {
  if (customEmblems[teamName]) {
    return customEmblems[teamName];
  }

  if (teamName in COURSE_EMBLEMS) {
    return `/emblemas/${COURSE_EMBLEMS[teamName]}`;
  }

  const foundCourse = Object.keys(COURSE_EMBLEMS).find((courseKey) =>
    courseKey.toLowerCase().includes(teamName.toLowerCase()),
  );

  return foundCourse ? `/emblemas/${COURSE_EMBLEMS[foundCourse]}` : null;
};

const getTrendIcon = (points: number, index: number) => {
  if (points > 100) return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
  if (points === 0) return <span title="Estável"><Minus size={14} color="var(--text-secondary)" /></span>;
  if (index % 3 === 0) return <span title="Caiu"><TrendingDown size={14} color="#ef4444" /></span>;
  return <span title="Subiu"><TrendingUp size={14} color="#10b981" /></span>;
};

const RankingModal: FC<RankingModalProps> = ({ onClose, useOfficialRanking }) => {
  const { ranking: liveRanking, customEmblems } = useData();

  const ranking = useMemo<RankingEntry[]>(
    () => (useOfficialRanking ? mockRanking : liveRanking),
    [liveRanking, useOfficialRanking],
  );

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      overlayClassName="rankingModalOverlay"
      cardClassName="premium-card animate-in rankingModalCard"
      showCloseButton={false}
    >
      <div className="rankingModalHeader">
        <div className="rankingModalHeaderInfo">
          <div className="rankingModalBadge">
            <Trophy size={24} color="white" />
          </div>
          <div>
            <h2 className="rankingModalTitle">Ranking Geral</h2>
          </div>
        </div>
        <button onClick={onClose} className="rankingModalCloseButton" aria-label="Fechar ranking">
          <X size={20} />
        </button>
      </div>

      <div className="rankingModalContent">
        <table className="rankingModalTable">
          <thead className="rankingModalTableHead">
            <tr className="rankingModalTableHeadRow">
              <th className="rankingModalCell">Pos</th>
              <th className="rankingModalCell">Atlética / Faculdade</th>
              <th className="rankingModalCell rankingModalCellCentered">Pontos</th>
              <th className="rankingModalCell rankingModalCellCentered">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, index) => {
              const [courseName, institution] = item.course.split(' - ');
              const isTop3 = index < 3;
              const highlightColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : null;

              return (
                <tr
                  key={item.course}
                  className={`hover-glow-subtle rankingModalRow ${isTop3 ? 'rankingModalRowTop3' : ''}`}
                  style={isTop3 && highlightColor ? { background: `linear-gradient(90deg, ${highlightColor}15 0%, transparent 100%)` } : undefined}
                >
                  <td className="rankingModalCell">
                    <div
                      className={`rankingModalPosition ${isTop3 ? 'rankingModalPositionTop3' : ''}`}
                      style={isTop3 && highlightColor ? { background: highlightColor, boxShadow: `0 0 15px ${highlightColor}40`, border: `1px solid ${highlightColor}` } : undefined}
                    >
                      {index + 1}º
                    </div>
                  </td>
                  <td className="rankingModalCell">
                    <div className="rankingModalTeamInfo">
                      <div className="rankingModalEmblemWrap">
                        {(() => {
                          const emblemUrl = getTeamEmblem(item.course, customEmblems);

                          if (emblemUrl) {
                            return (
                              <>
                                <img
                                  src={emblemUrl}
                                  alt={courseName}
                                  className="rankingModalEmblem"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                    const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <span className="rankingModalFallback" style={{ display: 'none' }}>
                                  {courseName[0]}
                                </span>
                              </>
                            );
                          }

                          return <span className="rankingModalFallback">{courseName[0]}</span>;
                        })()}
                      </div>

                      <div>
                        <div className={`rankingModalName ${isTop3 ? 'rankingModalNameTop3' : ''}`} style={isTop3 ? { color: 'white' } : undefined}>
                          {courseName}
                        </div>
                        <div className="rankingModalInstitution">{institution}</div>
                      </div>
                    </div>
                  </td>
                  <td className="rankingModalCell rankingModalCellCentered">
                    <div className="rankingModalPoints" style={isTop3 && highlightColor ? { color: highlightColor } : { color: 'white' }}>
                      {item.points}
                    </div>
                  </td>
                  <td className="rankingModalCell rankingModalCellCentered">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      {getTrendIcon(item.points, index)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rankingModalFooter">
        <div className="rankingModalFooterText">
          <Medal size={14} />
          Ranking oficial dos 45 cursos participantes • Atualizado em {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </ModalShell>
  );
};

export default RankingModal;