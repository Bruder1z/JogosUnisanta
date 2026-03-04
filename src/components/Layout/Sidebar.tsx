import { type FC } from 'react';
import {
    Trophy,
    ChevronRight,
    History,
    LayoutGrid
} from 'lucide-react';

interface SidebarProps {
    onShowModalities?: () => void;
    onSelectSport?: (sport: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ onShowModalities, onSelectSport }) => {
    const principalSports = [
        { name: 'Futsal', icon: '⚽' },
        { name: 'Futebol Society', icon: '⚽' },
        { name: 'Basquete 3x3', icon: '🏀' },
        { name: 'Vôlei', icon: '🏐' },
        { name: 'Handebol', icon: '🤾' },
    ];

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            position: 'fixed',
            top: 'var(--header-height)',
            left: 0,
            bottom: 0,
            background: 'var(--bg-main)',
            borderRight: '1px solid var(--border-color)',
            padding: '20px 0',
            overflowY: 'auto'
        }}>
            <div style={{ padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '14px' }}>
                    <Trophy size={18} />
                    ESPORTES
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {principalSports.map((sport) => (
                    <div
                        key={sport.name}
                        onClick={() => onSelectSport?.(sport.name)}
                        className="sidebar-link"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px' }}>{sport.icon}</span>
                            {sport.name}
                        </div>
                        <ChevronRight size={14} opacity={0.5} />
                    </div>
                ))}

                <button
                    onClick={onShowModalities}
                    className="sidebar-link"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--accent-color)',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LayoutGrid size={18} />
                        MODALIDADES
                    </div>
                    <ChevronRight size={14} opacity={0.5} />
                </button>
            </div>

            <div style={{ marginTop: '30px', padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '13px' }}>
                    <History size={16} />
                    COMPETIÇÃO
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '20px' }}>
                <a href="#" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>Classificação Geral</a>
                <a href="#" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>Melhores Atletas</a>
                <a href="#" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>Histórico</a>
            </div>

            <style>{`
        .sidebar-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary) !important;
        }
      `}</style>
        </aside>
    );
};

export default Sidebar;
