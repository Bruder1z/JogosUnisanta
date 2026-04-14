export interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  preferredCourse?: string;
  favoriteTeam?: string;
  role: "superadmin" | "cliente";
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
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "start"
    | "end"
    | "set_win"
    | "halftime"
    | "penalty_scored"
    | "penalty_missed"
    | "shootout_scored"
    | "shootout_missed"
    | "tie_break_start"
    | "swimming_result"
    | "senshu"
    | "chui"
    | "hansoku"
    | "waza_ari"
    | "ippon"
    | "shido"
    | "hansoku_make"
    | "osaekomi"
    | "toketa"
    | "draw"
    | "chess_result";
  minute: number;
  teamId?: string; // Which team the event belongs to
  player?: string; // Name of the player (optional)
  description?: string; // Texto adicional para exibir na cronologia
  score?: string; // e.g., "25-23" (optional)
}

export interface Match {
  id: string;
  sport: string;
  category: "Masculino" | "Feminino";
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  participants?: Team[]; 
  status: "live" | "finished" | "scheduled";
  date: string;
  time: string;
  location: string;
  events?: MatchEvent[];
  stage?: string;
  mvpVotingStartedAt?: number; // Timestamp quando a votação MVP iniciou (status = finished)
}

export const mockUsers: User[] = [
  {
    id: "1",
    email: "superadmin@gmail.com",
    name: "Super Admin",
    role: "superadmin",
  },
  {
    id: "2",
    email: "cliente@gmail.com",
    name: "Cliente Teste",
    role: "cliente",
  },
];

export const mockTeams: Team[] = [
  { id: "1", name: "Fefesp - Unisanta", course: "Educação Física", logo: "⚽" },
  { id: "2", name: "Engenharia - Unisanta", course: "Engenharia", logo: "⚙️" },
  { id: "3", name: "Direito - Unisanta", course: "Direito", logo: "⚖️" },
  {
    id: "4",
    name: "Arquitetura - Unisanta",
    course: "Arquitetura",
    logo: "📐",
  },
];

export const mockMatches: Match[] = [
  {
    id: "m1",
    sport: "Futsal",
    category: "Masculino",
    teamA: mockTeams[0],
    teamB: mockTeams[1],
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    date: "2026-03-18",
    time: "14:30",
    location: "Ginásio Laerte Gonçalves",
    events: [],
  },
  {
    id: "m2",
    sport: "Futsal",
    category: "Feminino",
    teamA: {
      id: "t3",
      name: "Sistemas de Informação - Unisanta",
      course: "Sistemas",
    },
    teamB: {
      id: "t4",
      name: "Direito - Unisantos",
      course: "Direito",
    },
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    date: "2026-03-18",
    time: "15:30",
    location: "Ginásio Laerte Gonçalves",
    events: [],
  },
  {
    id: "m3",
    sport: "Vôlei",
    category: "Masculino",
    teamA: {
      id: "t5",
      name: "Engenharia - Unisanta",
      course: "Engenharia",
    },
    teamB: {
      id: "t6",
      name: "Administração - Unisanta",
      course: "Administração",
    },
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    date: "2026-03-18",
    time: "16:30",
    location: "Quadra 2 - Unisanta",
    events: [],
  },
];

