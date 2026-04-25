import { Clock, MapPin } from "lucide-react";

type MatchFooterProps = {
    date: string;
    location: string;
};

export const MatchFooter = ({ date, location }: MatchFooterProps) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                paddingTop: "15px",
                borderTop: "1px solid var(--border-color)",
                fontSize: "12px",
                color: "var(--text-secondary)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} />
                {date.split("-").reverse().join("-")}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} />
                {location.replace(/\s*\(.*?\)\s*$/, "").trim()}
            </div>
        </div>
    );
};
