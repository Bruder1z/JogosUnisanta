import type { FC } from 'react';

type HomeView = 'public' | 'admin';

type HomeViewToggleProps = {
  activeView: HomeView;
  onChangeView: (view: HomeView) => void;
};

const HomeViewToggle: FC<HomeViewToggleProps> = ({ activeView, onChangeView }) => {
  return (
    <div className="home-view-toggle">
      <button
        onClick={() => onChangeView('admin')}
        className={`home-view-toggle-button${activeView === 'admin' ? ' active' : ''}`}
      >
        PAINEL ADMIN
      </button>
      <button
        onClick={() => onChangeView('public')}
        className={`home-view-toggle-button${activeView === 'public' ? ' active' : ''}`}
      >
        VISÃO PÚBLICA
      </button>
    </div>
  );
};

export default HomeViewToggle;