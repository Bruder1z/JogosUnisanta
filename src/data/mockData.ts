export interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  preferredCourse?: string;
  favoriteTeam?: string;
  role: 'superadmin' | 'cliente';
  avatar?: string;
}

export interface RankingEntry {
  rank: number;
  course: string;
  points: number;
}

export interface Team {
  id: string;
  name: string;
  course: string;
  faculty?: string;
  logo?: string;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  course: string;
  institution: string;
  sports: string[];
  image?: string;
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

  // Future Matches (March 9, 10, 11)
  { id: 'm15', sport: 'Futsal', category: 'Masculino', teamA: mockTeams[2], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-09', time: '19:00', location: 'Ginásio Laerte Gonçalves' },
  { id: 'm16', sport: 'Vôlei', category: 'Feminino', teamA: mockTeams[0], teamB: mockTeams[1], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-09', time: '20:30', location: 'Poliesportivo Unisanta' },
  { id: 'm17', sport: 'Basquete 3x3', category: 'Masculino', teamA: mockTeams[0], teamB: mockTeams[2], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-10', time: '14:00', location: 'Pátio Bloco M' },
  { id: 'm18', sport: 'Natação', category: 'Feminino', teamA: mockTeams[1], teamB: mockTeams[2], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-10', time: '08:00', location: 'Piscina Olímpica' },
  { id: 'm19', sport: 'Futebol Society', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-11', time: '17:00', location: 'Campo Society' },
  { id: 'm20', sport: 'Handebol', category: 'Masculino', teamA: mockTeams[1], teamB: mockTeams[3], scoreA: 0, scoreB: 0, status: 'scheduled', date: '2026-03-11', time: '20:00', location: 'Ginásio Laerte' },
];

export const AVAILABLE_COURSES = [
  'Administração - Strong',
  'Administração - Unisanta',
  'Análise de Sistemas - Unip',
  'Arquitetura - Unisanta',
  'Biomedicina - Unisanta',
  'Ciên. Educ. - Unisantos',
  'Comunicação - Unisantos',
  'Direito - Esamc',
  'Direito - Unimes',
  'Direito - Unisanta',
  'Direito - Unisantos',
  'Educação Física - FPG',
  'Educação Física - Unaerp',
  'Educação Física - Unifesp',
  'Engenharia - ESAMC',
  'Engenharia - Federal de Cubatão',
  'Engenharia - Unisanta',
  'FAAC - Unisanta',
  'FACECS - Unisantos',
  'Farmácia - Unisanta',
  'FEFESP - Unisanta',
  'FEFIS - Unimes',
  'Fisioterapia - Unaerp',
  'Fisioterapia - Unifesp',
  'Fisioterapia - Unisanta',
  'Medicina - Unaerp',
  'Medicina - Unilus',
  'Medicina - Unoeste',
  'Medicina Veterinária - São Judas',
  'Nutrição - Unifesp',
  'Nutrição - Unisanta',
  'Odonto - São Judas',
  'Odontologia - Unisanta',
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

export const COURSE_EMBLEMS: Record<string, string> = {
  'Administração - Strong': 'administração-strong.png.jpeg',
  'Administração - Unisanta': 'administração-unisanta.png.png',
  'Análise de Sistemas - Unip': 'analisedeSistemas-unip.png',
  'Arquitetura - Unisanta': 'arquitetura-unisanta.png.PNG',
  'Biomedicina - Unisanta': 'biomedicina-unisanta.png.png',
  'Ciên. Educ. - Unisantos': 'cien.educ.unisantos.png.png',
  'Comunicação - Unisantos': 'comunicacao.unisantos.png.png',
  'Direito - Esamc': 'direito-esamc.png.png',
  'Direito - Unimes': 'direito-unimes.png.png',
  'Direito - Unisanta': 'direito-unisanta.png.PNG',
  'Direito - Unisantos': 'direito-unisantos.png.png',
  'Educação Física - FPG': 'fpg.png.png',
  'Educação Física - Unaerp': 'educacao.fisica-unaerp.png.png',
  'Educação Física - Unifesp': 'ed.fisica-unifesp.png.png',
  'Engenharia - ESAMC': 'engenharia-esamc.png.jpeg',
  'Engenharia - Federal de Cubatão': 'engenhariafederalcubatao.png.png',
  'Engenharia - Unisanta': 'engenharia-unisanta.png.png',
  'FAAC - Unisanta': 'faac-unisanta.png.png',
  'FACECS - Unisantos': 'facecs-unisantos,png.png',
  'Farmácia - Unisanta': 'farmacia-unisanta.png.jpg',
  'FEFESP - Unisanta': 'fefesp.png.jpg',
  'FEFIS - Unimes': 'fefis.png.png',
  'Fisioterapia - Unaerp': 'fisioterapia-unaerp.png.png',
  'Fisioterapia - Unifesp': 'fisioterapia-unifesp.png.jpeg',
  'Fisioterapia - Unisanta': 'fisioterapia-unisanta.png.png',
  'Medicina - Unaerp': 'medicina-unaerp.png.png',
  'Medicina - Unilus': 'medicina-unilus.png.png',
  'Medicina - Unoeste': 'medicina-unoeste.png.png',
  'Medicina Veterinária - São Judas': 'medicinaveterinaria-saojudas.png.png',
  'Nutrição - Unifesp': 'nutrição-unifesp.png.png',
  'Nutrição - Unisanta': 'nutrição-unisanta.png.png',
  'Odonto - São Judas': 'odonto-sao judas.png.png',
  'Odontologia - Unisanta': 'odonto-unisanta.png.PNG',
  'Psicologia - Unisanta': 'psicologia.png.jpg',
  'Rel. Internacionais - Unisanta': 'rel-internacionais- unisanta.png.jpg',
  'Saúde - Unisantos': 'saude-unisantos.png.png',
  'Sistemas de Informação - Unisanta': 'sistemas.png.png',
  'Tec. Inf. - Unisantos': 'ti unisantos.png.png'
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
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2026/02/reuniao-Jogos-da-Unisanta-e1771626577726-696x547-1.jpeg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/comissao-organizadora-do-41o-jogos-da-unisanta-convoca-atleticas-para-reuniao-de-apresentacao'
  },
  {
    id: 'n2',
    title: 'Entidades assistenciais recebem cerca de sete toneladas de alimentos arrecadados nos Jogos da Unisanta',
    summary: 'A Unisanta realizou, na manhã desta terça-feira (27), a cerimônia de entrega dos alimentos arrecadados durante os Jogos da Unisanta.',
    date: '27/05/2025',
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2025/05/f4803cd7-0185-4da9-bb6a-b19d26f9e351.jpg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/entidades-assistenciais-recebem-cerca-de-sete-toneladas-de-alimentos-arrecadados-nos-jogos-da-unisanta'
  },
  {
    id: 'n3',
    title: 'Fefesp é a campeã geral da 40ª edição dos Jogos da Unisanta',
    summary: 'A 40ª edição dos Jogos da Unisanta chegou ao fim nesta sexta-feira (23) e marcou uma noite histórica para a Fefesp Unisanta.',
    date: '23/05/2025',
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2025/05/fefesp-campea-1.jpg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/fefesp-e-a-campea-geral-da-40a-edicao-dos-jogos-da-unisanta'
  },
  {
    id: 'n4',
    title: 'Unimed Santos reconhece grandiosidade dos Jogos da Unisanta',
    summary: 'Levando o lema de vida saudável e da defesa da saúde a sério, a Unimed Santos integra o time de patrocinadores.',
    date: '23/05/2025',
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-08.46.13.jpeg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/unimed-santos-reconhece-a-grandiosidade-dos-jogos-da-unisanta-e-integra-o-time-de-patrocinadores'
  },
  {
    id: 'n5',
    title: 'Sanmell Motos reafirma compromisso com a sociedade ao apoiar os Jogos da Unisanta',
    summary: 'Em seu primeiro ano de parceria, a Sanmell Motos reafirma seu compromisso em apoiar eventos voltados à saúde.',
    date: '23/05/2025',
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-08.16.28-1.jpeg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/sanmell-motos-reafirma-compromisso-com-a-sociedade-ao-apoiar-os-jogos-da-unisanta'
  },
  {
    id: 'n6',
    title: 'Allyfutebol apoia o futuro da sociedade através dos Jogos da Unisanta',
    summary: 'Objetivando gerar um impacto positivo na sociedade, a Allyfutebol participa como um dos integrantes do time de apoiadores.',
    date: '23/05/2025',
    image: 'https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-14.36.31.jpeg',
    url: 'https://santaportal.com.br/jogos-da-unisanta/allyfutebol-apoia-o-futuro-da-sociedade-atraves-dos-jogos-da-unisanta'
  }
];

export const mockRanking: RankingEntry[] = [
  { rank: 1, course: 'FEFESP - Unisanta', points: 450 },
  { rank: 2, course: 'Direito - Unisanta', points: 380 },
  { rank: 3, course: 'Engenharia - Unisanta', points: 320 },
  { rank: 4, course: 'Medicina - Unaerp', points: 290 },
  { rank: 5, course: 'Fisioterapia - Unisanta', points: 260 },
  { rank: 6, course: 'Odontologia - Unisanta', points: 240 },
  { rank: 7, course: 'Administração - Unisanta', points: 210 },
  { rank: 8, course: 'Arquitetura - Unisanta', points: 195 },
  { rank: 9, course: 'Psicologia - Unisanta', points: 180 },
  { rank: 10, course: 'Sistemas de Informação - Unisanta', points: 165 },
  { rank: 11, course: 'Comunicação - Unisantos', points: 150 },
  { rank: 12, course: 'Direito - Unisantos', points: 145 },
  { rank: 13, course: 'FEFIS - Unimes', points: 140 },
  { rank: 14, course: 'Educação Física - Unaerp', points: 135 },
  { rank: 15, course: 'Engenharia - ESAMC', points: 130 },
  { rank: 16, course: 'Farmácia - Unisanta', points: 125 },
  { rank: 17, course: 'Nutrição - Unisanta', points: 120 },
  { rank: 18, course: 'Medicina - Unoeste', points: 115 },
  { rank: 19, course: 'Rel. Internacionais - Unisanta', points: 110 },
  { rank: 20, course: 'Fisioterapia - Unifesp', points: 105 },
  { rank: 21, course: 'Educação Física - Unifesp', points: 100 },
  { rank: 22, course: 'Direito - Esamc', points: 95 },
  { rank: 23, course: 'Ciên. Educ. - Unisantos', points: 90 },
  { rank: 24, course: 'Engenharia - Federal de Cubatão', points: 85 },
  { rank: 25, course: 'Fisioterapia - Unaerp', points: 80 },
  { rank: 26, course: 'Medicina Veterinária - São Judas', points: 75 },
  { rank: 28, course: 'Nutrição - Unifesp', points: 65 },
  { rank: 29, course: 'Odonto - São Judas', points: 60 },
  { rank: 30, course: 'Saúde - Unisantos', points: 55 },
  { rank: 31, course: 'Tec. Inf. - Unisantos', points: 50 },
  { rank: 32, course: 'Administração - Strong', points: 45 },
  { rank: 33, course: 'Análise de Sistemas - Unip', points: 40 },
  { rank: 34, course: 'Educação Física - FPG', points: 35 },
];

export const mockAthletes: Athlete[] = [
  { id: 'a1', firstName: 'Gabriel', lastName: 'Silva', course: 'Educação Física', institution: 'FEFESP - Unisanta', sports: ['Futsal', 'Futebol Society'] },
  { id: 'a2', firstName: 'Julia', lastName: 'Santos', course: 'Direito', institution: 'Unisanta', sports: ['Vôlei', 'Vôlei de Praia'] },
  { id: 'a3', firstName: 'Ricardo', lastName: 'Oliveira', course: 'Engenharia', institution: 'Unisanta', sports: ['Basquete 3x3', 'Natação'] },
  { id: 'a4', firstName: 'Beatriz', lastName: 'Lima', course: 'Medicina', institution: 'Unaerp', sports: ['Handebol', 'Natação'] },
  { id: 'a5', firstName: 'Lucas', lastName: 'Souza', course: 'Educação Física', institution: 'FEFESP - Unisanta', sports: ['Futsal', 'Judô'] },
  { id: 'a6', firstName: 'Mariana', lastName: 'Costa', course: 'Arquitetura', institution: 'Unisanta', sports: ['Tênis de Mesa', 'Xadrez'] },
  { id: 'a7', firstName: 'Felipe', lastName: 'Rocha', course: 'Psicologia', institution: 'Unisanta', sports: ['Futevôlei', 'Beach Tennis'] },
  { id: 'a8', firstName: 'Carolina', lastName: 'Mendes', course: 'Fisioterapia', institution: 'Unisanta', sports: ['Vôlei', 'Natação'] },
  { id: 'a9', firstName: 'Tiago', lastName: 'Almeida', course: 'Engenharia', institution: 'ESAMC', sports: ['Futebol Society'] },
  { id: 'a10', firstName: 'Larissa', lastName: 'Fernandes', course: 'Odontologia', institution: 'Unisanta', sports: ['Handebol', 'Vôlei'] },
  { id: 'a11', firstName: 'Guilherme', lastName: 'Pinto', course: 'Administração', institution: 'Unisanta', sports: ['Basquete 3x3', 'Futevôlei'] },
  { id: 'a12', firstName: 'Amanda', lastName: 'Vieira', course: 'Comunicação', institution: 'Unisantos', sports: ['Beach Tennis'] },
  { id: 'a13', firstName: 'Rodrigo', lastName: 'Cunha', course: 'Direito', institution: 'Esamc', sports: ['Tamboréu', 'Tênis de Mesa'] },
  { id: 'a14', firstName: 'Isabela', lastName: 'Carvalho', course: 'Nutrição', institution: 'Unisanta', sports: ['Vôlei de Praia', 'Natação'] },
  { id: 'a15', firstName: 'Bruno', lastName: 'Martins', course: 'Engenharia', institution: 'Federal de Cubatão', sports: ['Xadrez', 'Basquete 3x3'] },
  { id: 'a16', firstName: 'Letícia', lastName: 'Gomes', course: 'Medicina Veterinária', institution: 'São Judas', sports: ['Handebol'] },
  { id: 'a17', firstName: 'Mateus', lastName: 'Barbosa', course: 'Sistemas de Informação', institution: 'Unisanta', sports: ['Futsal', 'Basquete 3x3'] },
  { id: 'a18', firstName: 'Vanessa', lastName: 'Teixeira', course: 'Ciên. Educ.', institution: 'Unisantos', sports: ['Karatê'] },
  { id: 'a19', firstName: 'Henrique', lastName: 'Nunes', course: 'Educação Física', institution: 'Unifesp', sports: ['Judô', 'Natação'] },
  { id: 'a20', firstName: 'Camila', lastName: 'Cardoso', course: 'Farmácia', institution: 'Unisanta', sports: ['Tênis de Mesa'] },
  { id: 'a21', firstName: 'Arthur', lastName: 'Mendes', course: 'Direito', institution: 'Unisanta', sports: ['Futsal'] },
  { id: 'a22', firstName: 'Brenda', lastName: 'Duarte', course: 'Medicina', institution: 'Unoeste', sports: ['Vôlei'] },
  { id: 'a23', firstName: 'Caio', lastName: 'Castro', course: 'Educação Física', institution: 'FPG', sports: ['Futebol Society'] },
  { id: 'a24', firstName: 'Debora', lastName: 'Moura', course: 'Fisioterapia', institution: 'Unaerp', sports: ['Natação'] },
  { id: 'a25', firstName: 'Enzo', lastName: 'Pereira', course: 'Engenharia', institution: 'Unisanta', sports: ['Basquete 3x3'] },
  { id: 'a26', firstName: 'Fernanda', lastName: 'Lopes', course: 'Arquitetura', institution: 'Unisanta', sports: ['Handebol'] },
  { id: 'a27', firstName: 'Gustavo', lastName: 'Xavier', course: 'Análise de Sistemas', institution: 'Unip', sports: ['Xadrez'] },
  { id: 'a28', firstName: 'Heloisa', lastName: 'Farias', course: 'Comunicação', institution: 'Unisantos', sports: ['Tênis de Mesa'] },
  { id: 'a29', firstName: 'Igor', lastName: 'Batista', course: 'Direito', institution: 'Unisantos', sports: ['Futevôlei'] },
  { id: 'a30', firstName: 'Jessica', lastName: 'Andrade', course: 'Educação Física', institution: 'Unifesp', sports: ['Judô'] },
  { id: 'a31', firstName: 'Kevin', lastName: 'Santos', course: 'Administração', institution: 'Strong', sports: ['Beach Tennis'] },
  { id: 'a32', firstName: 'Laura', lastName: 'Moreira', course: 'Farmácia', institution: 'Unisanta', sports: ['Vôlei de Praia'] },
  { id: 'a33', firstName: 'Murilo', lastName: 'Nascimento', course: 'Odontologia', institution: 'Unisanta', sports: ['Tamboréu'] },
  { id: 'a34', firstName: 'Nicole', lastName: 'Assis', course: 'Psicologia', institution: 'Unisanta', sports: ['Natação'] },
  { id: 'a35', firstName: 'Otavio', lastName: 'Lima', course: 'Rel. Internacionais', institution: 'Unisanta', sports: ['Futsal'] },
  { id: 'a36', firstName: 'Paola', lastName: 'Ribeiro', course: 'Nutrição', institution: 'Unifesp', sports: ['Handebol'] },
  { id: 'a37', firstName: 'Quirino', lastName: 'Gomes', course: 'FEFESP', institution: 'Unisanta', sports: ['Basquete 3x3', 'Futebol Society'] },
  { id: 'a38', firstName: 'Rebeca', lastName: 'Cavalcanti', course: 'Fisioterapia', institution: 'Unisanta', sports: ['Vôlei'] },
  { id: 'a39', firstName: 'Samuel', lastName: 'Braga', course: 'Engenharia', institution: 'ESAMC', sports: ['Beach Tennis'] },
  { id: 'a40', firstName: 'Tatiane', lastName: 'Sales', course: 'Direito', institution: 'Esamc', sports: ['Handebol'] },
  { id: 'a41', firstName: 'Uriel', lastName: 'Vasconcelos', course: 'Sistemas de Informação', institution: 'Unisanta', sports: ['Futsal', 'Xadrez'] },
  { id: 'a42', firstName: 'Vitoria', lastName: 'Bastos', course: 'Medicina Veterinária', institution: 'Unimes', sports: ['Natação'] },
  { id: 'a43', firstName: 'Wagner', lastName: 'Melo', course: 'Engenharia', institution: 'Federal de Cubatão', sports: ['Judô'] },
  { id: 'a44', firstName: 'Ximena', lastName: 'Perez', course: 'Arquitetura', institution: 'Unisanta', sports: ['Basquete 3x3'] },
  { id: 'a45', firstName: 'Yago', lastName: 'Ramos', course: 'Tec. Inf.', institution: 'Unisantos', sports: ['Tênis de Mesa'] },
  { id: 'a46', firstName: 'Zoe', lastName: 'Fontes', course: 'Saúde', institution: 'Unisantos', sports: ['Vôlei de Praia'] },
  { id: 'a47', firstName: 'Alan', lastName: 'Galdino', course: 'Educação Física', institution: 'FEFIS - Unimes', sports: ['Handebol', 'Futsal'] },
  { id: 'a48', firstName: 'Barbara', lastName: 'França', course: 'Medicina', institution: 'Unaerp', sports: ['Natação'] },
  { id: 'a49', firstName: 'Caetano', lastName: 'Veloso', course: 'Comunicação', institution: 'Unisantos', sports: ['Futevôlei'] },
  { id: 'a50', firstName: 'Dandara', lastName: 'Mariana', course: 'Direito', institution: 'Unisanta', sports: ['Vôlei'] },
];
