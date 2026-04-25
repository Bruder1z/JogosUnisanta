import type { MatchTeam } from "./types";
import { getTeamEmblem } from "./utils";

type TeamDisplayProps = {
    team: MatchTeam;
};

export const TeamDisplay = ({ team }: TeamDisplayProps) => {
    const emblemUrl = getTeamEmblem(team);

    return (
        <div className="match-card-team">
            <div className="match-card-team-emblem">
                {emblemUrl ? (
                    <img
                        src={emblemUrl}
                        alt={team.name}
                        className="match-card-team-emblem-image"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                            const fallback = event.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "block";
                        }}
                    />
                ) : null}

                <div className="match-card-team-logo" style={{ display: emblemUrl ? "none" : "block" }}>
                    {team.logo}
                </div>
            </div>

            <div className="match-team-name match-card-team-name">
                {team.name.split(" - ")[0]}
            </div>

            <div className="match-card-team-faculty">
                {team.name.split(" - ")[1]}
            </div>

            {team.faculty && (
                <div className="match-card-team-course">
                    {team.faculty}
                </div>
            )}
        </div>
    );
};
