import type { Match } from "../../../data/mockData";

export interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

export type MatchTeam = Match["teamA"];

export interface BeachTennisSummary {
    setsA: number;
    setsB: number;
    gamesA: number;
    gamesB: number;
    pointsA: number;
    pointsB: number;
    setResults: string[];
}

export interface SwimmingPodiumEntry {
    rank: number;
    courseLabel: string;
    courseKey: string;
    faculty: string;
    athleteName: string;
    athleteTime: string;
}

export interface PenaltyResult {
    scoredA: number;
    scoredB: number;
    winnerName: string;
}