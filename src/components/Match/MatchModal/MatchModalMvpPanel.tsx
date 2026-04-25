import { type FC } from "react";
import { Award, CheckCircle, Clock } from "lucide-react";

type MvpCandidate = {
    id: string;
    playerName: string;
    teamName: string;
    points: number;
    votes: number;
};

type MvpCandidatePreview = {
    playerName: string;
    teamName: string;
    points: number;
};

type MatchModalMvpPanelProps = {
    isMvpVotingSport: boolean;
    isMvpVotingActive: boolean;
    isSavingMvpCandidates: boolean;
    matchMvpCandidates: MvpCandidate[];
    topCandidatesPreview: MvpCandidatePreview[];
    currentLeader: MvpCandidate | null;
    mvpCandidatesLoadError: string | null;
    mvpVoteFeedback: string | null;
    mvpVotingSecondsRemaining: number;
    userAlreadyVotedThisMatch: boolean;
    isVotingCandidateId: string | null;
    getMvpPerformanceLabel: (value: number) => string;
    onVoteForCandidate: (candidateId: string, currentVotes: number) => void | Promise<void>;
};

export const MatchModalMvpPanel: FC<MatchModalMvpPanelProps> = ({
    isMvpVotingSport,
    isMvpVotingActive,
    isSavingMvpCandidates,
    matchMvpCandidates,
    topCandidatesPreview,
    currentLeader,
    mvpCandidatesLoadError,
    mvpVoteFeedback,
    mvpVotingSecondsRemaining,
    userAlreadyVotedThisMatch,
    isVotingCandidateId,
    getMvpPerformanceLabel,
    onVoteForCandidate,
}) => {
    if (!isMvpVotingSport) return null;

    if (isMvpVotingActive) {
        return (
            <div
                style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border-color)",
                    background: "linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(59, 130, 246, 0.1))",
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: 800,
                        }}
                    >
                        <CheckCircle size={16} color="#ffd700" />
                        Votação para MVP em andamento
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: 800,
                            color: mvpVotingSecondsRemaining <= 10 ? "#ef4444" : "var(--accent-color)",
                        }}
                    >
                        <Clock size={16} />
                        {mvpVotingSecondsRemaining}s
                    </div>
                </div>

                {currentLeader && (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            fontWeight: 700,
                        }}
                    >
                        Lider atual: {currentLeader.playerName} ({currentLeader.votes} votos)
                    </div>
                )}

                {isSavingMvpCandidates && matchMvpCandidates.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        Preparando candidatos para votacao...
                    </div>
                ) : (
                    (matchMvpCandidates.length > 0 ? matchMvpCandidates : []).map((candidate) => (
                        <div
                            key={candidate.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                alignItems: "center",
                                gap: "10px",
                                border: "1px solid var(--border-color)",
                                borderRadius: "10px",
                                padding: "10px 12px",
                                background: "var(--bg-primary)",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                                    {candidate.playerName}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    {candidate.teamName} • {candidate.points} {getMvpPerformanceLabel(candidate.points)}
                                </div>
                            </div>

                            <button
                                onClick={() => onVoteForCandidate(candidate.id, candidate.votes)}
                                disabled={isVotingCandidateId === candidate.id || userAlreadyVotedThisMatch}
                                style={{
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    background:
                                        isVotingCandidateId === candidate.id || userAlreadyVotedThisMatch
                                            ? "var(--bg-hover)"
                                            : "var(--accent-color)",
                                    color: "#fff",
                                    cursor:
                                        isVotingCandidateId === candidate.id || userAlreadyVotedThisMatch
                                            ? "not-allowed"
                                            : "pointer",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                }}
                            >
                                {userAlreadyVotedThisMatch
                                    ? `Votado (${candidate.votes})`
                                    : isVotingCandidateId === candidate.id
                                        ? "Votando..."
                                        : `Votar (${candidate.votes})`}
                            </button>
                        </div>
                    ))
                )}

                {!isSavingMvpCandidates && matchMvpCandidates.length === 0 && topCandidatesPreview.length === 0 && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Nenhum jogador com pontuacao individual foi encontrado para esta partida.
                    </div>
                )}

                {!isSavingMvpCandidates && matchMvpCandidates.length === 0 && mvpCandidatesLoadError && (
                    <div style={{ fontSize: "12px", color: "#f97316", fontWeight: 700 }}>
                        {mvpCandidatesLoadError}
                    </div>
                )}

                {mvpVoteFeedback && (
                    <div style={{ fontSize: "12px", color: "var(--accent-color)", fontWeight: 700 }}>
                        {mvpVoteFeedback}
                    </div>
                )}
            </div>
        );
    }

    if (matchMvpCandidates.length === 0) return null;

    return (
        <div
            style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border-color)",
                background: "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.05) 100%)",
                border: "2px solid rgba(234, 179, 8, 0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                borderRadius: "12px",
            }}
        >
            {currentLeader ? (
                <>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#eab308",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        <CheckCircle size={14} />
                        MVP
                    </div>

                    <div
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(234, 179, 8, 0.18)",
                            border: "1px solid rgba(234, 179, 8, 0.35)",
                        }}
                    >
                        <Award size={20} color="#eab308" />
                    </div>

                    <div style={{ textAlign: "center", width: "100%" }}>
                        <div
                            style={{
                                fontSize: "15px",
                                fontWeight: 900,
                                color: "var(--text-primary)",
                                marginBottom: "2px",
                                lineHeight: "1.2",
                            }}
                        >
                            {currentLeader.playerName}
                        </div>
                        <div
                            style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                fontWeight: 700,
                                marginBottom: "8px",
                            }}
                        >
                            {currentLeader.teamName}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(234, 179, 8, 0.2)",
                                borderRadius: "8px",
                                padding: "8px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 900,
                                    color: "#eab308",
                                    marginBottom: "2px",
                                }}
                            >
                                {currentLeader.points}
                            </div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-secondary)",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                }}
                            >
                                {getMvpPerformanceLabel(currentLeader.points)}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "rgba(234, 179, 8, 0.08)",
                                border: "1px solid rgba(234, 179, 8, 0.3)",
                                borderRadius: "8px",
                                padding: "8px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 900,
                                    color: "#eab308",
                                    marginBottom: "2px",
                                }}
                            >
                                {currentLeader.votes}
                            </div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-secondary)",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                }}
                            >
                                {currentLeader.votes === 1 ? "Voto" : "Votos"}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center" }}>
                    Nenhum voto registrado
                </div>
            )}
        </div>
    );
};