export const AVAILABLE_COURSES = [
  "Administração - Strong",
  "Administração - Unisanta",
  "Análise de Sistemas - Unip",
  "Arquitetura - Unisanta",
  "Biologia - Unisanta",
  "Biomedicina - Unisanta",
  "Ciên. Educ. - Unisantos",
  "Comunicação - Unisantos",
  "Direito - Esamc",
  "Direito - Unimes",
  "Direito - Unisanta",
  "Direito - Unisantos",
  "Educação Física - FPG",
  "Educação Física - Unaerp",
  "Educação Física - Unifesp",
  "Enfermagem - Unisanta",
  "Engenharia - Esamc",
  "Engenharia - Federal de Cubatão",
  "Engenharia - Unisanta",
  "FAAC - Unisanta",
  "FACECS - Unisantos",
  "Farmácia - Unisanta",
  "FEFESP - Unisanta",
  "FEFIS - Unimes",
  "Fisioterapia - Unaerp",
  "Fisioterapia - Unifesp",
  "Fisioterapia - Unip",
  "Fisioterapia - Unisanta",
  "Medicina - São Judas",
  "Medicina - Unaerp",
  "Medicina - Unilus",
  "Medicina - Unimes",
  "Medicina - Unoeste",
  "Medicina Veterinária - São Judas",
  "Medicina Veterinária - Unimes",
  "Negócios - Esamc",
  "Nutrição - Unifesp",
  "Nutrição - Unisanta",
  "Odontologia - São Judas",
  "Odontologia - Unisanta",
  "Psicologia - Unisanta",
  "Rel. Internacionais - Unisanta",
  "Saúde - Unisantos",
  "Sistemas de Informação - Unisanta",
  "Tec. Inf. - Unisantos",
];

export const AVAILABLE_SPORTS = [
  "Basquete 3x3",
  "Basquetebol",
  "Beach Tennis",
  "Caratê",
  "Futebol Society",
  "Futebol X1",
  "Futevôlei",
  "Futsal",
  "Handebol",
  "Judô",
  "Natação",
  "Tamboréu",
  "Tênis de Mesa",
  "Vôlei",
  "Vôlei de Praia",
  "Xadrez",
];

export const SPORT_ICONS: Record<string, string> = {
  Futsal: "⚽",
  "Futebol Society": "⚽",
  Handebol: "🤾",
  Vôlei: "🏐",
  Natação: "🏊",
  Caratê: "🥋",
  Judô: "🥋",
  Tamboréu: "🎾",
  Xadrez: "♟️",
  "Tênis de Mesa": "🏓",
  Futevôlei: "⚽",
  "Beach Tennis": "🎾",
  "Vôlei de Praia": "🏐",
  "Basquete 3x3": "🏀",
  Basquetebol: "🏀",
  "Futebol X1": "⚽",
};

export const COURSE_ICONS: Record<string, string> = {
  Administração: "💼",
  Arquitetura: "📐",
  "Análise de Sistemas": "💻",
  Biologia: "🔬",
  Biomedicina: "🧬",
  "Ciên. Educ.": "📚",
  Comunicação: "📣",
  Direito: "⚖️",
  "Educação Física": "⚽",
  Enfermagem: "💉",
  FEFESP: "⚽",
  Fefesp: "⚽",
  FEFIS: "⚽",
  Engenharia: "⚙️",
  Farmácia: "💊",
  Fisioterapia: "⚕️",
  Medicina: "🏥",
  "Medicina Veterinária": "🐾",
  Negócios: "💼",
  Nutrição: "🍎",
  Odontologia: "🦷",
  Odonto: "🦷",
  Psicologia: "🧠",
  "Rel. Internacionais": "🌎",
  Saúde: "🏥",
  "Sistemas de Informação": "💻",
  "Tec. Inf.": "💻",
};

