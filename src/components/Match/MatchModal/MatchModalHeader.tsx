import { type FC } from "react";
import { Clock, MapPin, Users, X } from "lucide-react";

import { type Match, COURSE_EMBLEMS } from "../../../data/mockData";

type TeamHeaderProps = {
    team: Match["teamA"];
};

const TeamHeaderDisplay = ({ team }: TeamHeaderProps) => {
    const getTeamEmblem = (teamValue: any) => {
        if (!teamValue) return null;
        if (typeof teamValue === "object" && teamValue.logo) return teamValue.logo;

        const possibleKeys: string[] = [];
        let identifiedCourse = "";
        let identifiedFaculty = "";

        if (typeof teamValue === "string") {
            possibleKeys.push(teamValue);
            if (teamValue.includes(" - ")) {
                [identifiedCourse, identifiedFaculty] = teamValue.split(" - ");
            } else {
                identifiedCourse = teamValue;
            }
        } else {
            if (teamValue.name) {
                possibleKeys.push(teamValue.name);
                if (teamValue.name.includes(" - ") && (!teamValue.course || !teamValue.faculty)) {
                    const [course, faculty] = teamValue.name.split(" - ");
                    identifiedCourse = course;
                    identifiedFaculty = faculty;
                }
            }

            if (teamValue.course && teamValue.faculty) {
                possibleKeys.push(`${teamValue.course} - ${teamValue.faculty}`);
                identifiedCourse = identifiedCourse || teamValue.course;
                identifiedFaculty = identifiedFaculty || teamValue.faculty;
            }

            if (teamValue.course) {
                possibleKeys.push(teamValue.course);
                identifiedCourse = identifiedCourse || teamValue.course;
            }

            if (teamValue.name && teamValue.name.includes(" - ")) {
                const firstPart = teamValue.name.split(" - ")[0];
                possibleKeys.push(firstPart);
                identifiedCourse = identifiedCourse || firstPart;
            }
        }

        const emblemKeys = Object.keys(COURSE_EMBLEMS);

        for (const possibleKey of possibleKeys) {
            const normalizedKey = String(possibleKey).trim().toLowerCase();
            if (!normalizedKey) continue;

            const exactKey = emblemKeys.find((key) => key.toLowerCase() === normalizedKey);
            if (exactKey) return `/emblemas/${COURSE_EMBLEMS[exactKey]}`;
        }

        if (identifiedCourse && identifiedFaculty) {
            const courseLow = identifiedCourse.toLowerCase();
            const facultyLow = identifiedFaculty.toLowerCase();
            const bestKey = emblemKeys.find((key) => {
                const keyLow = key.toLowerCase();
                return keyLow.includes(courseLow) && keyLow.includes(facultyLow);
            });

            if (bestKey) return `/emblemas/${COURSE_EMBLEMS[bestKey]}`;
        }

        return null;
    };

    const emblemUrl = getTeamEmblem(team);

    return (
        <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                {emblemUrl ? (
                    <img
                        src={emblemUrl}
                        alt={team.name}
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                            const fallback = event.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "block";
                        }}
                    />
                ) : null}
                <div style={{ fontSize: "40px", display: emblemUrl ? "none" : "block" }}>
                    {team.logo}
                </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800 }}>
                {team.name.split(" - ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {team.name.split(" - ")[1]}
            </div>
        </div>
    );
};

type MatchModalHeaderProps = {
    match: Match;
    isSwimming: boolean;
    swimmingParticipants: Match["teamA"][];
    isBeachTennis: boolean;
    beachLiveState: { setsA: number; setsB: number; pointA: number; pointB: number };
    liveTimerSeconds: number | null;
    timerPaused: boolean;
    isTimerCountdown: boolean;
    onClose: () => void;
    onOpenPlayerStats: () => void;
};

