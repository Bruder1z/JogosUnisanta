export interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  preferredCourse?: string;
  preferredSport?: string;
  role: 'superadmin' | 'cliente';
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  course: string;
  logo?: string;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'start' | 'end' | 'set_win';
  minute: number;
  teamId?: string; // Which team the event belongs to
  player?: string; // Name of the player (optional)
  score?: string; // e.g., "25-23" (optional)
}

export interface Match {
  id: string;
  sport: string;
  category: 'Masculino' | 'Feminino';
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status: 'live' | 'finished' | 'scheduled';
  date: string;
  time: string;
  location: string;
  events?: MatchEvent[];
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@gmail.com',
    name: 'Super Admin',
    role: 'superadmin',
  },
  {
    id: '2',
    email: 'cliente@gmail.com',
    name: 'Cliente Teste',
    role: 'cliente',
  },
];

export const mockTeams: Team[] = [
  { id: '1', name: 'Fefesp - Unisanta', course: 'Educação Física', logo: '⚽' },
  { id: '2', name: 'Engenharia - Unisanta', course: 'Engenharia', logo: '⚙️' },
  { id: '3', name: 'Direito - Unisanta', course: 'Direito', logo: '⚖️' },
  { id: '4', name: 'Arquitetura - Unisanta', course: 'Arquitetura', logo: '📐' },
];