export const COURSE_EMBLEMS: Record<string, string> = {
  "Administração - Strong": "administração-strong.png.png",
  "Administração - Unisanta": "administracao-unisanta.png.png",
  "Análise de Sistemas - Unip": "analisedeSistemas-unip.png",
  "Arquitetura - Unisanta": "arquitetura-unisanta.png.PNG",
  "Biologia - Unisanta": "biologia-unisanta.png.png",
  "Biomedicina - Unisanta": "biomedicina-unisanta.png.png",
  "Ciên. Educ. - Unisantos": "cien.educ.unisantos.png.png",
  "Comunicação - Unisantos": "comunicacao.unisantos.png.png",
  "Direito - Esamc": "direito-esamc.png.png",
  "Direito - Unimes": "direito-unimes.png.png",
  "Direito - Unisanta": "direito-unisanta.png.PNG",
  "Direito - Unisantos": "direito-unisantos.png.png",
  "Educação Física - FPG": "fpg.png.png",
  "Educação Física - Unaerp": "educacao.fisica-unaerp.png.png",
  "Educação Física - Unifesp": "ed.fisica-unifesp.png.png",
  "Enfermagem - Unisanta": "enfermagem-unisanta.png",
  "Engenharia - Esamc": "engenharia-esamc.png.jpeg",
  "Engenharia - Federal de Cubatão": "engenhariafederalcubatao.png.png",
  "Engenharia - Unisanta": "engenharia-unisanta.png.png",
  "FAAC - Unisanta": "faac-unisanta.png.png",
  "FACECS - Unisantos": "facecs-unisantos,png.png",
  "Farmácia - Unisanta": "farmacia-unisanta.png.jpg",
  "FEFESP - Unisanta": "fefesp.png.jpg",
  "FEFIS - Unimes": "fefis.png.png",
  "Fisioterapia - Unaerp": "fisioterapia-unaerp.png.png",
  "Fisioterapia - Unifesp": "fisioterapia-unifesp.png.jpeg",
  "Fisioterapia - Unip": "fisioterapia-unip.png.png",
  "Fisioterapia - Unisanta": "fisioterapia-unisanta.png.png",
  "Medicina - São Judas": "medicina-saojudas.png.png",
  "Medicina - Unaerp": "medicina-unaerp.png.png",
  "Medicina - Unilus": "medicina-unilus.png.png",
  "Medicina - Unimes": "medicina-unimes.png",
  "Medicina - Unoeste": "medicina-unoeste.png",
  "Medicina Veterinária - São Judas": "medicinaveterinaria-saojudas.png.png",
  "Medicina Veterinária - Unimes": "medicinaveterinaria-unimes.png",
  "Negócios - Esamc": "negócios-esamc.png.png",
  "Nutrição - Unifesp": "nutrição-unifesp.png.png",
  "Nutrição - Unisanta": "nutrição-unisanta.png.png",
  "Odontologia - São Judas": "odontotologia-saojudas.png.png",
  "Odontologia - Unisanta": "odonto-unisanta.png.PNG",
  "Psicologia - Unisanta": "psicologia.png.jpg",
  "Rel. Internacionais - Unisanta": "rel-internacionais- unisanta.png.jpg",
  "Saúde - Unisantos": "saude-unisantos.png.png",
  "Sistemas de Informação - Unisanta": "sistemas.png.png",
  "Tec. Inf. - Unisantos": "ti unisantos.png",
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
    id: "n1",
    title:
      "Comissão organizadora do 41º Jogos da Unisanta convoca atléticas para reunião de apresentação",
    summary:
      "A Universidade Santa Cecília deu início à organização do 41º Jogos da Unisanta, que serão realizados entre os dias 4 e 22 de maio.",
    date: "24/02/2026",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2026/02/reuniao-Jogos-da-Unisanta-e1771626577726-696x547-1.jpeg",
    url: "https://santaportal.com.br/jogos-da-unisanta/comissao-organizadora-do-41o-jogos-da-unisanta-convoca-atleticas-para-reuniao-de-apresentacao",
  },
  {
    id: "n2",
    title:
      "Entidades assistenciais recebem cerca de sete toneladas de alimentos arrecadados nos Jogos da Unisanta",
    summary:
      "A Unisanta realizou, na manhã desta terça-feira (27), a cerimônia de entrega dos alimentos arrecadados durante os Jogos da Unisanta.",
    date: "27/05/2025",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2025/05/f4803cd7-0185-4da9-bb6a-b19d26f9e351.jpg",
    url: "https://santaportal.com.br/jogos-da-unisanta/entidades-assistenciais-recebem-cerca-de-sete-toneladas-de-alimentos-arrecadados-nos-jogos-da-unisanta",
  },
  {
    id: "n3",
    title: "Fefesp é a campeã geral da 40ª edição dos Jogos da Unisanta",
    summary:
      "A 40ª edição dos Jogos da Unisanta chegou ao fim nesta sexta-feira (23) e marcou uma noite histórica para a Fefesp Unisanta.",
    date: "23/05/2025",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2025/05/fefesp-campea-1.jpg",
    url: "https://santaportal.com.br/jogos-da-unisanta/fefesp-e-a-campea-geral-da-40a-edicao-dos-jogos-da-unisanta",
  },
  {
    id: "n4",
    title: "Unimed Santos reconhece grandiosidade dos Jogos da Unisanta",
    summary:
      "Levando o lema de vida saudável e da defesa da saúde a sério, a Unimed Santos integra o time de patrocinadores.",
    date: "23/05/2025",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-08.46.13.jpeg",
    url: "https://santaportal.com.br/jogos-da-unisanta/unimed-santos-reconhece-a-grandiosidade-dos-jogos-da-unisanta-e-integra-o-time-de-patrocinadores",
  },
  {
    id: "n5",
    title:
      "Sanmell Motos reafirma compromisso com a sociedade ao apoiar os Jogos da Unisanta",
    summary:
      "Em seu primeiro ano de parceria, a Sanmell Motos reafirma seu compromisso em apoiar eventos voltados à saúde.",
    date: "23/05/2025",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-08.16.28-1.jpeg",
    url: "https://santaportal.com.br/jogos-da-unisanta/sanmell-motos-reafirma-compromisso-com-a-sociedade-ao-apoiar-os-jogos-da-unisanta",
  },
  {
    id: "n6",
    title:
      "Allyfutebol apoia o futuro da sociedade através dos Jogos da Unisanta",
    summary:
      "Objetivando gerar um impacto positivo na sociedade, a Allyfutebol participa como um dos integrantes do time de apoiadores.",
    date: "23/05/2025",
    image:
      "https://santaportal.com.br/wp/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-14.36.31.jpeg",
    url: "https://santaportal.com.br/jogos-da-unisanta/allyfutebol-apoia-o-futuro-da-sociedade-atraves-dos-jogos-da-unisanta",
  },
];

