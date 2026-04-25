export interface JoinLeagueModalProps {
  leagueId: string;
  onClose: () => void;
  onJoined: () => void;
}

export interface LeagueRow {
  id: string;
  name: string;
  participants: unknown;
}
