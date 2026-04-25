import type { FC } from "react";

import type { MatchCardProps } from "./types";
import {
    getBeachTennisSummary,
    getPenaltyResult,
    getSwimmingParticipants,
    getSwimmingPodium,
} from "./utils";
import { MatchHeader } from "./MatchHeader";
import { MatchFooter } from "./MatchFooter";
import { MatchScorePanel } from "./MatchScorePanel";
import { SwimmingSummary } from "./SwimmingSummary";
import { TeamDisplay } from "./TeamDisplay";

import "./MatchCard.css";

const MatchCard: FC<MatchCardProps> = ({ match, onClick }) => {
    const isBeachTennis = match.sport === "Beach Tennis";
    const isSwimming = match.sport === "Natação";
    const beachSummary = getBeachTennisSummary(match);
    const penaltyResult = getPenaltyResult(match);
    const swimmingParticipants = isSwimming
        ? (getSwimmingParticipants(match).length ? getSwimmingParticipants(match) : [match.teamA, match.teamB])
        : [];
    const swimmingPodium = isSwimming && match.status === "finished"
        ? getSwimmingPodium(match, swimmingParticipants)
        : [];

    return (
        <div
            className="premium-card hover-glow match-card-wrapper"
            onClick={onClick}
        >
            <MatchHeader
                sport={match.sport}
                category={match.category}
                stage={match.stage}
                status={match.status}
                time={match.time}
            />

            {isSwimming ? (
                <SwimmingSummary
                    match={match}
                    podium={swimmingPodium}
                    participants={swimmingParticipants}
                />
            ) : (
                <div className="match-card-main-row">
                    <TeamDisplay team={match.teamA} />

                    <MatchScorePanel
                        match={match}
                        beachSummary={beachSummary}
                        isBeachTennis={isBeachTennis}
                        penaltyResult={penaltyResult}
                    />

                    <TeamDisplay team={match.teamB} />
                </div>
            )}

            <MatchFooter date={match.date} location={match.location} />
        </div>
    );
};

export default MatchCard;