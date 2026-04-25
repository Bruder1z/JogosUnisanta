export interface LeagueDetailsModalProps {
  league: LeagueDetailsLeague;
  onClose: () => void;
}

export interface LeagueDetailsLeague {
  id: string;
  name: string;
  description: string;
  owner_email: string;
  type?: 'global' | 'course' | 'private' | string;
  course?: string;
  participants?: unknown;
}

export interface LeagueRankingRow {
  email: string;
  name: string;
  course?: string;
  points: number;
}

export interface LeagueRequestRow {
  id: string;
  user_name: string;
  user_email: string;
  status?: string;
}
