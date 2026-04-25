import { COURSE_EMBLEMS, type Match } from "../../../data/mockData";

import type {
    BeachTennisSummary,
    MatchTeam,
    PenaltyResult,
    SwimmingPodiumEntry,
} from "./types";

export const BEACH_POINT_LABELS = ["0", "15", "30", "40"] as const;

export const getEventTimestamp = (eventId: string) => {
    const raw = eventId.split("_")[1] || eventId;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const getCourseEmblem = (course: string) => {
    if (course in COURSE_EMBLEMS) {
        return `/emblemas/${COURSE_EMBLEMS[course]}`;
    }

    return null;
};

export const getTeamEmblem = (team: MatchTeam | string | null | undefined) => {
    if (!team) return null;
    if (typeof team === "object" && team.logo) return team.logo;

    const possibleKeys: string[] = [];
    let identifiedCourse = "";
    let identifiedFaculty = "";

    if (typeof team === "string") {
        possibleKeys.push(team);
        if (team.includes(" - ")) {
            [identifiedCourse, identifiedFaculty] = team.split(" - ");
        } else {
            identifiedCourse = team;
        }
    } else {
        if (team.name) {
            possibleKeys.push(team.name);
            if (team.name.includes(" - ") && (!team.course || !team.faculty)) {
                const [course, faculty] = team.name.split(" - ");
                identifiedCourse = course;
                identifiedFaculty = faculty;
            }
        }

        if (team.course && team.faculty) {
            possibleKeys.push(`${team.course} - ${team.faculty}`);
            identifiedCourse = identifiedCourse || team.course;
            identifiedFaculty = identifiedFaculty || team.faculty;
        }

        if (team.course) {
            possibleKeys.push(team.course);
            identifiedCourse = identifiedCourse || team.course;
        }

        if (team.name && team.name.includes(" - ")) {
            const firstPart = team.name.split(" - ")[0];
            possibleKeys.push(firstPart);
            identifiedCourse = identifiedCourse || firstPart;
        }
    }

    const emblemKeys = Object.keys(COURSE_EMBLEMS);

    for (const candidate of possibleKeys) {
        const normalizedCandidate = String(candidate).trim().toLowerCase();
        if (!normalizedCandidate) continue;

        const exactKey = emblemKeys.find((key) => key.toLowerCase() === normalizedCandidate);
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

export const getBeachTennisSummary = (match: Match): BeachTennisSummary => {
    const initial: BeachTennisSummary = {
        setsA: 0,
        setsB: 0,
        gamesA: 0,
        gamesB: 0,
        pointsA: 0,
        pointsB: 0,
        setResults: [],
    };

    if (match.sport !== "Beach Tennis") return initial;

    const events = [...(match.events || [])].sort(
        (a, b) => (a.minute - b.minute) || (getEventTimestamp(a.id) - getEventTimestamp(b.id)),
    );

    let currentSetStartIndex = 0;
    let currentGamePointsA = 0;
    let currentGamePointsB = 0;
    let currentGamesA = 0;
    let currentGamesB = 0;
    let setsA = 0;
    let setsB = 0;
    const setResults: string[] = [];

    events.forEach((event, index) => {
        if (event.type === "goal") {
            if (event.teamId === match.teamA.id) currentGamePointsA += 1;
            if (event.teamId === match.teamB.id) currentGamePointsB += 1;
            return;
        }

        if (event.type === "set_win" && event.description?.startsWith("Game para ")) {
            if (event.teamId === match.teamA.id) currentGamesA += 1;
            if (event.teamId === match.teamB.id) currentGamesB += 1;
            currentGamePointsA = 0;
            currentGamePointsB = 0;
            return;
        }

        if (event.type === "set_win" && event.description?.startsWith("Set para ")) {
            const segmentEvents = events.slice(currentSetStartIndex, index + 1);
            const gamesA = segmentEvents.filter((entry) => (
                entry.type === "set_win"
                && entry.description?.startsWith("Game para ")
                && entry.teamId === match.teamA.id
            )).length;
            const gamesB = segmentEvents.filter((entry) => (
                entry.type === "set_win"
                && entry.description?.startsWith("Game para ")
                && entry.teamId === match.teamB.id
            )).length;

            setResults.push(`${gamesA}-${gamesB}`);

            if (event.teamId === match.teamA.id) setsA += 1;
            if (event.teamId === match.teamB.id) setsB += 1;

            currentSetStartIndex = index + 1;
            currentGamesA = 0;
            currentGamesB = 0;
            currentGamePointsA = 0;
            currentGamePointsB = 0;
        }
    });

    return {
        setsA,
        setsB,
        gamesA: currentGamesA,
        gamesB: currentGamesB,
        pointsA: currentGamePointsA,
        pointsB: currentGamePointsB,
        setResults,
    };
};

export const getSwimmingParticipants = (match: Match) => {
    const raw = match.participants;

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw) as Match["teamA"][];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
};

export const getSwimmingPodium = (
    match: Match,
    swimmingParticipants: MatchTeam[],
): SwimmingPodiumEntry[] => {
    return (match.events || [])
        .filter((event) => event.type === "swimming_result" && event.description)
        .map((event) => {
            const description = event.description || "";
            const rankMatch = description.match(/^(\d+)\s*º?\s*-/i);
            const rank = rankMatch ? Number(rankMatch[1]) : Number.MAX_SAFE_INTEGER;
            const parts = description.split(" - ");
            const courseName = (parts[parts.length - 1] || "").trim();
            const athleteRaw = parts.length >= 3
                ? parts.slice(1, parts.length - 1).join(" - ").trim()
                : "";

            const timeMatch = athleteRaw.match(/\(([^)]+)\)\s*$/);
            const athleteName = athleteRaw.replace(/\s*\([^)]+\)\s*$/, "").trim();
            const athleteTime = timeMatch ? timeMatch[1].trim() : "";

            const matchedParticipant = swimmingParticipants.find((participant) => {
                const shortName = participant.name.split(" - ")[0].trim().toLowerCase();
                const fullCourse = (participant.course || "").trim().toLowerCase();
                const target = courseName.toLowerCase();
                return shortName === target || fullCourse === target;
            });

            const resolvedCourseLabel = matchedParticipant
                ? matchedParticipant.name.split(" - ")[0]
                : (courseName || "Curso não informado");
            const resolvedCourseKey = matchedParticipant?.course || resolvedCourseLabel;
            const resolvedFaculty = matchedParticipant?.faculty
                || (matchedParticipant?.name.includes(" - ") ? matchedParticipant.name.split(" - ")[1] : "")
                || (resolvedCourseKey.includes(" - ") ? resolvedCourseKey.split(" - ")[1] : "")
                || "Faculdade não informada";

            return {
                rank,
                courseLabel: resolvedCourseLabel,
                courseKey: resolvedCourseKey,
                faculty: resolvedFaculty,
                athleteName,
                athleteTime,
            };
        })
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 3);
};

