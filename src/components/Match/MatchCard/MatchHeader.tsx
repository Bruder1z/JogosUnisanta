type MatchHeaderProps = {
    sport: string;
    category: string;
    stage?: string;
    status: string;
    time: string;
};

export const MatchHeader = ({ sport, category, stage, status, time }: MatchHeaderProps) => {
    const PHASE_SPORTS = ["Vôlei", "Vôlei de Praia", "Futevôlei", "Beach Tennis"];
    const showPhase = PHASE_SPORTS.includes(sport) && stage;

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontWeight: 600,
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span>{sport} {category}</span>

                {showPhase && (
                    <span
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: stage === "Fase Final" ? "#f59e0b" : "var(--accent-color)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        {stage === "Fase Final" ? "🏆 Fase Final" : "📋 Fase de Classificação"}
                    </span>
                )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {status === "live" && (
                    <span
                        style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--live-color)",
                            boxShadow: "0 0 8px var(--live-color)",
                        }}
                    />
                )}

                <span style={{ color: status === "live" ? "var(--live-color)" : "var(--text-secondary)" }}>
                    {status === "live" ? "AO VIVO" : status === "finished" ? "FINALIZADO" : time}
                </span>
            </div>
        </div>
    );
};
