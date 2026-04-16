import type { FC } from 'react';
import { Calendar, Award } from 'lucide-react';
import MatchCard from '../../../components/Match/MatchCard';
import type { Match } from '../../../data/mockData';

type HomeMatchSectionsProps = {
  liveMatches: Match[];
  upcomingMatches: Match[];
  finishedMatches: Match[];
  onSelectMatch: (match: Match) => void;
};

const HomeMatchSections: FC<HomeMatchSectionsProps> = ({
  liveMatches,
  upcomingMatches,
  finishedMatches,
  onSelectMatch,
}) => {
  return (
    <>
      {liveMatches.length > 0 && (
        <div className="home-live-section">
          <div className="home-section-title-live">
            AO VIVO AGORA
          </div>
          <div className="home-match-list">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onClick={() => onSelectMatch(match)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="home-section-title-upcoming">
          PRÓXIMAS PARTIDAS
        </div>
        <div className="home-match-list">
          {upcomingMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => onSelectMatch(match)}
            />
          ))}
        </div>
      </div>

      {finishedMatches.length > 0 && (
        <div className="home-finished-section">
          <h2 className="home-section-title-finished">
            <Award size={16} /> JOGOS ENCERRADOS
          </h2>
          <div className="home-match-list" style={{ gap: '12px' }}>
            {finishedMatches.map((match) => (
              <MatchCard key={match.id} match={match} onClick={() => onSelectMatch(match)} />
            ))}
          </div>
        </div>
      )}

      {liveMatches.length === 0 && upcomingMatches.length === 0 && finishedMatches.length === 0 && (
        <div className="home-empty-state">
          <Calendar size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
          <p>Nenhum jogo encontrado para este filtro.</p>
        </div>
      )}
    </>
  );
};

export default HomeMatchSections;