import type { FC } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  getHomeDateLabel,
  type HomeCategoryFilter,
  type HomeDateFilter,
} from '../utils/homeFilters';

type HomeFilterBarProps = {
  selectedSport: string | null;
  onClearSport: () => void;
  selectedDate: HomeDateFilter;
  onChangeDate: (date: HomeDateFilter) => void;
  selectedCategory: HomeCategoryFilter;
  onChangeCategory: (category: HomeCategoryFilter) => void;
  showDateDropdown: boolean;
  onToggleDateDropdown: () => void;
  onCloseDateDropdown: () => void;
};

const HomeFilterBar: FC<HomeFilterBarProps> = ({
  selectedSport,
  onClearSport,
  selectedDate,
  onChangeDate,
  selectedCategory,
  onChangeCategory,
  showDateDropdown,
  onToggleDateDropdown,
  onCloseDateDropdown,
}) => {
  return (
    <div className="home-filter-bar">
      <div className="home-filter-top">
        <h1 className="home-filter-title">
          {selectedSport || 'Jogos de Hoje'}
        </h1>
        {selectedSport && (
          <button
            onClick={onClearSport}
            className="home-filter-clear"
          >
            Ver todos
          </button>
        )}
        <div className="home-date-wrapper">
          <button
            onClick={onToggleDateDropdown}
            className="home-date-button"
          >
            <Calendar size={14} />
            <span>{getHomeDateLabel(selectedDate)}</span>
            <ChevronDown size={14} />
          </button>

          {showDateDropdown && (
            <>
              <div
                className="home-date-backdrop"
                onClick={onCloseDateDropdown}
              />
              <div className="home-date-dropdown">
                {(['Todos', 'Ontem', 'Hoje', 'Amanhã'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      onChangeDate(option);
                      onCloseDateDropdown();
                    }}
                    className={`home-date-option${selectedDate === option ? ' active' : ''}`}
                  >
                    {getHomeDateLabel(option)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="home-cat-filter">
        {(['Todos', 'Masculino', 'Feminino'] as const).map((category) => (
          <button
            key={category}
            onClick={() => onChangeCategory(category)}
            className={selectedCategory === category ? 'active' : ''}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeFilterBar;