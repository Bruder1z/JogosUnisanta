import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import Countdown from '../../../components/Layout/Countdown';
import type { News } from '../../../data/mockData';

type HomeSidebarPanelProps = {
  isSuperAdmin: boolean;
  highlight: News;
};

const HomeSidebarPanel: FC<HomeSidebarPanelProps> = ({ isSuperAdmin, highlight }) => {
  return (
    <aside>
      {isSuperAdmin && (
        <div className="premium-card home-sidebar-superadmin">
          <div className="home-sidebar-superadmin-title">
            <Trophy size={18} />
            CONTROLE DE PARTIDA
          </div>
          <p className="home-sidebar-superadmin-text">
            Gerencie placares e cronologia das partidas em tempo real.
          </p>
          <Link to="/controle-partida" className="hover-glow home-sidebar-control-link">
            ABRIR CONTROLADOR
          </Link>
        </div>
      )}

      <Countdown />

      <div className="premium-card home-highlight-card">
        <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>DESTAQUES DO DIA</h3>
        <a
          href={highlight.url}
          target="_blank"
          rel="noopener noreferrer"
          className="home-highlight-link"
        >
          <div className="hover-glow home-highlight-cover">
            <img
              src={highlight.image || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60'}
              alt={highlight.title}
              className="home-highlight-image"
            />
            <div className="home-highlight-overlay">
              <div className="home-highlight-kicker-label">NOTÍCIA</div>
              <div className="home-highlight-title">{highlight.title}</div>
            </div>
          </div>
        </a>
      </div>
    </aside>
  );
};

export default HomeSidebarPanel;