export const mockRanking: RankingEntry[] = [
  // --- Pontuações Oficiais (decrescente → alfabético no empate) ---
  { rank: 1, course: "FEFESP - Unisanta", points: 182 },
  { rank: 2, course: "Engenharia - Unisanta", points: 166 },
  { rank: 3, course: "Medicina - Unilus", points: 114 },
  { rank: 4, course: "Fisioterapia - Unisanta", points: 96 },
  { rank: 5, course: "Educação Física - Unaerp", points: 78 },
  { rank: 6, course: "Medicina - Unaerp", points: 68 },
  { rank: 7, course: "Direito - Unisantos", points: 65 },
  { rank: 8, course: "FAAC - Unisanta", points: 55 },
  { rank: 9, course: "Medicina - Unimes", points: 52 },
  { rank: 10, course: "Educação Física - FPG", points: 33 },
  { rank: 11, course: "Direito - Unisanta", points: 32 },
  { rank: 12, course: "Odontologia - Unisanta", points: 30 },
  { rank: 13, course: "Medicina - Unoeste", points: 29 },
  { rank: 14, course: "Administração - Strong", points: 23 },
  { rank: 15, course: "Administração - Unisanta", points: 23 },
  { rank: 16, course: "Sistemas de Informação - Unisanta", points: 23 },
  { rank: 17, course: "FEFIS - Unimes", points: 22 },
  { rank: 18, course: "Fisioterapia - Unip", points: 18 },
  { rank: 19, course: "Engenharia - Federal de Cubatão", points: 8 },
  { rank: 20, course: "Arquitetura - Unisanta", points: 7 },
  { rank: 21, course: "Medicina - São Judas", points: 7 },
  { rank: 22, course: "Nutrição - Unisanta", points: 7 },
  { rank: 23, course: "Fisioterapia - Unaerp", points: 6 },
  { rank: 24, course: "Saúde - Unisantos", points: 6 },
  { rank: 25, course: "Comunicação - Unisantos", points: 5 },
  { rank: 26, course: "Direito - Unimes", points: 5 },
  { rank: 27, course: "Nutrição - Unifesp", points: 5 },
  { rank: 28, course: "Direito - Esamc", points: 3 },
  { rank: 29, course: "Enfermagem - Unisanta", points: 2 },
  { rank: 30, course: "Psicologia - Unisanta", points: 1 },
  { rank: 31, course: "Tec. Inf. - Unisantos", points: 1 },
  { rank: 32, course: "Análise de Sistemas - Unip", points: 0 },
  { rank: 33, course: "Biologia - Unisanta", points: 0 },
  { rank: 34, course: "Biomedicina - Unisanta", points: 0 },
  { rank: 35, course: "Ciên. Educ. - Unisantos", points: 0 },
  { rank: 36, course: "Educação Física - Unifesp", points: 0 },
  { rank: 37, course: "Engenharia - Esamc", points: 0 },
  { rank: 38, course: "FACECS - Unisantos", points: 0 },
  { rank: 39, course: "Farmácia - Unisanta", points: 0 },
  { rank: 40, course: "Fisioterapia - Unifesp", points: 0 },
  { rank: 41, course: "Medicina Veterinária - São Judas", points: 0 },
  { rank: 42, course: "Medicina Veterinária - Unimes", points: 0 },
  { rank: 43, course: "Negócios - Esamc", points: 0 },
  { rank: 44, course: "Odontologia - São Judas", points: 0 },
  { rank: 45, course: "Rel. Internacionais - Unisanta", points: 0 },
];

