import type { Match } from '../../../data/mockData';

export interface BolaoRankingModalProps {
  onClose: () => void;
}

export interface BolaoUserRanking {
  email: string;
  name: string;
  surname?: string;
  preferredCourse?: string;
  avatar?: string;
  points: number;
  exactMatches: number;
  winnerMatches: number;
}

export interface BolaoUserRow {
  email: string;
  name: string | null;
  surname: string | null;
  preferredcourse: string | null;
  role: string | null;
}

export interface BolaoPredictionRow {
  id?: string;
  match_id: string;
  user_email: string;
  score_a: number | string | null;
  score_b: number | string | null;
}

export interface BolaoPredictionMatchRow {
  prediction: BolaoPredictionRow;
  match: Match;
}