export const MatchModalHeader: FC<MatchModalHeaderProps> = ({
    match,
    isSwimming,
    swimmingParticipants,
    isBeachTennis,
    beachLiveState,
    liveTimerSeconds,
    timerPaused,
    isTimerCountdown,
    onClose,
    onOpenPlayerStats,
}) => {
    const formatLiveTimer = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    return (
        <div className="match-modal-header">
            <div className="match-modal-header-content">
                <div className="match-modal-sport">{match.sport}</div>

                <div className="match-modal-teams-row">
                    {isSwimming ? (
                        <div className="match-modal-sport-pills">
                            <div className="match-modal-sport-pills-label">Equipes participantes</div>
                            <div className="match-modal-sport-pills-list">
                                {(swimmingParticipants.length ? swimmingParticipants : [match.teamA, match.teamB]).map((team) => (
                                    <span key={team.id} className="match-modal-sport-pill">
                                        {team.name.split(" - ")[0]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <TeamHeaderDisplay team={match.teamA} />

                            <div className="match-modal-score-column">
                                <div className="match-modal-score-value">
                                    <span>{isBeachTennis ? beachLiveState.setsA : match.scoreA}</span>
                                    <span className="match-modal-score-separator">X</span>
                                    <span>{isBeachTennis ? beachLiveState.setsB : match.scoreB}</span>
                                </div>

                                {isBeachTennis && (
                                    <div className="match-modal-score-meta">
                                        <div style={{ fontSize: "14px", color: "var(--accent-color)", fontWeight: 700 }}>
                                            Games: {match.scoreA} - {match.scoreB}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700 }}>
                                            Pontos: {String(beachLiveState.pointA)} - {String(beachLiveState.pointB)}
                                        </div>
                                    </div>
                                )}

                                {[
                                    "Vôlei",
                                    "Vôlei de Praia",
                                    "Tênis de Mesa",
                                    "Futevôlei",
                                ].includes(match.sport) && match.status === "live" && (
                                        <div style={{ fontSize: "14px", color: "var(--accent-color)", fontWeight: 700, marginTop: "2px" }}>
                                            {(() => {
                                                const lastSetWinEvent = [...(match.events || [])].reverse().find((event) => event.type === "set_win");
                                                const events = lastSetWinEvent
                                                    ? match.events?.slice(match.events.indexOf(lastSetWinEvent) + 1) || []
                                                    : match.events || [];
                                                const ptsA = events.filter((event) => event.type === "goal" && event.teamId === match.teamA.id).length;
                                                const ptsB = events.filter((event) => event.type === "goal" && event.teamId === match.teamB.id).length;
                                                return `${ptsA} - ${ptsB} (Pt)`;
                                            })()}
                                        </div>
                                    )}

                                {match.status === "live" && ![
                                    "Vôlei",
                                    "Vôlei de Praia",
                                    "Tênis de Mesa",
                                    "Futevôlei",
                                ].includes(match.sport) && (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginTop: "5px" }}>
                                            <div className="match-modal-live-badge">AO VIVO</div>

                                            {liveTimerSeconds !== null && (
                                                <div className="match-modal-live-timer">
                                                    <div
                                                        style={{
                                                            fontSize: "22px",
                                                            fontWeight: 900,
                                                            color: timerPaused
                                                                ? "#f59e0b"
                                                                : liveTimerSeconds <= 60 && isTimerCountdown
                                                                    ? "#ef4444"
                                                                    : "var(--text-primary)",
                                                            fontVariantNumeric: "tabular-nums",
                                                            letterSpacing: "1px",
                                                            lineHeight: 1,
                                                            opacity: timerPaused ? 0.7 : 1,
                                                            animation: !timerPaused && liveTimerSeconds <= 10 && isTimerCountdown
                                                                ? "livePulse 1s infinite"
                                                                : "none",
                                                        }}
                                                    >
                                                        {timerPaused ? "⏸ " : ""}{formatLiveTimer(liveTimerSeconds)}
                                                    </div>

                                                    {timerPaused && (
                                                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.5px" }}>
                                                            PAUSADO
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                            <TeamHeaderDisplay team={match.teamB} />
                        </>
                    )}
                </div>

                <div className="match-modal-top-meta">
                    <div className="match-modal-top-meta-item">
                        <Clock size={14} />
                        {match.date.split("-").reverse().join("-")} às {match.time}
                    </div>
                    <div className="match-modal-top-meta-item">
                        <MapPin size={14} />
                        {match.location.replace(/\s*\(.*?\)\s*$/, "").trim()}
                    </div>
                </div>
            </div>

            <div className="match-modal-actions">
                <button onClick={onClose} className="match-modal-action-button" title="Fechar">
                    <X size={20} />
                </button>

                {(match.sport === "Basquetebol" || match.sport === "Basquete 3x3") ? (
                    <button
                        onClick={onOpenPlayerStats}
                        className="match-modal-action-button match-modal-action-button--secondary"
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
                ) : null}
            </div>
        </div>
    );
};
