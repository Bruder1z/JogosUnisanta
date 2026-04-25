import { type FC } from "react";

type SetBreakdownItem = {
    setNumber: number;
    winnerTeamName: string;
    scoreA: number;
    scoreB: number;
};

type MatchModalSetBreakdownProps = {
    setBreakdown: SetBreakdownItem[];
};

export const MatchModalSetBreakdown: FC<MatchModalSetBreakdownProps> = ({
    setBreakdown,
}) => {
    if (setBreakdown.length === 0) return null;

    return (
        <div
            style={{
                padding: "20px",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--bg-card)",
            }}
        >
            <h3
                style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "14px",
                    color: "var(--text-primary)",
                }}
            >
                Resultado por Sets
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {setBreakdown.map((setItem) => (
                    <div
                        key={`set-${setItem.setNumber}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "10px",
                            padding: "10px 12px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "var(--text-secondary)",
                            }}
                        >
                            Set {setItem.setNumber}
                        </span>
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                            }}
                        >
                            {setItem.scoreA} x {setItem.scoreB}
                        </span>
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "var(--accent-color)",
                            }}
                        >
                            {setItem.winnerTeamName}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