export const mockAthletes: Athlete[] = [
  {
    id: "a1",
    firstName: "Gabriel",
    lastName: "Silva",
    course: "Educação Física",
    institution: "FEFESP - Unisanta",
    sports: ["Futsal", "Futebol Society"],
  },
  {
    id: "a2",
    firstName: "Julia",
    lastName: "Santos",
    course: "Direito",
    institution: "Unisanta",
    sports: ["Vôlei", "Vôlei de Praia"],
  },
  {
    id: "a3",
    firstName: "Ricardo",
    lastName: "Oliveira",
    course: "Engenharia",
    institution: "Unisanta",
    sports: ["Basquete 3x3", "Natação"],
  },
  {
    id: "a4",
    firstName: "Beatriz",
    lastName: "Lima",
    course: "Medicina",
    institution: "Unaerp",
    sports: ["Handebol", "Natação"],
  },
  {
    id: "a5",
    firstName: "Lucas",
    lastName: "Souza",
    course: "Educação Física",
    institution: "FEFESP - Unisanta",
    sports: ["Futsal", "Judô"],
  },
  {
    id: "a6",
    firstName: "Mariana",
    lastName: "Costa",
    course: "Arquitetura",
    institution: "Unisanta",
    sports: ["Tênis de Mesa", "Xadrez"],
  },
  {
    id: "a7",
    firstName: "Felipe",
    lastName: "Rocha",
    course: "Psicologia",
    institution: "Unisanta",
    sports: ["Futevôlei", "Beach Tennis"],
  },
  {
    id: "a8",
    firstName: "Carolina",
    lastName: "Mendes",
    course: "Fisioterapia",
    institution: "Unisanta",
    sports: ["Vôlei", "Natação"],
  },
  {
    id: "a9",
    firstName: "Tiago",
    lastName: "Almeida",
    course: "Engenharia",
    institution: "Esamc",
    sports: ["Futebol Society"],
  },
  {
    id: "a10",
    firstName: "Larissa",
    lastName: "Fernandes",
    course: "Odontologia",
    institution: "Unisanta",
    sports: ["Handebol", "Vôlei"],
  },
  {
    id: "a11",
    firstName: "Guilherme",
    lastName: "Pinto",
    course: "Administração",
    institution: "Unisanta",
    sports: ["Basquete 3x3", "Futevôlei"],
  },
  {
    id: "a12",
    firstName: "Amanda",
    lastName: "Vieira",
    course: "Comunicação",
    institution: "Unisantos",
    sports: ["Beach Tennis"],
  },
  {
    id: "a13",
    firstName: "Rodrigo",
    lastName: "Cunha",
    course: "Direito",
    institution: "Esamc",
    sports: ["Tamboréu", "Tênis de Mesa"],
  },
  {
    id: "a14",
    firstName: "Isabela",
    lastName: "Carvalho",
    course: "Nutrição",
    institution: "Unisanta",
    sports: ["Vôlei de Praia", "Natação"],
  },
  {
    id: "a15",
    firstName: "Bruno",
    lastName: "Martins",
    course: "Engenharia",
    institution: "Federal de Cubatão",
    sports: ["Xadrez", "Basquete 3x3"],
  },
  {
    id: "a16",
    firstName: "Letícia",
    lastName: "Gomes",
    course: "Medicina Veterinária",
    institution: "São Judas",
    sports: ["Handebol"],
  },
  {
    id: "a17",
    firstName: "Mateus",
    lastName: "Barbosa",
    course: "Sistemas de Informação",
    institution: "Unisanta",
    sports: ["Futsal", "Basquete 3x3"],
  },
  {
    id: "a18",
    firstName: "Vanessa",
    lastName: "Teixeira",
    course: "Ciên. Educ.",
    institution: "Unisantos",
    sports: ["Karatê"],
  },
  {
    id: "a19",
    firstName: "Henrique",
    lastName: "Nunes",
    course: "Educação Física",
    institution: "Unifesp",
    sports: ["Judô", "Natação"],
  },
  {
    id: "a20",
    firstName: "Camila",
    lastName: "Cardoso",
    course: "Farmácia",
    institution: "Unisanta",
    sports: ["Tênis de Mesa"],
  },
  {
    id: "a21",
    firstName: "Arthur",
    lastName: "Mendes",
    course: "Direito",
    institution: "Unisanta",
    sports: ["Futsal"],
  },
  {
    id: "a22",
    firstName: "Brenda",
    lastName: "Duarte",
    course: "Medicina",
    institution: "Unoeste",
    sports: ["Vôlei"],
  },
  {
    id: "a23",
    firstName: "Caio",
    lastName: "Castro",
    course: "Educação Física",
    institution: "FPG",
    sports: ["Futebol Society"],
  },
  {
    id: "a24",
    firstName: "Debora",
    lastName: "Moura",
    course: "Fisioterapia",
    institution: "Unaerp",
    sports: ["Natação"],
  },
  {
    id: "a25",
    firstName: "Enzo",
    lastName: "Pereira",
    course: "Engenharia",
    institution: "Unisanta",
    sports: ["Basquete 3x3"],
  },
  {
    id: "a26",
    firstName: "Fernanda",
    lastName: "Lopes",
    course: "Arquitetura",
    institution: "Unisanta",
    sports: ["Handebol"],
  },
  {
    id: "a27",
    firstName: "Gustavo",
    lastName: "Xavier",
    course: "Análise de Sistemas",
    institution: "Unip",
    sports: ["Xadrez"],
  },
  {
    id: "a28",
    firstName: "Heloisa",
    lastName: "Farias",
    course: "Comunicação",
    institution: "Unisantos",
    sports: ["Tênis de Mesa"],
  },
  {
    id: "a29",
    firstName: "Igor",
    lastName: "Batista",
    course: "Direito",
    institution: "Unisantos",
    sports: ["Futevôlei"],
  },
  {
    id: "a30",
    firstName: "Jessica",
    lastName: "Andrade",
    course: "Educação Física",
    institution: "Unifesp",
    sports: ["Judô"],
  },
  {
    id: "a31",
    firstName: "Kevin",
    lastName: "Santos",
    course: "Administração",
    institution: "Strong",
    sports: ["Beach Tennis"],
  },
  {
    id: "a32",
    firstName: "Laura",
    lastName: "Moreira",
    course: "Farmácia",
    institution: "Unisanta",
    sports: ["Vôlei de Praia"],
  },
  {
    id: "a33",
    firstName: "Murilo",
    lastName: "Nascimento",
    course: "Odontologia",
    institution: "Unisanta",
    sports: ["Tamboréu"],
  },
  {
    id: "a34",
    firstName: "Nicole",
    lastName: "Assis",
    course: "Psicologia",
    institution: "Unisanta",
    sports: ["Natação"],
  },
  {
    id: "a35",
    firstName: "Otavio",
    lastName: "Lima",
    course: "Rel. Internacionais",
    institution: "Unisanta",
    sports: ["Futsal"],
  },
  {
    id: "a36",
    firstName: "Paola",
    lastName: "Ribeiro",
    course: "Nutrição",
    institution: "Unifesp",
    sports: ["Handebol"],
  },
  {
    id: "a37",
    firstName: "Quirino",
    lastName: "Gomes",
    course: "FEFESP",
    institution: "Unisanta",
    sports: ["Basquete 3x3", "Futebol Society"],
  },
  {
    id: "a38",
    firstName: "Rebeca",
    lastName: "Cavalcanti",
    course: "Fisioterapia",
    institution: "Unisanta",
    sports: ["Vôlei"],
  },
  {
    id: "a39",
    firstName: "Samuel",
    lastName: "Braga",
    course: "Engenharia",
    institution: "Esamc",
    sports: ["Beach Tennis"],
  },
  {
    id: "a40",
    firstName: "Tatiane",
    lastName: "Sales",
    course: "Direito",
    institution: "Esamc",
    sports: ["Handebol"],
  },
  {
    id: "a41",
    firstName: "Uriel",
    lastName: "Vasconcelos",
    course: "Sistemas de Informação",
    institution: "Unisanta",
    sports: ["Futsal", "Xadrez"],
  },
  {
    id: "a42",
    firstName: "Vitoria",
    lastName: "Bastos",
    course: "Medicina Veterinária",
    institution: "Unimes",
    sports: ["Natação"],
  },
  {
    id: "a43",
    firstName: "Wagner",
    lastName: "Melo",
    course: "Engenharia",
    institution: "Federal de Cubatão",
    sports: ["Judô"],
  },
  {
    id: "a44",
    firstName: "Ximena",
    lastName: "Perez",
    course: "Arquitetura",
    institution: "Unisanta",
    sports: ["Basquete 3x3"],
  },
  {
    id: "a45",
    firstName: "Yago",
    lastName: "Ramos",
    course: "Tec. Inf.",
    institution: "Unisantos",
    sports: ["Tênis de Mesa"],
  },
  {
    id: "a46",
    firstName: "Zoe",
    lastName: "Fontes",
    course: "Saúde",
    institution: "Unisantos",
    sports: ["Vôlei de Praia"],
  },
  {
    id: "a47",
    firstName: "Alan",
    lastName: "Galdino",
    course: "Educação Física",
    institution: "FEFIS - Unimes",
    sports: ["Handebol", "Futsal"],
  },
  {
    id: "a48",
    firstName: "Barbara",
    lastName: "França",
    course: "Medicina",
    institution: "Unaerp",
    sports: ["Natação"],
  },
  {
    id: "a49",
    firstName: "Caetano",
    lastName: "Veloso",
    course: "Comunicação",
    institution: "Unisantos",
    sports: ["Futevôlei"],
  },
  {
    id: "a50",
    firstName: "Dandara",
    lastName: "Mariana",
    course: "Direito",
    institution: "Unisanta",
    sports: ["Vôlei"],
  },
];
