import type { Match } from "../../../data/mockData";

import type { BeachTennisSummary, PenaltyResult } from "./types";
import { BEACH_POINT_LABELS, getLiveSetPoints } from "./utils";

type MatchScorePanelProps = {
    match: Match;
    beachSummary: BeachTennisSummary;
    isBeachTennis: boolean;
    penaltyResult: PenaltyResult | null;
};

export const MatchScorePanel = ({
    match,
    beachSummary,
    isBeachTennis,
    penaltyResult,
}: MatchScorePanelProps) => {
    return (
        <div className="match-card-score-panel">
            <div className="match-score match-card-score-main">
                <span>{isBeachTennis ? beachSummary.setsA : match.scoreA}</span>
                <span className="match-card-score-separator">X</span>
                <span>{isBeachTennis ? beachSummary.setsB : match.scoreB}</span>
            </div>

            {isBeachTennis && (
                <div className="match-card-score-details match-card-score-details-beach">
                    <div className="match-card-score-games">
                        Games: {beachSummary.gamesA} - {beachSummary.gamesB}
                    </div>

                    {match.status === "live" && (
                        <div className="match-card-score-points">
                            {(() => {
                                const isTieBreak = (match.stage === "Fase de Classificação" && match.scoreA === 6 && match.scoreB === 6)
                                    || (match.stage === "Fase Final" && match.scoreA === 8 && match.scoreB === 8);

                                return isTieBreak
                                    ? `Pontos: ${beachSummary.pointsA} - ${beachSummary.pointsB}`
                                    : `Pontos: ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsA, 3)]} - ${BEACH_POINT_LABELS[Math.min(beachSummary.pointsB, 3)]}`;
                            })()}
                        </div>
                    )}

                    {beachSummary.setResults.length > 0 && (
                        <div className="match-card-score-sets">
                            Sets: {beachSummary.setResults.join(" | ")}
                        </div>
                    )}
                </div>
            )}

            {["Vôlei", "Vôlei de Praia", "Tênis de Mesa", "Futevôlei"].includes(match.sport) && match.status === "live" && (
                <div className="match-card-score-live-points">
                    {(() => {
                        const { ptsA, ptsB } = getLiveSetPoints(match);
                        return `${ptsA} - ${ptsB} (Pt)`;
                    })()}
                </div>
            )}

            {penaltyResult && (
                <div className="match-card-score-penalty">
                    <div className="match-card-score-penalty-label">
                        🥅 PÊNALTIS
                    </div>

                    <div className="match-card-score-penalty-result">
                        {penaltyResult.scoredA} x {penaltyResult.scoredB}
                    </div>

                    <div className="match-card-score-penalty-winner">
                        {penaltyResult.winnerName} venceu
                    </div>
                </div>
            )}
        </div>
    );
};