export const mockMatches: Match[] = [
  // Futsal
  {
    id: 'm1', sport: 'Futsal', category: 'Masculino', teamA: mockTeams[0], teamB: mockTeams[1], scoreA: 3, scoreB: 1, status: 'live', date: '2026-03-04', time: '19:00', location: 'Ginásio Laerte Gonçalves',
    events: [{ id: 'e1', type: 'start', minute: 0 }, { id: 'e2', type: 'goal', minute: 12, teamId: '1', player: 'Juninho' }]
  },
  { id: 'm1f', sport: 'Futsal', category: 'Feminino', teamA: mockTeams[2], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '18:00', location: 'Ginásio Laerte Gonçalves' },

  // Vôlei
  {
    id: 'm2', sport: 'Vôlei', category: 'Feminino', teamA: mockTeams[2], teamB: mockTeams[3], scoreA: 2, scoreB: 0, status: 'live', date: '2026-03-04', time: '19:30', location: 'Poliesportivo Unisanta',
    events: [{ id: 'v1', type: 'start', minute: 0 }, { id: 'v2', type: 'set_win', minute: 25, teamId: '3', score: '25-18' }]
  },
  { id: 'm2m', sport: 'Vôlei', category: 'Masculino', teamA: mockTeams[0], teamB: mockTeams[1], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '20:30', location: 'Poliesportivo Unisanta' },

  // Basquete 3x3
  { id: 'm3', sport: 'Basquete 3x3', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[3], scoreA: 15, scoreB: 12, status: 'finished', date: '2026-03-04', time: '14:00', location: 'Pátio Bloco M' },
  { id: 'm3f', sport: 'Basquete 3x3', category: 'Feminino', teamA: mockTeams[0], teamB: mockTeams[2], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '16:00', location: 'Pátio Bloco M' },

  // Handball
  { id: 'm4', sport: 'Handebol', category: 'Masculino', teamA: mockTeams[0], teamB: mockTeams[2], scoreA: 10, scoreB: 10, status: 'live', date: '2026-03-04', time: '20:00', location: 'Ginásio Laerte' },

  // Natação
  { id: 'm5', sport: 'Natação', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[0], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '09:00', location: 'Piscina Olímpica' },
  { id: 'm5f', sport: 'Natação', category: 'Feminino', teamA: mockTeams[2], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'finished', date: '2026-03-04', time: '08:00', location: 'Piscina Olímpica' },

  // Soccer Society
  { id: 'm6', sport: 'Futebol Society', category: 'Masculino', teamA: mockTeams[3], teamB: mockTeams[0], scoreA: 2, scoreB: 4, status: 'finished', date: '2026-03-04', time: '17:00', location: 'Campo Society' },

  // Others
  { id: 'm7', sport: 'Karatê', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[2], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '15:00', location: 'Sala de Lutas' },
  { id: 'm8', sport: 'Judô', category: 'Feminino', teamA: mockTeams[0], teamB: mockTeams[3], scoreA: 1, scoreB: 0, status: 'live', date: '2026-03-04', time: '15:30', location: 'Sala de Lutas' },
  { id: 'm9', sport: 'Xadrez', category: 'Masculino', teamA: mockTeams[2], teamB: mockTeams[1], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '13:00', location: 'Biblioteca' },
  { id: 'm10', sport: 'Tênis de Mesa', category: 'Feminino', teamA: mockTeams[3], teamB: mockTeams[0], scoreA: 3, scoreB: 1, status: 'finished', date: '2026-03-04', time: '10:00', location: 'Ginásio de Mesa' },
  { id: 'm11', sport: 'Futevôlei', category: 'Masculino', teamA: mockTeams[0], teamB: mockTeams[1], scoreA: 2, scoreB: 0, status: 'finished', date: '2026-03-04', time: '16:00', location: 'Quadra de Areia' },
  { id: 'm12', sport: 'Beach Tennis', category: 'Feminino', teamA: mockTeams[2], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '17:00', location: 'Quadra de Areia' },
  { id: 'm13', sport: 'Vôlei de Praia', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[2], scoreA: 1, scoreB: 1, status: 'live', date: '2026-03-04', time: '18:30', location: 'Quadra de Areia' },
  { id: 'm14', sport: 'Tamboréu', category: 'Masculino', teamA: mockTeams[3], teamB: mockTeams[0], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-04', time: '11:00', location: 'Quadra de Tamboréu' },
];

export const AVAILABLE_COURSES = [
  'Administração - Unisanta',
  'Administração - Strong',
  'Arquitetura - Unisanta',
  'Análise de Sistemas - Unip',
  'Ciên. Educ. - Unisantos',
  'Comunicação - Unisantos',
  'Direito - Unisanta',
  'Direito - Unisantos',
  'Direito - Esamc',
  'Educação Física - Unaerp',
  'Educação Física - Unifesp',
  'Educação Física - FPG',
  'Engenharia - Unisanta',
  'Engenharia - ESAMC',
  'Engenharia - Federal de Cubatão',
  'Farmácia - Unisanta',
  'FEFESP - Unisanta',
  'FEFIS - Unimes',
  'Fisioterapia - Unisanta',
  'Fisioterapia - Unifesp',
  'Fisioterapia - Unaerp',
  'Medicina - Unaerp',
  'Medicina - Unoeste',
  'Medicina Veterinária - São Judas',
  'Medicina Veterinária - Unimes',
  'Nutrição - Unisanta',
  'Nutrição - Unifesp',
  'Odontologia - Unisanta',
  'Odonto - São Judas',
  'Psicologia - Unisanta',
  'Rel. Internacionais - Unisanta',
  'Saúde - Unisantos',
  'Sistemas de Informação - Unisanta',
  'Tec. Inf. - Unisantos'
];

export const AVAILABLE_SPORTS = [
  'Futsal',
  'Futebol Society',
  'Handebol',
  'Vôlei',
  'Natação',
  'Karatê',
  'Judô',
  'Tamboréu',
  'Xadrez',
  'Tênis de Mesa',
  'Futevôlei',
  'Beach Tennis',
  'Vôlei de Praia',
  'Basquete 3x3'
];

export const SPORT_ICONS: Record<string, string> = {
  'Futsal': '⚽',
  'Futebol Society': '⚽',
  'Handebol': '🤾',
  'Vôlei': '🏐',
  'Natação': '🏊',
  'Karatê': '🥋',
  'Judô': '🥋',
  'Tamboréu': '🎾',
  'Xadrez': '♟️',
  'Tênis de Mesa': '🏓',
  'Futevôlei': '⚽',
  'Beach Tennis': '🎾',
  'Vôlei de Praia': '🏐',
  'Basquete 3x3': '🏀',
};

export const COURSE_ICONS: Record<string, string> = {
  'Administração': '💼',
  'Arquitetura': '📐',
  'Análise de Sistemas': '💻',
  'Ciên. Educ.': '📚',
  'Comunicação': '📣',
  'Direito': '⚖️',
  'Educação Física': '⚽',
  'FEFESP': '⚽',
  'Fefesp': '⚽',
  'FEFIS': '⚽',
  'Engenharia': '⚙️',
  'Farmácia': '💊',
  'Fisioterapia': '⚕️',
  'Medicina': '🏥',
  'Medicina Veterinária': '🐾',
  'Nutrição': '🍎',
  'Odontologia': '🦷',
  'Odonto': '🦷',
  'Psicologia': '🧠',
  'Rel. Internacionais': '🌎',
  'Saúde': '🏥',
  'Sistemas de Informação': '💻',
  'Tec. Inf.': '💻',
};

export interface News {
  id: string;
  title: string;
  summary: string;
  date: string;
  image?: string;
  url: string;
}

export const mockNews: News[] = [
  {
    id: 'n1',
    title: 'Comissão organizadora do 41º Jogos da Unisanta convoca atléticas para reunião de apresentação',
    summary: 'A Universidade Santa Cecília deu início à organização do 41º Jogos da Unisanta, que serão realizados entre os dias 4 e 22 de maio.',
    date: '24/02/2026',
    url: 'https://santaportal.com.br/jogos-da-unisanta/comissao-organizadora-do-41o-jogos-da-unisanta-convoca-atleticas-para-reuniao-de-apresentacao'
  },
  {
    id: 'n2',
    title: 'Entidades assistenciais recebem cerca de sete toneladas de alimentos arrecadados nos Jogos da Unisanta',
    summary: 'A Unisanta realizou, na manhã desta terça-feira (27), a cerimônia de entrega dos alimentos arrecadados durante os Jogos da Unisanta.',
    date: '27/05/2025',
    url: 'https://santaportal.com.br/jogos-da-unisanta/entidades-assistenciais-recebem-cerca-de-sete-toneladas-de-alimentos-arrecadados-nos-jogos-da-unisanta'
  },
  {
    id: 'n3',
    title: 'Fefesp é a campeã geral da 40ª edição dos Jogos da Unisanta',
    summary: 'A 40ª edição dos Jogos da Unisanta chegou ao fim nesta sexta-feira (23) e marcou uma noite histórica para a Fefesp Unisanta.',
    date: '23/05/2025',
    url: 'https://santaportal.com.br/jogos-da-unisanta/fefesp-e-a-campea-geral-da-40a-edicao-dos-jogos-da-unisanta'
  },
  {
    id: 'n4',
    title: 'Unimed Santos reconhece grandiosidade dos Jogos da Unisanta',
    summary: 'Levando o lema de vida saudável e da defesa da saúde a sério, a Unimed Santos integra o time de patrocinadores.',
    date: '23/05/2025',
    url: 'https://santaportal.com.br/jogos-da-unisanta/unimed-santos-reconhece-a-grandiosidade-dos-jogos-da-unisanta-e-integra-o-time-de-patrocinadores'
  },
  {
    id: 'n5',
    title: 'Sanmell Motos reafirma compromisso com a sociedade ao apoiar os Jogos da Unisanta',
    summary: 'Em seu primeiro ano de parceria, a Sanmell Motos reafirma seu compromisso em apoiar eventos voltados à saúde.',
    date: '23/05/2025',
    url: 'https://santaportal.com.br/jogos-da-unisanta/sanmell-motos-reafirma-compromisso-com-a-sociedade-ao-apoiar-os-jogos-da-unisanta'
  },
  {
    id: 'n6',
    title: 'Allyfutebol apoia o futuro da sociedade através dos Jogos da Unisanta',
    summary: 'Objetivando gerar um impacto positivo na sociedade, a Allyfutebol participa como um dos integrantes do time de apoiadores.',
    date: '23/05/2025',
    url: 'https://santaportal.com.br/jogos-da-unisanta/allyfutebol-apoia-o-futuro-da-sociedade-atraves-dos-jogos-da-unisanta'
  }
];
