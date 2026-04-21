import { type FC } from "react";
import { X, Star, User } from "lucide-react";
import { type Match, type MatchEvent } from "../../data/mockData";

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
      if (event.type === "goal" && event.player && event.teamId) {
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
        teamName: match.teamA.name.split(" - ")[0],
        teamCourse: match.teamA.course,
        players: teamAPlayersList,
        totalPoints: teamAPlayersList.reduce((sum, p) => sum + p.points, 0),
      },
      teamB: {
        teamName: match.teamB.name.split(" - ")[0],
        teamCourse: match.teamB.course,
        players: teamBPlayersList,
        totalPoints: teamBPlayersList.reduce((sum, p) => sum + p.points, 0),
      },
    };
  };

  const stats = calculatePlayerStats();
  const hasStats = stats.teamA.players.length > 0 || stats.teamB.players.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-hover)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Estatísticas dos Jogadores
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {match.sport} {match.category}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--bg-primary)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={24} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {!hasStats ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <User size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p>Nenhuma estatística disponível ainda.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Team A Stats */}
              {stats.teamA.players.length > 0 && (
                <div
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--accent-color)",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.teamA.teamName}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "16px",
                    }}
                  >
                    Total: {stats.teamA.totalPoints} pontos
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {stats.teamA.players.map((player, index) => (
                      <div
                        key={player.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          background: "var(--bg-card)",
                          borderRadius: "8px",
                          border:
                            index === 0
                              ? "1px solid rgba(255, 215, 0, 0.3)"
                              : "1px solid var(--border-color)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {index === 0 && <Star size={16} color="#ffd700" fill="#ffd700" />}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: index === 0 ? 700 : 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {player.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 900,
                            color: index === 0 ? "#ffd700" : "var(--accent-color)",
                          }}
                        >
                          {player.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team B Stats */}
              {stats.teamB.players.length > 0 && (
                <div
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--accent-color)",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.teamB.teamName}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "16px",
                    }}
                  >
                    Total: {stats.teamB.totalPoints} pontos
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {stats.teamB.players.map((player, index) => (
                      <div
                        key={player.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          background: "var(--bg-card)",
                          borderRadius: "8px",
                          border:
                            index === 0
                              ? "1px solid rgba(255, 215, 0, 0.3)"
                              : "1px solid var(--border-color)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {index === 0 && <Star size={16} color="#ffd700" fill="#ffd700" />}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: index === 0 ? 700 : 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {player.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 900,
                            color: index === 0 ? "#ffd700" : "var(--accent-color)",
                          }}
                        >
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
