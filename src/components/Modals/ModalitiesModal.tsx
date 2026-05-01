import { type FC } from 'react';
import { X } from 'lucide-react';

interface ModalitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSport: (sport: string) => void;
}

const SPORTS_LIST = [
  { name: 'Basquete 3x3', icon: '🏀', color: '#f97316' },
  { name: 'Basquetebol', icon: '🏀', color: '#f97316' },
  { name: 'Beach Tennis', icon: '🎾', color: '#a855f7' },
  { name: 'Caratê', icon: '🥋', color: '#6b7280' },
  { name: 'Futebol Society', icon: '⚽', color: '#3b82f6' },
  { name: 'Futebol X1', icon: '⚽', color: '#3b82f6' },
  { name: 'Futevôlei', icon: '⚽', color: '#3b82f6' },
  { name: 'Futsal', icon: '⚽', color: '#3b82f6' },
  { name: 'Handebol', icon: '🤾', color: '#eab308' },
  { name: 'Judô', icon: '🥋', color: '#6b7280' },
  { name: 'Natação', icon: '🏊', color: '#06b6d4' },
  { name: 'Tamboréu', icon: '🎾', color: '#ec4899' },
  { name: 'Tênis de Mesa', icon: '🏓', color: '#ec4899' },
  { name: 'Vôlei', icon: '🏐', color: '#8b5cf6' },
  { name: 'Vôlei de Praia', icon: '🏐', color: '#8b5cf6' },
  { name: 'Xadrez', icon: '♟️', color: '#8b5cf6' },
];

const ModalitiesModal: FC<ModalitiesModalProps> = ({ isOpen, onClose, onSelectSport }) => {
  if (!isOpen) return null;

  const handleSportClick = (sport: string) => {
    onSelectSport(sport);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(227, 6, 19, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(227, 6, 19, 0.1), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #e30613, #a00410)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              🏆
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                letterSpacing: '0.5px',
              }}
            >
              TODAS AS MODALIDADES
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(227, 6, 19, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Grid de Modalidades */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
            }}
          >
            {SPORTS_LIST.map((sport) => (
              <button
                key={sport.name}
                onClick={() => handleSportClick(sport.name)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '90px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(227, 6, 19, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(227, 6, 19, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(227, 6, 19, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    lineHeight: 1,
                  }}
                >
                  {sport.icon}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: '1.2',
                  }}
                >
                  {sport.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(227, 6, 19, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(227, 6, 19, 0.7);
        }
        
        @media (max-width: 600px) {
          .custom-scrollbar > div {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
          }
          
          .custom-scrollbar > div button {
            padding: 12px 8px !important;
            min-height: 80px !important;
          }
          
          .custom-scrollbar > div button > div:first-child {
            font-size: 28px !important;
          }
          
          .custom-scrollbar > div button > div:last-child {
            font-size: 10px !important;
          }
        }
        
        @media (max-width: 400px) {
          .custom-scrollbar > div {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
          }
          
          .custom-scrollbar > div button {
            padding: 10px 6px !important;
            min-height: 70px !important;
          }
          
          .custom-scrollbar > div button > div:first-child {
            font-size: 24px !important;
          }
          
          .custom-scrollbar > div button > div:last-child {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ModalitiesModal;