export const getPenaltyResult = (match: Match): PenaltyResult | null => {
    const isPenaltyShootoutSport = match.sport === "Futsal"
        || match.sport === "Futebol Society"
        || match.sport === "Futebol X1";

    if (!isPenaltyShootoutSport || match.status !== "finished") return null;

    const startIdx = (match.events || []).findIndex(
        (event) => event.type === "halftime" && event.description?.startsWith("⚽ Início da Disputa de Pênaltis"),
    );

    if (startIdx === -1) return null;

    const shootoutEvents = (match.events || []).slice(startIdx + 1).filter(
        (event) => event.type === "penalty_scored" || event.type === "penalty_missed",
    );

    if (shootoutEvents.length === 0) return null;

    const scoredA = shootoutEvents.filter((event) => event.type === "penalty_scored" && event.teamId === match.teamA.id).length;
    const scoredB = shootoutEvents.filter((event) => event.type === "penalty_scored" && event.teamId === match.teamB.id).length;
    const winnerName = scoredA > scoredB
        ? match.teamA.name.split(" - ")[0]
        : match.teamB.name.split(" - ")[0];

    return { scoredA, scoredB, winnerName };
};

export const getLiveSetPoints = (match: Match) => {
    const lastSetWinEvent = [...(match.events || [])].reverse().find((event) => event.type === "set_win");
    const events = lastSetWinEvent
        ? match.events?.slice(match.events.indexOf(lastSetWinEvent) + 1) || []
        : match.events || [];

    const ptsA = events.filter((event) => event.type === "goal" && event.teamId === match.teamA.id).length;
    const ptsB = events.filter((event) => event.type === "goal" && event.teamId === match.teamB.id).length;

    return { ptsA, ptsB };
};
