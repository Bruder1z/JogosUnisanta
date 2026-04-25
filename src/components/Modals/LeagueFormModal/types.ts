export interface LeagueFormModalProps {
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
  onCreated?: () => void;
}

export interface LeagueRow {
  participants: unknown;
}
