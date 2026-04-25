export interface ProfileModalProps {
  onClose: () => void;
}

export interface ProfileStats {
  totalPoints: number;
  exactScores: number;
  winners: number;
  totalGuesses: number;
}
