import type { Match } from '../../../data/mockData';

export type HomeCategoryFilter = 'Todos' | 'Masculino' | 'Feminino';
export type HomeDateFilter = 'Todos' | 'Ontem' | 'Hoje' | 'Amanhã';

export const getHomeDateLabel = (selectedDate: HomeDateFilter) => {
  return selectedDate === 'Todos' ? 'Todas as Datas' : selectedDate;
};

export const matchesHomeFilters = (
  match: Match,
  selectedSport: string | null,
  selectedCategory: HomeCategoryFilter,
  selectedDate: HomeDateFilter,
) => {
  const sportMatch = !selectedSport || match.sport === selectedSport;
  const categoryMatch = selectedCategory === 'Todos' || match.category === selectedCategory;

  let dateMatch = true;
  if (selectedDate !== 'Todos') {
    if (selectedDate === 'Hoje' && match.status === 'live') {
      dateMatch = true;
    } else {
      const targetDate = new Date();

      if (selectedDate === 'Ontem') targetDate.setDate(targetDate.getDate() - 1);
      if (selectedDate === 'Amanhã') targetDate.setDate(targetDate.getDate() + 1);

      const offset = targetDate.getTimezoneOffset();
      const targetDateLocal = new Date(targetDate.getTime() - offset * 60 * 1000);
      const dateStr = targetDateLocal.toISOString().split('T')[0];

      dateMatch = match.date === dateStr;
    }
  }

  return sportMatch && categoryMatch && dateMatch;
};

export const filterHomeMatches = (
  matches: Match[],
  selectedSport: string | null,
  selectedCategory: HomeCategoryFilter,
  selectedDate: HomeDateFilter,
) => {
  return matches.filter((match) =>
    matchesHomeFilters(match, selectedSport, selectedCategory, selectedDate),
  );
};