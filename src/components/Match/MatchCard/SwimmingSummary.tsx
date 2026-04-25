import type { Match } from "../../../data/mockData";

import { getCourseEmblem } from "./utils";
import type { SwimmingPodiumEntry } from "./types";

type SwimmingSummaryProps = {
    match: Match;
    podium: SwimmingPodiumEntry[];
    participants: Match["teamA"][];
};

export const SwimmingSummary = ({ match, podium, participants }: SwimmingSummaryProps) => {
    return (
        <div className="match-card-swimming-summary">
            {match.status === "finished" ? (
                <div className="match-card-swimming-podium-list">
                    {podium.map((podiumTeam, index) => (
                        <div
                            key={`${podiumTeam.courseLabel}-${index}`}
                            className="match-card-swimming-podium-item"
                        >
                            {getCourseEmblem(podiumTeam.courseKey) && (
                                <div className="match-card-swimming-podium-emblem">
                                    <img
                                        src={getCourseEmblem(podiumTeam.courseKey) || ""}
                                        alt={podiumTeam.courseLabel}
                                        className="match-card-swimming-podium-emblem-image"
                                    />
                                </div>
                            )}

                            <div className={`match-card-swimming-podium-rank match-card-swimming-podium-rank-${index + 1}`}>
                                {index + 1}º LUGAR
                            </div>

                            <div className="match-card-swimming-podium-athlete">
                                {podiumTeam.athleteName ? podiumTeam.athleteName : "Atleta não informado"}
                                {podiumTeam.athleteTime ? ` (${podiumTeam.athleteTime})` : ""}
                            </div>

                            <div className="match-card-swimming-podium-course">
                                {podiumTeam.courseLabel}
                            </div>

                            <div className="match-card-swimming-podium-faculty">
                                {podiumTeam.faculty}
                            </div>
                        </div>
                    ))}

                    {podium.length === 0 && (
                        <div className="match-card-swimming-empty">
                            Pódio ainda não disponível.
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="match-card-swimming-title">
                        CURSOS PARTICIPANTES
                    </div>

                    <div className="match-card-swimming-participants">
                        {participants.map((team) => (
                            <div
                                key={team.id}
                                className="match-card-swimming-participant"
                            >
                                {getCourseEmblem(team.course) && (
                                    <img
                                        src={getCourseEmblem(team.course) || ""}
                                        alt={team.name}
                                        className="match-card-swimming-participant-emblem"
                                    />
                                )}

                                <span className="match-card-swimming-participant-label">
                                    {team.name.split(" - ")[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
