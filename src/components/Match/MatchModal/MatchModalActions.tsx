import { type FC } from "react";
import { Users, X } from "lucide-react";

type MatchModalActionsProps = {
    isBasketball: boolean;
    onClose: () => void;
    onOpenPlayerStats: () => void;
};

export const MatchModalActions: FC<MatchModalActionsProps> = ({
    isBasketball,
    onClose,
    onOpenPlayerStats,
}) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
                onClick={onClose}
                style={{
                    background: "var(--bg-hover)",
                    border: "none",
                    color: "var(--text-secondary)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                }}
                title="Fechar"
            >
                <X size={20} />
            </button>

            {isBasketball && (
                <button
                    onClick={onOpenPlayerStats}
                    style={{
                        background: "var(--bg-hover)",
                        border: "none",
                        color: "var(--text-secondary)",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.2s, color 0.2s",
                    }}
                    title="Ver estatísticas dos jogadores"
                    onMouseOver={(event) => {
                        event.currentTarget.style.background = "var(--accent-color)";
                        event.currentTarget.style.color = "#fff";
                    }}
                    onMouseOut={(event) => {
                        event.currentTarget.style.background = "var(--bg-hover)";
                        event.currentTarget.style.color = "var(--text-secondary)";
                    }}
                >
                    <Users size={18} />
                </button>
            )}
        </div>
    );
};
