import { type FC } from 'react';
import { X, Star, User } from 'lucide-react';
import { type Match, type MatchEvent } from '../../../data/mockData';
import './styles.css';

interface PlayerStatsProps {
  match: Match;
  onClose: () => void;
}

interface PlayerStat {
  name: string;
  points: number;
}

interface TeamStats {
  teamName: string;
  teamCourse: string;
  players: PlayerStat[];
  totalPoints: number;
}

const PlayerStats: FC<PlayerStatsProps> = ({ match, onClose }) => {
  const calculatePlayerStats = (): { teamA: TeamStats; teamB: TeamStats } => {
    const teamAPlayers: { [key: string]: PlayerStat } = {};
    const teamBPlayers: { [key: string]: PlayerStat } = {};

    match.events?.forEach((event: MatchEvent) => {
      if (event.type === 'goal' && event.player && event.teamId) {
        const pointValue = Number(event.description?.match(/\+(\d+)/)?.[1] || 2);

        if (event.teamId === match.teamA.id) {
          if (!teamAPlayers[event.player]) {
            teamAPlayers[event.player] = { name: event.player, points: 0 };
          }
          teamAPlayers[event.player].points += pointValue;
        } else if (event.teamId === match.teamB.id) {
          if (!teamBPlayers[event.player]) {
            teamBPlayers[event.player] = { name: event.player, points: 0 };
          }
          teamBPlayers[event.player].points += pointValue;
        }
      }
    });

    const teamAPlayersList = Object.values(teamAPlayers).sort((a, b) => b.points - a.points);
    const teamBPlayersList = Object.values(teamBPlayers).sort((a, b) => b.points - a.points);

    return {
      teamA: {
        teamName: match.teamA.name.split(' - ')[0],
        teamCourse: match.teamA.course,
        players: teamAPlayersList,
        totalPoints: teamAPlayersList.reduce((sum, player) => sum + player.points, 0),
      },
      teamB: {
        teamName: match.teamB.name.split(' - ')[0],
        teamCourse: match.teamB.course,
        players: teamBPlayersList,
        totalPoints: teamBPlayersList.reduce((sum, player) => sum + player.points, 0),
      },
    };
  };

  const stats = calculatePlayerStats();
  const hasStats = stats.teamA.players.length > 0 || stats.teamB.players.length > 0;

  return (
    <div className="player-stats-overlay" onClick={onClose}>
      <div className="player-stats-card" onClick={(event) => event.stopPropagation()}>
        <div className="player-stats-header">
          <div>
            <h2 className="player-stats-title">Estatísticas dos Jogadores</h2>
            <p className="player-stats-subtitle">
              {match.sport} • {match.category}
            </p>
          </div>

          <button
            onClick={onClose}
            className="player-stats-close-btn"
          >
            <X size={24} color="var(--text-secondary)" />
          </button>
        </div>

        <div className="player-stats-content">
          {!hasStats ? (
            <div className="player-stats-empty-state">
              <User size={48} className="player-stats-empty-icon" />
              <p>Nenhuma estatística disponível ainda.</p>
            </div>
          ) : (
            <div className="player-stats-grid">
              {stats.teamA.players.length > 0 && (
                <div className="player-stats-team-card">
                  <h3 className="player-stats-team-name">{stats.teamA.teamName}</h3>
                  <p className="player-stats-team-total">Total: {stats.teamA.totalPoints} pontos</p>

                  <div className="player-stats-players-list">
                    {stats.teamA.players.map((player, index) => (
                      <div
                        key={player.name}
                        className={`player-stats-player-row ${index === 0 ? 'is-top' : ''}`}
                      >
                        <div className="player-stats-player-name-wrap">
                          {index === 0 && <Star size={16} color="#ffd700" fill="#ffd700" />}
                          <span className={`player-stats-player-name ${index === 0 ? 'is-top' : ''}`}>
                            {player.name}
                          </span>
                        </div>
                        <span className={`player-stats-player-points ${index === 0 ? 'is-top' : ''}`}>
                          {player.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.teamB.players.length > 0 && (
                <div className="player-stats-team-card">
                  <h3 className="player-stats-team-name">{stats.teamB.teamName}</h3>
                  <p className="player-stats-team-total">Total: {stats.teamB.totalPoints} pontos</p>

                  <div className="player-stats-players-list">
                    {stats.teamB.players.map((player, index) => (
                      <div
                        key={player.name}
                        className={`player-stats-player-row ${index === 0 ? 'is-top' : ''}`}
                      >
                        <div className="player-stats-player-name-wrap">
                          {index === 0 && <Star size={16} color="#ffd700" fill="#ffd700" />}
                          <span className={`player-stats-player-name ${index === 0 ? 'is-top' : ''}`}>
                            {player.name}
                          </span>
                        </div>
                        <span className={`player-stats-player-points ${index === 0 ? 'is-top' : ''}`}>
                          {player.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;