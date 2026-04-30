import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    Users,
    PlusCircle,
    Trophy,
    Layout,
    BookOpen,
    Trash2,
    Edit3,
    Check,
    Award,
    Plus,
    Upload,
    Info,
    Download,
    Shield
} from 'lucide-react';
import { COURSE_EMBLEMS, COURSE_ICONS, AVAILABLE_SPORTS } from '../../data/mockData';
import { useData } from '../context/DataContext';
import Toast from './Toast';

const NORMALIZE_COURSE_MAP: Record<string, string> = {
  "ODONTO": "Odontologia",
  "ED. FIS.": "Educação Física",
  "ED. FÍSICA": "Educação Física",
  "ED FISICA": "Educação Física",
  "SIST. INF.": "Sistemas de Informação",
  "SIST INF": "Sistemas de Informação",
  "SIST INFO": "Sistemas de Informação",
  "FISIO.": "Fisioterapia",
  "FÍSIO": "Fisioterapia",
  "FISIO": "Fisioterapia",
  "MED. VET": "Medicina Veterinária",
  "MED VET": "Medicina Veterinária",
  "MED.": "Medicina",
  "MED": "Medicina",
  "ARQUIT.": "Arquitetura",
  "ARQUIT": "Arquitetura",
  "NUTRIÇÃO": "Nutrição",
  "DIREITO": "Direito",
  "ADM.": "Administração",
  "ADM": "Administração",
  "ENG.": "Engenharia",
  "ENG": "Engenharia",
  "COMUNIC.": "Comunicação",
  "COMUNIC": "Comunicação",
  "COMUNICAÇÃO": "Comunicação",
  "COMMEX": "Comex",
  "COMEX": "Comex",
  "ANALI SIST": "Análise de Sistemas",
  "PSICO.": "Psicologia",
  "PSICO": "Psicologia",
  "ENFERM.": "Enfermagem",
  "BIOMED": "Biomedicina",
  "BIOLOG": "Biologia",
  "BIOL": "Biologia",
  "CIEN. EDUC.": "Ciên. Educ.",
  "CIEN EDUC": "Ciên. Educ.",
  "CIEN. EDU.": "Ciên. Educ.",
  "CIEN. ED.": "Ciên. Educ.",
  "TEC. INF.": "Tec. Inf.",
  "TEC INF": "Tec. Inf.",
  "TEC INFO": "Tec. Inf.",
  "ANAL. SIST.": "Análise de Sistemas",
  "ANALIS. SIST.": "Análise de Sistemas",
  "ANALIS SIST": "Análise de Sistemas",
  "ANALISE SIST": "Análise de Sistemas",
  "ANALIS": "Análise de Sistemas",
  "CIEN. DADOS": "Ciência de Dados",
  "CIEN DADOS": "Ciência de Dados",
  "FARMÁCIA": "Farmácia",
  "FARMACIA": "Farmácia",
  "FAAC": "FAAC",
  "FACECS": "FACECS",
  "FEFESP": "FEFESP",
  "FEFIS": "FEFIS",
  "REL.INT.": "Rel. Internacionais",
  "REL. INT.": "Rel. Internacionais",
  "REL INT": "Rel. Internacionais",
  "REL. INTERNACIONAIS": "Rel. Internacionais",
  "TERAPIA OCUP": "Terapia Ocupacional",
  "TERAPIA OCUP.": "Terapia Ocupacional",
  "TERAP. OCUP.": "Terapia Ocupacional",
  "TERAP OCUP": "Terapia Ocupacional",
  "NEG.": "Negócios",
  "NEGÓCIOS": "Negócios",
  "NEGOCIOS": "Negócios",
  "SAUDE": "Saúde",
  "SAÚDDE": "Saúde",
  "SAÚDE": "Saúde",
  "BIOLOGIA": "Biologia"
};

const NORMALIZE_INST_MAP: Record<string, string> = {
  "UNISANTA": "Unisanta",
  "UNISANTOS": "Unisantos",
  "UNIFESP": "Unifesp",
  "UNAERP": "Unaerp",
  "UNIMES": "Unimes",
  "UNIP": "Unip",
  "ESAMC": "Esamc",
  "FPG": "FPG",
  "UNILUS": "Unilus",
  "UNOESTE": "Unoeste",
  "FATEC": "Fatec",
  // São Judas — variantes
  "SÃO JUDAS": "São Judas",
  "SAO JUDAS": "São Judas",
  "S. JUDAS": "São Judas",
  "S.JUDAS": "São Judas",
  "USJT": "São Judas",
  // Federal de Cubatão — variantes
  "FED. CUBATÃO": "Federal de Cubatão",
  "FED CUBATÃO": "Federal de Cubatão",
  "FED. CUBATAO": "Federal de Cubatão",
  "FED CUBATAO": "Federal de Cubatão",
  "FEDERAL CUBATÃO": "Federal de Cubatão",
  "FEDERAL DE CUBATÃO": "Federal de Cubatão",
  "FEDERAL CUBATAO": "Federal de Cubatão",
  "FED DE CUBATÃO": "Federal de Cubatão",
  "FED DE CUBATAO": "Federal de Cubatão",
  // Outras variantes
  "STRONG": "Strong",
  "UNESP": "Unesp",
  "UNISAL": "Unisal",
};

// Mapeamento de abreviações da planilha para modalidade e categoria
const MODALIDADE_MAP: Record<string, { sport: string; category: 'Masculino' | 'Feminino' }> = {
  'FSM':          { sport: 'Futsal',           category: 'Masculino' },
  'FSF':          { sport: 'Futsal',           category: 'Feminino'  },
  'FM':           { sport: 'Futebol Society',  category: 'Masculino' },
  'FF':           { sport: 'Futebol Society',  category: 'Feminino'  },
  'FM 1X1':       { sport: 'Futebol X1',       category: 'Masculino' },
  'FF 1X1':       { sport: 'Futebol X1',       category: 'Feminino'  },
  'VM':           { sport: 'Vôlei',            category: 'Masculino' },
  'VF':           { sport: 'Vôlei',            category: 'Feminino'  },
  'VPM':          { sport: 'Vôlei de Praia',   category: 'Masculino' },
  'VPF':          { sport: 'Vôlei de Praia',   category: 'Feminino'  },
  'BM':           { sport: 'Basquetebol',      category: 'Masculino' },
  'BF':           { sport: 'Basquetebol',      category: 'Feminino'  },
  'BM 3X3':       { sport: 'Basquete 3x3',     category: 'Masculino' },
  'BF 3X3':       { sport: 'Basquete 3x3',     category: 'Feminino'  },
  'HM':           { sport: 'Handebol',         category: 'Masculino' },
  'HF':           { sport: 'Handebol',         category: 'Feminino'  },
  'TMM':          { sport: 'Tênis de Mesa',    category: 'Masculino' },
  'TMF':          { sport: 'Tênis de Mesa',    category: 'Feminino'  },
  'B TENNIS M':   { sport: 'Beach Tennis',     category: 'Masculino' },
  'B TENNIS F':   { sport: 'Beach Tennis',     category: 'Feminino'  },
  'TAMB. M':      { sport: 'Tamboréu',         category: 'Masculino' },
  'TAMB. F':      { sport: 'Tamboréu',         category: 'Feminino'  },
  'FUTEVÔLEI M':  { sport: 'Futevôlei',        category: 'Masculino' },
  'FUTEVÔLEI F':  { sport: 'Futevôlei',        category: 'Feminino'  },
  'FUTEVOLEI M':  { sport: 'Futevôlei',        category: 'Masculino' },
  'FUTEVOLEI F':  { sport: 'Futevôlei',        category: 'Feminino'  },
  'XADREZ':       { sport: 'Xadrez',           category: 'Masculino' },
  'NATAÇÃO':      { sport: 'Natação',          category: 'Masculino' },
  'NATACAO':      { sport: 'Natação',          category: 'Masculino' },
  'CARATÊ':       { sport: 'Caratê',           category: 'Masculino' },
  'KARATE':       { sport: 'Caratê',           category: 'Masculino' },
  'JUDÔ':         { sport: 'Judô',             category: 'Masculino' },
  'JUDO':         { sport: 'Judô',             category: 'Masculino' },
};

const parseModalidade = (raw: string): { sport: string; category: 'Masculino' | 'Feminino' } => {
  const key = raw.trim().toUpperCase();
  if (MODALIDADE_MAP[key]) return MODALIDADE_MAP[key];
  // fallback: retorna o valor bruto como sport e Masculino como categoria
  return { sport: raw.trim(), category: 'Masculino' };
};

const normalizeTeamName = (rawName: string) => {
    if (!rawName) return "";
    let name = rawName.toUpperCase().trim();
    let foundInst = "";

    // Sort keys by length descending to match longest possible pattern first
    const sortedInstKeys = Object.keys(NORMALIZE_INST_MAP).sort((a,b) => b.length - a.length);
    for (const key of sortedInstKeys) {
        if (name.includes(key)) {
            foundInst = NORMALIZE_INST_MAP[key];
            name = name.replace(key, "").trim();
            break;
        }
    }

    // Clean up typical delimiters
    // Limpar delimitadores comuns usados na planilha entre curso e instituição
    name = name.replace(/^[-–—\/\(\)\s]+/, "").replace(/[-–—\/\(\)\s]+$/, "").trim();

    let foundCourse = name;
    const sortedCourseKeys = Object.keys(NORMALIZE_COURSE_MAP).sort((a,b) => b.length - a.length);
    
    // 1. Try exact match
    let matched = false;
    for (const key of sortedCourseKeys) {
        if (name === key) {
            foundCourse = NORMALIZE_COURSE_MAP[key];
            matched = true;
            break;
        }
    }
    
    // 2. Try partial match if not matched exactly
    if (!matched) {
        for (const key of sortedCourseKeys) {
             if (name.includes(key)) {
                 foundCourse = name.replace(key, NORMALIZE_COURSE_MAP[key]).trim();
                 matched = true;
                 break;
             }
        }
    }
    
    if (!foundInst) return foundCourse;
    return `${foundCourse} - ${foundInst}`;
};

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Matches Filter
    const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

    // Course Search Filter
    const [courseSearch, setCourseSearch] = useState('');

    // Modal & Feedback States
    const [selectedStat, setSelectedStat] = useState<any>(null);
    const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
    const [isImportMatchesOpen, setIsImportMatchesOpen] = useState(false);
    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
    const [isNewAthleteOpen, setIsNewAthleteOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [importStatus, setImportStatus] = useState<{current: number, total: number, message: string, errors: string[]} | null>(null);
    const [showImportInfo, setShowImportInfo] = useState(false);
    const [previewMatches, setPreviewMatches] = useState<any[]>([]);
    const removePreviewMatch = (id: string) => {
        setPreviewMatches(prev => prev.filter(m => m.id !== id));
    };
    const [matchImportStatus, setMatchImportStatus] = useState<{
        current: number, 
        total: number, 
        successCount: number, 
        errorCount: number,
        skippedCount: number,
        errors: string[]
    } | null>(null);
    // DataContext
    const { 
        courses: coursesList, 
        addCourse, 
        removeCourse, 
        athletes: athletesList, 
        addAthlete, 
        removeAthlete, 
        customEmblems, 
        addCustomEmblem, 
        matches, 
        addMatch, 
        updateMatch, 
        deleteMatch, 
        ranking, 
        updateRankingPoints,
        featuredAthletes,
        addFeaturedAthlete,
        removeFeaturedAthlete,
        resetRankingPoints
    } = useData();

    // Ranking edit state: course -> pending points value
    const [editingCourse, setEditingCourse] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    // Form and Data States
    const [newCourseForm, setNewCourseForm] = useState({ name: '', university: '', emblem: '' });
    const [newAthleteForm, setNewAthleteForm] = useState({ name: '', university: '', course: '', sport: '' });

    const [isAddingFeatured, setIsAddingFeatured] = useState(false);
    const [newFeatured, setNewFeatured] = useState({
        athleteId: '',
        name: '',
        institution: '',
        course: '',
        sport: '',
        reason: '',
        gender: ''
    });

    // Filter states for athlete forms
    const [athleteFacultyFilter, setAthleteFacultyFilter] = useState('');
    const [featuredFacultyFilter, setFeaturedFacultyFilter] = useState('');

    // Helpers derived from coursesList
    const uniqueFaculties = [...new Set(coursesList.map(c => c.split(' - ')[1]).filter(Boolean))].sort();
    const coursesForFaculty = (faculty: string) =>
        coursesList
            .filter(c => c.split(' - ')[1] === faculty)
            .map(c => c.split(' - ')[0])
            .sort();

    // Form States
    const [newMatchForm, setNewMatchForm] = useState({
        teamA: '', facultyA: '', teamB: '', facultyB: '', sport: '', category: 'Masculino' as 'Masculino' | 'Feminino', stage: 'Fase de Classificação' as 'Fase de Classificação' | 'Fase Final', date: '', time: '', location: ''
    });
    const [scoreForm, setScoreForm] = useState({ scoreA: 0, scoreB: 0 });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [adminUsers, _setAdminUsers] = useState<any[]>([]);
    const [isPromoting, _setIsPromoting] = useState(false);
    const [promoteEmail, setPromoteEmail] = useState('');

    const handlePromoteUser = () => {
        showNotification("Função para promover usuário (stub)");
    };

    const handleDemoteUser = (id: string, _role: string) => {
        showNotification(`Função para remover acesso de ${id} (stub)`);
    };

    const importCsvColumns = [
        'Primeiro Nome',
        'Sobrenome',
        'Instituição (Ex: Unisanta)',
        'Curso (Ex: Direito)',
        'Gênero (Masculino ou Feminino)',
        'Modalidades (separadas por "/")'
    ];

    const showNotification = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setNotification({ message: msg, type });
    };

    const handleSaveNewMatch = () => {
        if (!newMatchForm.teamA || !newMatchForm.teamB || !newMatchForm.sport || !newMatchForm.time || !newMatchForm.location || !newMatchForm.date) {
            showNotification('Preencha todos os campos!', 'error');
            return;
        }

        if (newMatchForm.teamA === newMatchForm.teamB) {
            showNotification('Uma equipe não pode enfrentar ela mesma!', 'error');
            return;
        }

        const [nameA, universityA] = newMatchForm.teamA.split(' - ');
        const [nameB, universityB] = newMatchForm.teamB.split(' - ');

        const newMatch: any = { // Using any to bypass deep Team type check since we just need simple mapping for now
            id: crypto.randomUUID(),
            teamA: { id: 't1', name: nameA, course: nameA, faculty: universityA },
            teamB: { id: 't2', name: nameB, course: nameB, faculty: universityB },
            scoreA: 0,
            scoreB: 0,
            sport: newMatchForm.sport,
            category: newMatchForm.category,
            stage: newMatchForm.stage,
            status: 'scheduled',
            date: newMatchForm.date,
            time: newMatchForm.time,
            location: newMatchForm.location
        };
        addMatch(newMatch);
        setIsNewMatchOpen(false);
        setNewMatchForm({ teamA: '', facultyA: '', teamB: '', facultyB: '', sport: '', category: 'Masculino', stage: 'Fase de Classificação', date: '', time: '', location: '' });
        showNotification("Partida criada com sucesso!", 'success');
    };

    const handleToggleStatus = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
            const newStatus = match.status === 'live' ? 'scheduled' : 'live';
            updateMatch({ ...match, status: newStatus });
            showNotification(`Status alterado para ${newStatus.toUpperCase()}`);
        }
    };

    const handleUpdatePlacar = () => {
        if (!selectedMatch) return;

        let newStatus = selectedMatch.status;
        if (scoreForm.scoreA > 0 || scoreForm.scoreB > 0) {
            newStatus = 'finished';
        }

        updateMatch({
            ...selectedMatch,
            scoreA: scoreForm.scoreA,
            scoreB: scoreForm.scoreB,
            status: newStatus
        });
        setIsScoreOpen(false);
        showNotification("Placar atualizado e finalizado!", 'success');
    };

    const handleDeleteMatch = (matchId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
            deleteMatch(matchId);
            showNotification("Partida excluída com sucesso!", 'success');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportStatus({ current: 0, total: 0, message: 'Lendo arquivo...', errors: [] });
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const delimiter = text.indexOf(';') !== -1 ? ';' : ',';
            
            const validCoursesLower = coursesList.map(c => {
                const [name, inst] = c.split(' - ');
                return { name: name.trim().toLowerCase(), inst: inst.trim().toLowerCase() };
            });
            const validSportsLower = AVAILABLE_SPORTS.map(s => s.toLowerCase());
            
            let successCount = 0;
            const errors: string[] = [];
            const validLinesCount = lines.length - 1; // Header ignorado
            setImportStatus({ current: 0, total: validLinesCount, message: 'Validando dados...', errors: [] });
            
            const addedAthletes = new Set<string>();

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length >= 6) {
                    const [firstName, lastName, institution, course, gender, sportsStr] = cols;
                    
                    // Validação de Curso e Instituição
                    const isCourseValid = validCoursesLower.some(vc => vc.name === course.trim().toLowerCase() && vc.inst === institution.trim().toLowerCase());
                    if (!isCourseValid) {
                        errors.push(`Linha ${i+1} (${firstName}): Curso/Inst. ou de digitação ("${course}").`);
                        setImportStatus(prev => prev ? { ...prev, current: prev.current + 1, errors } : null);
                        continue;
                    }
                    
                    // Validação de Esportes
                    const sports = sportsStr.split(/[,\/|-]/).map(s => s.trim()).filter(Boolean);
                    const invalidSports = sports.filter(s => !validSportsLower.includes(s.toLowerCase()));
                    
                    if (invalidSports.length > 0) {
                        errors.push(`Linha ${i+1} (${firstName}): Esporte inválido (${invalidSports.join(', ')}).`);
                        setImportStatus(prev => prev ? { ...prev, current: prev.current + 1, errors } : null);
                        continue;
                    }
                    
                    // Validação de Duplicata (Banco atual + planilha atual)
                    const uniqueKey = `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}|${course.trim().toLowerCase()}`;
                    const isDuplicate = athletesList.some(a => 
                        a.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() && 
                        a.lastName.trim().toLowerCase() === lastName.trim().toLowerCase() &&
                        a.course.trim().toLowerCase() === course.trim().toLowerCase()
                    );

                    if (isDuplicate || addedAthletes.has(uniqueKey)) {
                        errors.push(`Linha ${i+1} (${firstName}): Atleta já cadastrado(a) neste curso.`);
                        setImportStatus(prev => prev ? { ...prev, current: prev.current + 1, errors } : null);
                        continue;
                    }
                    addedAthletes.add(uniqueKey);
                    
                    const newAthlete = {
                        id: crypto.randomUUID(),
                        firstName,
                        lastName,
                        institution,
                        course,
                        sex: (gender.trim().toLowerCase() === 'feminino' ? 'Feminino' : 'Masculino') as ('Masculino' | 'Feminino'),
                        sports
                    };
                    
                    setImportStatus(prev => prev ? { ...prev, message: `Adicionando: ${firstName} ${lastName}...` } : null);
                    await addAthlete(newAthlete);
                    successCount++;
                    setImportStatus(prev => prev ? { ...prev, current: prev.current + 1, errors } : null);
                } else {
                    errors.push(`Linha ${i+1}: Formato inválido.`);
                    setImportStatus(prev => prev ? { ...prev, current: prev.current + 1, errors } : null);
                }
            }
            
            if (successCount > 0) {
                setImportStatus(prev => prev ? { ...prev, message: 'Concluído!' } : null);
                showNotification(`${successCount} atletas importados com sucesso!`);
            } else {
                setImportStatus(prev => prev ? { ...prev, message: 'Importação finalizada sem sucesso.' } : null);
            }
            
            if (errors.length === 0 && successCount > 0) {
                 setTimeout(() => setImportStatus(null), 2500);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleMatchFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const XLSX = await import('xlsx');
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames.includes('Cronograma') ? 'Cronograma' : workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const parsedMatches: any[] = [];
            const headers = jsonData[0] as string[] || [];
            
            for (let i = 1; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                if (!row || row.length === 0) continue; 
                
                const getCol = (colName: string) => {
                    const idx = headers.findIndex(h => h && h.toString().trim().toLowerCase() === colName.toLowerCase());
                    return idx !== -1 ? row[idx] : undefined;
                };

                const dataVal = getCol('Data') !== undefined ? getCol('Data') : row[0];
                const horaVal = getCol('Hora') !== undefined ? getCol('Hora') : row[1];
                const modalidadeVal = getCol('Modalidade') !== undefined ? getCol('Modalidade') : row[2];
                const equipeAVal = getCol('Equipe A') !== undefined ? getCol('Equipe A') : row[3];
                const equipeBVal = getCol('Equipe B') !== undefined ? getCol('Equipe B') : row[4];
                const localVal = getCol('Local') !== undefined ? getCol('Local') : row[5];
                const faseVal = getCol('Fase') !== undefined ? getCol('Fase') : row[6];

                if (!equipeAVal && !equipeBVal && !modalidadeVal) continue;

                let processedTime: string | null = null;
                if (horaVal !== undefined && horaVal !== null) {
                    if (typeof horaVal === 'number') {
                        // Safe conversion avoiding 19:60 issues
                        const totalMinutes = Math.round(horaVal * 24 * 60);
                        const horas = Math.floor(totalMinutes / 60);
                        const minutos = totalMinutes % 60;
                        processedTime = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
                    } else if (typeof horaVal === 'string') {
                        const lowHora = horaVal.toLowerCase();
                        if (lowHora.includes('seguir') || lowHora.includes('a definir')) {
                            processedTime = null;
                        } else {
                            processedTime = horaVal.trim();
                        }
                    }
                }

                let processedDate = String(dataVal || '');
                if (typeof dataVal === 'number') {
                    const parsedDateObj = XLSX.SSF.parse_date_code(dataVal);
                    processedDate = `${String(parsedDateObj.d).padStart(2, '0')}/${String(parsedDateObj.m).padStart(2, '0')}/${String(parsedDateObj.y).padStart(4, '0')}`;
                }

                const teamAAliased = normalizeTeamName(String(equipeAVal || ''));
                const teamBAliased = normalizeTeamName(String(equipeBVal || ''));

                const { sport: parsedSport, category: parsedCategory } = parseModalidade(String(modalidadeVal || ''));

                parsedMatches.push({
                    id: crypto.randomUUID(),
                    date: processedDate,
                    time: processedTime,
                    sport: parsedSport,
                    teamA: { id: crypto.randomUUID(), name: teamAAliased, course: teamAAliased, faculty: '' },
                    teamB: { id: crypto.randomUUID(), name: teamBAliased, course: teamBAliased, faculty: '' },
                    location: String(localVal || ''),
                    stage: String(faseVal || ''),
                    status: 'scheduled',
                    scoreA: 0,
                    scoreB: 0,
                    category: parsedCategory
                });
            }
            
            setPreviewMatches(parsedMatches);
        };
        
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    };

    const handleConfirmImport = async () => {
        if (previewMatches.length === 0) return;
        
        setMatchImportStatus({
            current: 0,
            total: previewMatches.length,
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            errors: []
        });

        const { data: dbCourses, error: coursesError } = await supabase.from('courses').select('id, name, university');
        
        if (coursesError || !dbCourses) {
            showNotification('Erro ao buscar lista de equipes no banco.');
            setMatchImportStatus(null);
            return;
        }

        // Helper para matching de equipe: SEMPRE exige curso + instituição juntos.
        // Sem fallback cego — se não encontrar match exato, retorna null (erro registrado).
        const findTeam = (normalizedName: string) => {
            if (!normalizedName) return null;
            const upName = normalizedName.toUpperCase().trim();
            const dashIdx = upName.indexOf(' - ');
            const coursePart = (dashIdx !== -1 ? upName.slice(0, dashIdx) : upName).trim();
            const instPart  = (dashIdx !== -1 ? upName.slice(dashIdx + 3) : '').trim();

            // --- Caso 1: temos Curso E Instituição → match obrigatório em AMBOS ---
            if (instPart) {
                // 1a. Match exato de nome completo: "Curso - Universidade"
                let found = dbCourses.find(c =>
                    `${c.name} - ${c.university}`.toUpperCase() === upName
                );
                if (found) return found;

                // 1b. Curso exato + instituição parcial (contains bidirecional)
                found = dbCourses.find(c => {
                    const cName = c.name.toUpperCase();
                    const cInst = c.university.toUpperCase();
                    return cName === coursePart && (cInst.includes(instPart) || instPart.includes(cInst));
                });
                if (found) return found;

                // 1c. Curso parcial + instituição parcial (contains bidirecional em ambos)
                found = dbCourses.find(c => {
                    const cName = c.name.toUpperCase();
                    const cInst = c.university.toUpperCase();
                    const courseMatch = cName.includes(coursePart) || coursePart.includes(cName);
                    const instMatch   = cInst.includes(instPart)   || instPart.includes(cInst);
                    return courseMatch && instMatch;
                });
                if (found) return found;

                // Instituição especificada mas não encontrou nada → ERRO, sem fallback
                return null;
            }

            // --- Caso 2: só o nome do curso, sem instituição ---
            // Aceita SOMENTE se houver exatamente 1 equipe com esse nome no banco.
            // Se houver 2+ (ex: "Direito" existe em Esamc, Unisanta, Unimes),
            // retorna null para forçar registro como erro — nunca adivinhar.
            const matchesByCourse = dbCourses.filter(c => c.name.toUpperCase() === coursePart);
            if (matchesByCourse.length === 1) return matchesByCourse[0];

            // Ambíguo (múltiplas instituições) ou não encontrado → ERRO
            return null;
        };

        for (const matchPreview of previewMatches) {
            const teamAData = findTeam(matchPreview.teamA.name);
            const teamBData = findTeam(matchPreview.teamB.name);

            if (!teamAData || !teamBData) {
                const missing: string[] = [];
                if (!teamAData) missing.push(matchPreview.teamA.name);
                if (!teamBData) missing.push(matchPreview.teamB.name);
                
                setMatchImportStatus(prev => prev ? {
                    ...prev,
                    current: prev.current + 1,
                    errorCount: prev.errorCount + 1,
                    errors: [...new Set([...prev.errors, ...missing])]
                } : null);
                continue;
            }

            const finalMatch: any = {
                ...matchPreview,
                teamA: { 
                    id: teamAData.id, 
                    name: `${teamAData.name} - ${teamAData.university}`, 
                    course: teamAData.name, 
                    faculty: teamAData.university,
                    logo: customEmblems[`${teamAData.name} - ${teamAData.university}`] || null
                },
                teamB: { 
                    id: teamBData.id, 
                    name: `${teamBData.name} - ${teamBData.university}`, 
                    course: teamBData.name, 
                    faculty: teamBData.university,
                    logo: customEmblems[`${teamBData.name} - ${teamBData.university}`] || null
                }
            };

            // Verificar se já existe partida idêntica (duplicada)
            const isDuplicate = matches.some(m => 
                m.sport === finalMatch.sport &&
                m.category === finalMatch.category &&
                m.date === finalMatch.date &&
                m.time === finalMatch.time &&
                (
                    (m.teamA.id === finalMatch.teamA.id && m.teamB.id === finalMatch.teamB.id) ||
                    (m.teamA.id === finalMatch.teamB.id && m.teamB.id === finalMatch.teamA.id)
                )
            );

            if (isDuplicate) {
                setMatchImportStatus(prev => prev ? {
                    ...prev,
                    current: prev.current + 1,
                    skippedCount: prev.skippedCount + 1
                } : null);
                continue;
            }

            await addMatch(finalMatch);
            
            setMatchImportStatus(prev => prev ? {
                ...prev,
                current: prev.current + 1,
                successCount: prev.successCount + 1
            } : null);
        }
    };

    const filteredMatches = matches.filter(match => {
        if (filter === 'all') return true;
        if (filter === 'male' && match.category === 'Masculino') return true;
        if (filter === 'female' && match.category === 'Feminino') return true;
        return false;
    });

    const pendingResults = matches.filter(m => m.scoreA === 0 && m.scoreB === 0 && m.status !== 'finished').length;

    const stats = [
        { label: 'Total Atletas', value: '1,240', icon: <Users size={20} />, color: '#3b82f6', type: 'athletes' },
        { label: 'Partidas Hoje', value: matches.filter(m => m.status === 'live').length.toString(), icon: <Trophy size={20} />, color: '#ef4444', type: 'matches' },
        { label: 'Cursos Inscritos', value: coursesList.length.toString(), icon: <BookOpen size={20} />, color: '#10b981', type: 'courses' },
        { label: 'Resultados Pendentes', value: pendingResults.toString(), icon: <PlusCircle size={20} />, color: '#f59e0b', type: 'pending' },
    ];

    const getCourseIcon = (name: string) => {
        const foundKey = Object.keys(COURSE_ICONS).find(key => name.includes(key));
        return foundKey ? COURSE_ICONS[foundKey] : '🎓';
    };

    const [leagueRequests, setLeagueRequests] = useState<any[]>([]);

    const fetchLeagueRequests = async () => {
        const { data, error } = await supabase
            .from('league_requests')
            .select(`
                *,
                leagues (
                    name
                )
            `)
            .eq('status', 'pending');
        
        if (error) console.error("Erro ao buscar solicitações:", error);
        else if (data) setLeagueRequests(data);
    };

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchLeagueRequests();
        }
    }, [activeTab]);
    const handleApproveRequest = async (request: any) => {
        try {
            const { data: league, error: lError } = await supabase
                .from('leagues')
                .select('participants')
                .eq('id', request.league_id)
                .single();
            
            if (lError) throw lError;

            // Check if user is already in 3 private leagues
            const { data: userLeagues, error: ulError } = await supabase
                .from('leagues')
                .select('id, participants, owner_email');
            
            if (ulError) throw ulError;

            const userEmail = request.user_email.toLowerCase();
            const privateLeaguesCount = userLeagues.filter(l => {
                const isOwner = l.owner_email?.toLowerCase() === userEmail;
                const isParticipant = Array.isArray(l.participants) && l.participants.some((p: string) => p.toLowerCase() === userEmail);
                return (isOwner || isParticipant);
            }).length;

            if (privateLeaguesCount >= 3) {
                showNotification(`O usuário já atingiu o limite de 3 ligas privadas.`);
                return;
            }

            let participants: string[] = [];
            if (Array.isArray(league.participants)) {
                participants = league.participants;
            } else if (typeof league.participants === 'string') {
                try {
                    participants = JSON.parse(league.participants);
                } catch {
                    participants = league.participants.split(',').map((s: string) => s.trim());
                }
            }

            if (!participants.some(p => p.toLowerCase() === request.user_email.toLowerCase())) {
                participants.push(request.user_email.toLowerCase());
            }

            const { error: uError } = await supabase
                .from('leagues')
                .update({ participants })
                .eq('id', request.league_id);
            
            if (uError) throw uError;

            const { error: rError } = await supabase
                .from('league_requests')
                .update({ status: 'approved' })
                .eq('id', request.id);
            
            if (rError) throw rError;

            showNotification("Solicitação aprovada!");
            fetchLeagueRequests();
        } catch (err) {
            console.error("Erro ao aprovar:", err);
            showNotification("Erro ao aprovar solicitação.");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('league_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);
        
        if (error) {
            console.error("Erro ao recusar:", error);
            showNotification("Erro ao recusar solicitação.");
        } else {
            showNotification("Solicitação recusada.");
            fetchLeagueRequests();
        }
    };

    const handleSaveNewCourse = () => {
        if (!newCourseForm.name || !newCourseForm.university) {
            showNotification('Preencha Nome e Faculdade!');
            return;
        }
        const fullCourseString = `${newCourseForm.name} - ${newCourseForm.university}`;
        addCourse(fullCourseString, newCourseForm.emblem || undefined);

        if (newCourseForm.emblem) {
            addCustomEmblem(fullCourseString, newCourseForm.emblem);
        }

        setIsNewCourseOpen(false);
        setNewCourseForm({ name: '', university: '', emblem: '' });
        showNotification("Curso cadastrado com sucesso!");
    };

    const handleDeleteCourse = (courseString: string) => {
        if (window.confirm(`Tem certeza que deseja remover o curso "${courseString}"? Todos os atletas vinculados a ele serão excluídos automaticamente também.`)) {
            removeCourse(courseString);
            showNotification("Curso e atletas vinculados excluídos com sucesso!");
        }
    };

    const handleSaveNewAthlete = () => {
        if (!newAthleteForm.name || !newAthleteForm.university || !newAthleteForm.course || !newAthleteForm.sport) {
            showNotification('Preencha todos os campos do atleta!');
            return;
        }
        const newAthlete = {
            id: Date.now().toString(),
            firstName: newAthleteForm.name.split(' ')[0],
            lastName: newAthleteForm.name.split(' ').slice(1).join(' ') || '',
            institution: newAthleteForm.university,
            course: newAthleteForm.course,
            sports: [newAthleteForm.sport]
        };
        addAthlete(newAthlete);
        setIsNewAthleteOpen(false);
        setNewAthleteForm({ name: '', university: '', course: '', sport: '' });
        showNotification("Atleta cadastrado com sucesso!");
    };

    const handleDeleteAthlete = (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja remover o atleta ${name}?`)) {
            removeAthlete(id);
            showNotification("Atleta excluído com sucesso!");
        }
    };

    return (
        <div className="admin-dashboard-root" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-page-title" style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', background: 'linear-gradient(135deg, #fff 0%, var(--accent-color) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Painel Super Admin
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Gerencie os Jogos Unisanta, equipes e resultados em tempo real.</p>
                </div>
                <div style={{
                    padding: '12px 20px',
                    background: 'rgba(227, 6, 19, 0.1)',
                    border: '1px solid var(--accent-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <Shield size={20} color="var(--accent-color)" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-color)' }}>SUPER ADMIN</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {stats.map(stat => (
                    <div
                        key={stat.label}
                        className="premium-card admin-stat-card"
                        style={{ 
                            padding: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = `0 12px 24px ${stat.color}30`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100px',
                            height: '100px',
                            background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`,
                            pointerEvents: 'none'
                        }} />
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: `linear-gradient(135deg, ${stat.color}25 0%, ${stat.color}10 100%)`,
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Admin Area */}
            <div className="admin-main-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '30px' }}>
                <div className="admin-tabs-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { id: 'overview', label: 'Visão Geral', icon: <Layout size={18} /> },
                        { id: 'requests', label: 'Solicitações', icon: <PlusCircle size={18} /> },
                        { id: 'teams', label: 'Equipes & Cursos', icon: <Users size={18} /> },
                        { id: 'athletes', label: 'Atletas', icon: <Users size={18} /> },
                        { id: 'equipe', label: 'Equipe', icon: <Shield size={18} /> },
                        { id: 'ranking', label: 'Classificação Geral', icon: <Trophy size={18} /> },
                        { id: 'featured', label: 'Melhores Atletas', icon: <Award size={18} /> },

                    ].map(tab => (
                        <button
                            key={tab.id}
                            className="admin-tab-button"
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent-color) 0%, #c10510 100%)' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.3s ease',
                                textAlign: 'left',
                                border: activeTab === tab.id ? 'none' : '1px solid transparent',
                                cursor: 'pointer',
                                outline: 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }
                            }}
                        >
                            {activeTab === tab.id && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '4px',
                                    background: '#fff',
                                    borderRadius: '0 4px 4px 0'
                                }} />
                            )}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                opacity: activeTab === tab.id ? 1 : 0.7
                            }}>
                                {tab.icon}
                            </div>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="admin-content-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {activeTab === 'requests' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <PlusCircle size={24} color="var(--accent-color)" />
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Solicitações de Entrada</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Gerencie quem pode participar das ligas privadas</p>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-table-wrap" style={{ padding: '0', overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>USUÁRIO</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>LIGA</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>DATA</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leagueRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                    Nenhuma solicitação pendente.
                                                </td>
                                            </tr>
                                        ) : (
                                            leagueRequests.map(request => (
                                                <tr key={request.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{request.user_name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{request.user_email}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                                                        {request.leagues?.name}
                                                    </td>
                                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                                                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleApproveRequest(request)}
                                                                style={{
                                                                    padding: '6px 16px',
                                                                    borderRadius: '6px',
                                                                    background: 'var(--accent-color)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                APROVAR
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRequest(request.id)}
                                                                style={{
                                                                    padding: '6px 16px',
                                                                    borderRadius: '6px',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    color: 'var(--text-secondary)',
                                                                    border: '1px solid var(--border-color)',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                RECUSAR
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Últimas Atividades</h2>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        style={{
                                            background: 'transparent',
                                            color: 'var(--text-secondary)',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--border-color)',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setIsImportMatchesOpen(true)}
                                        onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                                        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        <Upload size={16} />
                                        Importar Partidas
                                    </button>
                                    <button
                                        className="admin-primary-action"
                                        onClick={() => {
                                            setNewMatchForm({ teamA: '', facultyA: '', teamB: '', facultyB: '', sport: '', category: 'Masculino', stage: 'Fase de Classificação', date: '', time: '', location: '' });
                                            setIsNewMatchOpen(true);
                                        }}
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            border: 'none',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#c10510'}
                                        onMouseOut={e => e.currentTarget.style.background = 'var(--accent-color)'}
                                    >
                                        <PlusCircle size={16} />
                                        Nova Partida
                                    </button>
                                </div>
                            </div>


                            <div className="admin-filter-row" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setFilter('all')}
                                    style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === 'all' ? 'var(--accent-color)' : 'var(--bg-hover)', color: filter === 'all' ? 'white' : 'var(--text-secondary)' }}
                                >
                                    TODOS
                                </button>
                                <button
                                    onClick={() => setFilter('male')}
                                    style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === 'male' ? 'var(--accent-color)' : 'var(--bg-hover)', color: filter === 'male' ? 'white' : 'var(--text-secondary)' }}
                                >
                                    MASCULINO
                                </button>
                                <button
                                    onClick={() => setFilter('female')}
                                    style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === 'female' ? 'var(--accent-color)' : 'var(--bg-hover)', color: filter === 'female' ? 'white' : 'var(--text-secondary)' }}
                                >
                                    FEMININO
                                </button>
                            </div>

                            <div className="admin-table-wrap" style={{ padding: '0', overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>PARTIDA</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>MODALIDADE</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>STATUS</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMatches.map(match => (
                                            <tr key={match.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div className="admin-match-title" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.teamA.course} {match.scoreA} x {match.scoreB} {match.teamB.course}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{match.location.replace(/\s*\(.*?\)\s*$/, '').trim()} - {match.date ? `${match.date.split('-').reverse().join('-')} ` : ''}{match.time}</div>
                                                </td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{match.sport} {match.category}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span className="admin-status-badge" style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: match.status === 'live' ? 'rgba(227, 6, 19, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                        color: match.status === 'live' ? 'var(--accent-color)' : 'var(--text-secondary)'
                                                    }}>
                                                        {match.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="admin-actions-cell" style={{ padding: '16px 20px' }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(match.id)}
                                                        style={{ color: 'var(--accent-color)', fontWeight: 600, marginRight: '15px', background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                                        onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                                                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        Status
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMatch(match);
                                                            setScoreForm({ scoreA: match.scoreA || 0, scoreB: match.scoreB || 0 });
                                                            setIsScoreOpen(true);
                                                        }}
                                                        style={{ color: 'var(--text-secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                                        onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                                                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        Placar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMatch(match.id)}
                                                        style={{ color: 'var(--text-secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', marginLeft: '15px' }}
                                                        onMouseOver={e => e.currentTarget.style.color = 'var(--live-color)'}
                                                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {activeTab === 'teams' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Users size={24} color="var(--accent-color)" />
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Equipes & Cursos Inscritos</h2>
                                </div>
                                <button
                                    className="admin-primary-action"
                                    onClick={() => setIsNewCourseOpen(true)}
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#c10510'}
                                    onMouseOut={e => e.currentTarget.style.background = 'var(--accent-color)'}
                                >
                                    <PlusCircle size={16} />
                                    Cadastrar Novo Curso
                                </button>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {[...coursesList].sort((a, b) => a.localeCompare(b)).map((course, index) => {
                                        const [name, university] = course.split(' - ');
                                        const icon = getCourseIcon(name);
                                        const emblemUrl = customEmblems[course] || (course in COURSE_EMBLEMS ? `/emblemas/${COURSE_EMBLEMS[course]}` : null);

                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                background: 'var(--bg-hover)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                {emblemUrl ? (
                                                    <img
                                                        src={emblemUrl}
                                                        alt={name}
                                                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                        {icon}
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{university}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCourse(course)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--text-secondary)',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Excluir Curso"
                                                    onMouseOver={e => {
                                                        e.currentTarget.style.color = 'var(--accent-color)';
                                                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                        e.currentTarget.style.background = 'rgba(227, 6, 19, 0.1)';
                                                    }}
                                                    onMouseOut={e => {
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'athletes' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Users size={24} color="var(--accent-color)" />
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gerenciar Atletas</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select
                                        value={courseSearch}
                                        onChange={(e) => setCourseSearch(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-hover)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            outline: 'none',
                                            width: '200px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Todos os cursos</option>
                                        {coursesList.map((course, index) => {
                                            const [name] = course.split(' - ');
                                            return (
                                                <option key={index} value={name}>
                                                    {name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div
                                        style={{ position: 'relative' }}
                                        onMouseLeave={() => setShowImportInfo(false)}
                                    >
                                        <button
                                            title="Como importar planilha?"
                                            onMouseEnter={() => setShowImportInfo(true)}
                                            onFocus={() => setShowImportInfo(true)}
                                            onBlur={() => setShowImportInfo(false)}
                                            onTouchStart={() => setShowImportInfo(prev => !prev)}
                                            onClick={() => setShowImportInfo(prev => !prev)}
                                            style={{
                                                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                                                borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                            }}
                                        >
                                            <Info size={16} />
                                        </button>
                                        {showImportInfo && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '42px',
                                                    left: '0',
                                                    zIndex: 9999,
                                                    width: '340px',
                                                    padding: '14px 16px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #334155',
                                                    background: 'rgba(15, 23, 42, 0.98)',
                                                    boxShadow: '0 14px 30px rgba(2, 6, 23, 0.45)',
                                                    color: '#f8fafc',
                                                    fontSize: '13px',
                                                    lineHeight: 1.45
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, marginBottom: '8px' }}>
                                                    Salvar planilha Excel como .CSV
                                                </div>
                                                <div style={{ marginBottom: '6px', color: '#cbd5e1' }}>Ordem das colunas:</div>
                                                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                                                    {importCsvColumns.map((column, index) => (
                                                        <li key={index} style={{ marginBottom: '3px' }}>{column}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                    <a
                                        href="/tabela_unisanta.csv"
                                        download="tabela_unisanta.csv"
                                        style={{
                                            background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)',
                                            transition: 'all 0.2s', textDecoration: 'none'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                                        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        <Download size={16} /> Baixar planilha exemplo
                                    </a>
                                    <label style={{
                                        background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)',
                                        transition: 'all 0.2s'
                                    }} 
                                    onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }} 
                                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        <Upload size={16} /> Importar CSV
                                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    </label>
                                    <button
                                        className="admin-primary-action"
                                        onClick={() => setIsNewAthleteOpen(true)}
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            border: 'none',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#c10510'}
                                        onMouseOut={e => e.currentTarget.style.background = 'var(--accent-color)'}
                                    >
                                        <PlusCircle size={16} />
                                        Cadastrar Novo Atleta
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {athletesList.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                                        Nenhum atleta cadastrado ainda.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                        {[...athletesList]
                                            .filter(athlete => 
                                                courseSearch === '' || 
                                                athlete.course === courseSearch
                                            )
                                            .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                                            .map((athlete) => (
                                            <div key={athlete.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                padding: '16px',
                                                background: 'var(--bg-hover)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    <Users size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{athlete.firstName} {athlete.lastName}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{athlete.course} - {athlete.institution}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, marginTop: '4px' }}>{athlete.sports[0]}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAthlete(athlete.id, `${athlete.firstName} ${athlete.lastName}`)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--text-secondary)',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Excluir Atleta"
                                                    onMouseOver={e => {
                                                        e.currentTarget.style.color = 'var(--accent-color)';
                                                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                        e.currentTarget.style.background = 'rgba(227, 6, 19, 0.1)';
                                                    }}
                                                    onMouseOut={e => {
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'equipe' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Shield size={24} color="var(--accent-color)" />
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gestão da Equipe</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Gerencie quem tem permissões administrativas no sistema</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '15px', color: 'var(--text-primary)' }}>Promover Novo Administrador</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="email"
                                        placeholder="E-mail do usuário"
                                        value={promoteEmail}
                                        onChange={(e) => setPromoteEmail(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-hover)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={handlePromoteUser}
                                        disabled={isPromoting || !promoteEmail.trim()}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            background: 'var(--accent-color)',
                                            color: 'white',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            cursor: (isPromoting || !promoteEmail.trim()) ? 'not-allowed' : 'pointer',
                                            opacity: (isPromoting || !promoteEmail.trim()) ? 0.6 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isPromoting ? 'PROMOVENDO...' : 'PROMOVER'}
                                    </button>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                                    O usuário deve estar previamente cadastrado no sistema para ser promovido.
                                </p>
                            </div>

                            <div className="admin-table-wrap" style={{ padding: '0', overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>NOME</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>E-MAIL</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>CARGO</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                    {isPromoting ? 'Atualizando...' : 'Carregando equipe...'}
                                                </td>
                                            </tr>
                                        ) : (
                                            adminUsers.map(admin => (
                                                <tr key={admin.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{admin.name} {admin.surname}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                                                        {admin.email}
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            background: admin.role === 'superadmin' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(227, 6, 19, 0.1)',
                                                            color: admin.role === 'superadmin' ? '#ffd700' : 'var(--accent-color)'
                                                        }}>
                                                            {admin.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                        {admin.role !== 'superadmin' && (
                                                            <button
                                                                onClick={() => handleDemoteUser(admin.id, admin.role)}
                                                                style={{
                                                                    padding: '6px 16px',
                                                                    borderRadius: '6px',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    color: 'var(--text-secondary)',
                                                                    border: '1px solid var(--border-color)',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseOver={e => {
                                                                    e.currentTarget.style.color = 'var(--accent-color)';
                                                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                                }}
                                                                onMouseOut={e => {
                                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                }}
                                                            >
                                                                REMOVER ACESSO
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ranking' && (

                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Trophy size={24} color="var(--accent-color)" />
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Classificação Geral</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Edite os pontos para atualizar o ranking público em tempo real</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Tem certeza que deseja zerar a pontuação de todos os cursos? Esta ação é irreversível e atualizará o ranking em tempo real.")) {
                                                resetRankingPoints();
                                                showNotification("Todas as pontuações foram zeradas com sucesso!");
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            color: '#ff4444',
                                            border: '1px solid #ff4444',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Zerar Pontuação
                                    </button>
                                </div>
                            </div>

                            <div className="admin-table-wrap" style={{ padding: '0', overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                            <th style={{ padding: '14px 16px', fontWeight: 600, width: '60px' }}>POS</th>
                                            <th style={{ padding: '14px 16px', fontWeight: 600 }}>ATLÉTICA / CURSO</th>
                                            <th style={{ padding: '14px 16px', fontWeight: 600, width: '140px', textAlign: 'center' }}>PONTOS</th>
                                            <th style={{ padding: '14px 16px', fontWeight: 600, width: '100px', textAlign: 'center' }}>AÇÃO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((entry) => {
                                            const courseName = entry.course.split(' - ')[0];
                                            const institution = entry.course.split(' - ')[1];
                                            const courseIcon = getCourseIcon(courseName);
                                            const emblemUrl = customEmblems[entry.course] || (entry.course in COURSE_EMBLEMS ? `/emblemas/${COURSE_EMBLEMS[entry.course]}` : null);
                                            const isEditing = editingCourse === entry.course;
                                            const isTop3 = entry.rank <= 3;
                                            const highlightColor = entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : null;

                                            return (
                                                <tr key={entry.course} style={{
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: isTop3 ? `linear-gradient(90deg, ${highlightColor}12 0%, transparent 100%)` : 'transparent'
                                                }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '13px',
                                                            fontWeight: 800,
                                                            background: highlightColor || 'var(--bg-hover)',
                                                            color: isTop3 ? '#000' : 'var(--text-secondary)'
                                                        }}>
                                                            {ranking.findIndex(e => e.course === entry.course) + 1}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {emblemUrl ? (
                                                                <img
                                                                    src={emblemUrl}
                                                                    alt={courseName}
                                                                    style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }}
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                    {courseIcon}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{courseName}</div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{institution}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={editValue}
                                                                onChange={e => setEditValue(Math.max(0, Number(e.target.value)))}
                                                                autoFocus
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        updateRankingPoints(entry.course, editValue);
                                                                        setEditingCourse(null);
                                                                        showNotification(`Pontos de ${courseName} atualizados para ${editValue}!`);
                                                                    }
                                                                    if (e.key === 'Escape') setEditingCourse(null);
                                                                }}
                                                                style={{
                                                                    width: '80px',
                                                                    padding: '8px 10px',
                                                                    background: '#2a2a2a',
                                                                    border: '2px solid var(--accent-color)',
                                                                    borderRadius: '6px',
                                                                    color: '#fff',
                                                                    textAlign: 'center',
                                                                    fontSize: '16px',
                                                                    fontWeight: 800,
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '16px', fontWeight: 800, color: isTop3 ? (highlightColor as string) : 'var(--text-primary)' }}>
                                                                {entry.points}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        {isEditing ? (
                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        updateRankingPoints(entry.course, editValue);
                                                                        setEditingCourse(null);
                                                                        showNotification(`Pontos de ${courseName} atualizados para ${editValue}!`);
                                                                    }}
                                                                    style={{
                                                                        background: 'var(--accent-color)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 700,
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = '#c10510'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'var(--accent-color)'}
                                                                >
                                                                    <Check size={14} /> Salvar
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingCourse(null)}
                                                                    style={{
                                                                        background: 'var(--bg-hover)',
                                                                        color: 'var(--text-secondary)',
                                                                        border: '1px solid var(--border-color)',
                                                                        padding: '6px 10px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCourse(entry.course);
                                                                    setEditValue(entry.points);
                                                                }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: '1px solid var(--border-color)',
                                                                    color: 'var(--text-secondary)',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseOver={e => {
                                                                    e.currentTarget.style.color = 'var(--accent-color)';
                                                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                                    e.currentTarget.style.background = 'rgba(227, 6, 19, 0.1)';
                                                                }}
                                                                onMouseOut={e => {
                                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                    e.currentTarget.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <Edit3 size={13} /> Editar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total: {ranking.length} cursos</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clique em "Editar" para alterar os pontos</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'featured' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="admin-section-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="admin-section-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Award size={24} color="var(--accent-color)" />
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Atletas em Destaque</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Gerencie os atletas que aparecem na página de Melhores Atletas</p>
                                    </div>
                                </div>
                                <button
                                    className="admin-primary-action"
                                    onClick={() => setIsAddingFeatured(true)}
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Plus size={16} />
                                    Adicionar Melhor Atleta
                                </button>
                            </div>

                            <div className="admin-table-wrap" style={{ padding: '0', overflowX: 'auto' }}>
                                {featuredAthletes.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Nenhum atleta destaque cadastrado.
                                    </div>
                                ) : (
                                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ATLETA</th>
                                                <th style={{ padding: '14px 16px', fontWeight: 600 }}>CURSO / INSTITUIÇÃO</th>
                                                <th style={{ padding: '14px 16px', fontWeight: 600 }}>MODALIDADE</th>
                                                <th style={{ padding: '14px 16px', fontWeight: 600 }}>MOTIVO</th>
                                                <th style={{ padding: '14px 16px', fontWeight: 600, width: '100px', textAlign: 'center' }}>AÇÃO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {featuredAthletes.map((fAthlete) => (
                                                <tr key={fAthlete.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)',
                                                                fontSize: '11px', fontWeight: 800, border: '1px solid var(--accent-color)'
                                                            }}>
                                                                {fAthlete.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{fAthlete.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 600 }}>{fAthlete.course}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{fAthlete.institution}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                                                            {fAthlete.sport}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{fAthlete.reason}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => {
                                                                removeFeaturedAthlete(fAthlete.id);
                                                                showNotification("Atleta removido dos destaques!");
                                                            }}
                                                            style={{
                                                                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                                                padding: '8px', cursor: 'pointer'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.color = '#ff4444'}
                                                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}



                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {importStatus && (
                <ModalOverlay onClose={() => { if (importStatus.message === 'Concluído!' || importStatus.message.includes('sem sucesso')) setImportStatus(null); }}>
                    <h2 style={{ marginBottom: '16px' }}>Importando Atletas</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>{importStatus.message}</p>
                    
                    {importStatus.total > 0 && (
                        <div style={{ background: '#222', borderRadius: '8px', height: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ 
                                width: `${(importStatus.current / importStatus.total) * 100}%`, 
                                background: 'var(--accent-color)', 
                                height: '100%', 
                                transition: 'width 0.3s ease' 
                            }}></div>
                        </div>
                    )}
                    
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        Processados: {importStatus.current} de {importStatus.total}
                    </div>

                    {importStatus.errors.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(255,68,68,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.2)' }}>
                            <p style={{ color: '#ff4444', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>Inconsistências Encontradas:</p>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ff4444', fontSize: '12px' }}>
                                {importStatus.errors.map((err, idx) => (
                                    <li key={idx} style={{ marginBottom: '4px' }}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {(importStatus.message === 'Concluído!' || importStatus.message.includes('sem sucesso')) && (
                        <button onClick={() => setImportStatus(null)} style={{ ...modalButtonStyle, marginTop: '20px', width: '100%' }}>Fechar</button>
                    )}
                </ModalOverlay>
            )}

            {/* Modals */}
            {selectedStat && (
                <ModalOverlay onClose={() => setSelectedStat(null)}>
                    <h2 style={{ marginBottom: '16px' }}>{selectedStat.label}</h2>

                    {selectedStat.type === 'courses' ? (
                        <>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Lista oficial de faculdades participantes.</p>
                            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                                {coursesList.map((course, i) => {
                                    const [name, university] = course.split(' - ');
                                    return (
                                        <div key={i} style={{ padding: '12px 0', borderBottom: i < coursesList.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                                    {getCourseIcon(name)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{name}</span>
                                            </div>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{university}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Lista de dados desta categoria.</p>
                            <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '16px' }}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                                        <span>Registro #{i + 1}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>Detalhes...</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    <button onClick={() => setSelectedStat(null)} style={{ ...modalButtonStyle, marginTop: '20px', width: '100%' }}>Fechar</button>
                </ModalOverlay>
            )}

            {isNewMatchOpen && (
                <ModalOverlay onClose={() => setIsNewMatchOpen(false)}>
                    <h2 style={{ marginBottom: '16px' }}>Nova Partida</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Equipe A */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Equipe A *</label>
                            <select 
                                style={inputStyle} 
                                value={newMatchForm.teamA} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setNewMatchForm(prev => ({
                                        ...prev,
                                        teamA: val,
                                        teamB: prev.teamB === val ? '' : prev.teamB,
                                    }));
                                }}
                            >
                                <option value="">Selecione a Equipe A</option>
                                {[...coursesList].sort().map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 800, margin: '10px 0', fontSize: '14px' }}>X</div>

                        {/* Equipe B */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Equipe B *</label>
                            <select 
                                style={inputStyle} 
                                value={newMatchForm.teamB} 
                                onChange={e => setNewMatchForm(prev => ({ ...prev, teamB: e.target.value }))}
                            >
                                <option value="">Selecione a Equipe B</option>
                                {[...coursesList].sort().filter(course => course !== newMatchForm.teamA).map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <select style={inputStyle} value={newMatchForm.stage} onChange={e => setNewMatchForm({ ...newMatchForm, stage: e.target.value as 'Fase de Classificação' | 'Fase Final' })}>
                                <option value="Fase de Classificação">Fase de Classificação</option>
                                <option value="Fase Final">Fase Final</option>
                            </select>
                            <select style={inputStyle} value={newMatchForm.category} onChange={e => setNewMatchForm({ ...newMatchForm, category: e.target.value as 'Masculino' | 'Feminino' })}>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                        <select style={inputStyle} value={newMatchForm.sport} onChange={e => setNewMatchForm({ ...newMatchForm, sport: e.target.value })}>
                            <option value="">Selecione a Modalidade</option>
                            {AVAILABLE_SPORTS.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                        <div className="admin-form-two-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="date" style={inputStyle} value={newMatchForm.date} onChange={e => setNewMatchForm({ ...newMatchForm, date: e.target.value })} />
                            <input type="time" style={inputStyle} value={newMatchForm.time} onChange={e => setNewMatchForm({ ...newMatchForm, time: e.target.value })} />
                        </div>
                        <select style={inputStyle} value={newMatchForm.location} onChange={e => setNewMatchForm({ ...newMatchForm, location: e.target.value })}>
                            <option value="">Selecione o Local</option>
                            <option value="Arena Unisanta">Arena Unisanta</option>
                            <option value="Bloco A">Bloco A</option>
                            <option value="Centro de Treinamento">Centro de Treinamento</option>
                            <option value="Clube dos Ingleses">Clube dos Ingleses</option>
                            <option value="Laerte Gonçalves (Bloco D)">Laerte Gonçalves (Bloco D)</option>
                            <option value="Piscina Olímpica">Piscina Olímpica</option>
                            <option value="Poliesportivo Unisanta (Bloco M)">Poliesportivo Unisanta (Bloco M)</option>
                            <option value="Rebouças">Rebouças</option>
                        </select>

                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={handleSaveNewMatch} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Partida</button>
                            <button onClick={() => setIsNewMatchOpen(false)} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isImportMatchesOpen && (
                <ModalOverlay onClose={() => { 
                    setIsImportMatchesOpen(false); 
                    setPreviewMatches([]); 
                    setMatchImportStatus(null);
                }}>
                    <h2 style={{ marginBottom: '16px' }}>Importar Partidas via Excel</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {matchImportStatus ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                                {/* Progress View */}
                                {matchImportStatus.current < matchImportStatus.total ? (
                                    <>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                                Importando Partidas...
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                Processando {matchImportStatus.current} de {matchImportStatus.total}
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar Container */}
                                        <div style={{ 
                                            width: '100%', 
                                            height: '10px', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            borderRadius: '5px', 
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ 
                                                width: `${(matchImportStatus.current / (matchImportStatus.total || 1)) * 100}%`, 
                                                height: '100%', 
                                                background: 'var(--accent-color)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                            Por favor, não feche esta janela...
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Summary View */}
                                        <div style={{ textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', background: '#22c55e', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
                                            }}>
                                                <Check size={24} color="white" />
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Importação Concluída!</div>
                                            <div style={{ fontSize: '15px', color: '#22c55e', fontWeight: 600, marginTop: '4px' }}>
                                                {matchImportStatus.successCount} partidas criadas com sucesso
                                            </div>
                                            {matchImportStatus.errorCount > 0 && (
                                                <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                                                    {matchImportStatus.errorCount} partidas ignoradas (equipes não encontradas)
                                                </div>
                                            )}
                                            {matchImportStatus.skippedCount > 0 && (
                                                <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>
                                                    {matchImportStatus.skippedCount} partidas já existiam e foram puladas
                                                </div>
                                            )}
                                        </div>

                                        {matchImportStatus.errors.length > 0 && (
                                            <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'rgba(239, 68, 68, 0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Info size={14} /> Equipes não localizadas no banco:
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {matchImportStatus.errors.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="admin-modal-actions">
                                            <button 
                                                onClick={() => {
                                                    setIsImportMatchesOpen(false);
                                                    setPreviewMatches([]);
                                                    setMatchImportStatus(null);
                                                }} 
                                                style={{ ...modalButtonStyle, width: '100%', background: 'var(--accent-color)' }}
                                            >
                                                Concluir e Fechar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : previewMatches.length === 0 ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <Info size={24} color="var(--accent-color)" style={{ minWidth: '24px' }} />
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Como importar a planilha?</div>
                                        Envie um arquivo <strong>.xlsx</strong> contendo as partidas. Certifique-se de que a planilha segue o formato oficial.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <a
                                        href="/tabela_exemplo.xlsx"
                                        download="tabela_exemplo.xlsx"
                                        style={{
                                            background: 'transparent', color: 'var(--text-secondary)', padding: '12px 16px', borderRadius: '6px', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--border-color)',
                                            transition: 'all 0.2s', textDecoration: 'none'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Download size={16} /> Baixar planilha exemplo
                                    </a>

                                    <label style={{
                                        background: 'transparent', color: 'var(--text-secondary)', padding: '12px 16px', borderRadius: '6px', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--border-color)',
                                        transition: 'all 0.2s'
                                    }} 
                                    onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-color)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }} 
                                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        <Upload size={16} /> Importar arquivo .xlsx
                                        <input type="file" accept=".xlsx" onChange={handleMatchFileUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>

                                <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <button onClick={() => setIsImportMatchesOpen(false)} style={{ ...modalButtonStyle, width: '100%' }}>Cancelar</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {previewMatches.length} partidas encontradas:
                                </div>
                                <div style={{ 
                                    overflowY: 'auto', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: '12px', 
                                    border: '1px solid var(--border-color)', 
                                    padding: '15px', 
                                    maxHeight: '50vh' 
                                }}>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                                        gap: '15px' 
                                    }}>
                                        {previewMatches.map((m, idx) => {
                                            // Fuzzy emblem lookup: exact key first, then partial match
                                            const resolveEmblem = (teamName: string) => {
                                                const custom = customEmblems[teamName];
                                                if (custom) return custom;
                                                if (teamName in COURSE_EMBLEMS) return `/emblemas/${COURSE_EMBLEMS[teamName]}`;
                                                const nameUpper = teamName.toUpperCase();
                                                const fuzzyKey = Object.keys(COURSE_EMBLEMS).find(k => {
                                                    const ku = k.toUpperCase();
                                                    return ku === nameUpper || nameUpper.includes(ku) || ku.includes(nameUpper);
                                                });
                                                return fuzzyKey ? `/emblemas/${COURSE_EMBLEMS[fuzzyKey]}` : null;
                                            };
                                            const emblemA = resolveEmblem(m.teamA.name);
                                            const emblemB = resolveEmblem(m.teamB.name);
                                            
                                            return (
                                                <div key={m.id || idx} className="premium-card" style={{ 
                                                    padding: '15px', 
                                                    position: 'relative',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px'
                                                }}>
                                                    {/* Header: Sport Name centered and Trash Icon */}
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 800, 
                                                            color: 'var(--accent-color)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '1px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {m.sport} {m.category}
                                                        </div>
                                                        <button 
                                                            onClick={() => removePreviewMatch(m.id)}
                                                            style={{ 
                                                                position: 'absolute',
                                                                right: '-5px',
                                                                top: '-5px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                padding: '5px',
                                                                transition: 'color 0.2s'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Teams and VS */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', padding: '5px 0' }}>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                                                            {emblemA ? (
                                                                <img src={emblemA} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                                                            ) : (
                                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>?</div>
                                                            )}
                                                            <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.2 }}>{m.teamA.name.split(' - ')[0]}</div>
                                                        </div>

                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 900, 
                                                            color: 'var(--text-secondary)',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)'
                                                        }}>VS</div>

                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                                                            {emblemB ? (
                                                                <img src={emblemB} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                                                            ) : (
                                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>?</div>
                                                            )}
                                                            <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.2 }}>{m.teamB.name.split(' - ')[0]}</div>
                                                        </div>
                                                    </div>

                                                    {/* Footer info */}
                                                    <div style={{ 
                                                        marginTop: 'auto', 
                                                        paddingTop: '10px', 
                                                        borderTop: '1px solid var(--border-color)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '10px',
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: 600
                                                    }}>
                                                        <span>{m.date}</span>
                                                        <span style={{ color: 'var(--accent-color)' }}>{m.time ? m.time : 'A definir'}</span>
                                                        <span>{m.location || '—'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={handleConfirmImport} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>
                                        Confirmar e Criar Partidas
                                    </button>
                                    <button onClick={() => setPreviewMatches([])} style={modalButtonStyle}>
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {isNewCourseOpen && (
                <ModalOverlay onClose={() => setIsNewCourseOpen(false)}>
                    <h2 style={{ marginBottom: '16px' }}>Cadastrar Novo Curso</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nome do Curso (Ex: Arquitetura)</label>
                            <input type="text" placeholder="Engenharia de Produção" style={inputStyle} value={newCourseForm.name} onChange={e => setNewCourseForm({ ...newCourseForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Faculdade ou Instituição (Ex: Unisanta)</label>
                            <input type="text" placeholder="Unip" style={inputStyle} value={newCourseForm.university} onChange={e => setNewCourseForm({ ...newCourseForm, university: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Emblema Oficial</label>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ ...inputStyle, padding: '8px', color: 'var(--text-secondary)' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setNewCourseForm({ ...newCourseForm, emblem: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            {newCourseForm.emblem && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-color)' }}>✓ Imagem carregada com sucesso</div>}
                        </div>

                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={handleSaveNewCourse} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Cadastro</button>
                            <button onClick={() => setIsNewCourseOpen(false)} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isNewAthleteOpen && (
                <ModalOverlay onClose={() => { setIsNewAthleteOpen(false); setAthleteFacultyFilter(''); }}>
                    <h2 style={{ marginBottom: '16px' }}>Cadastrar Novo Atleta</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nome Completo *</label>
                            <input type="text" placeholder="Ex: João da Silva" style={inputStyle} value={newAthleteForm.name} onChange={e => setNewAthleteForm({ ...newAthleteForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Faculdade *</label>
                            <select
                                style={inputStyle}
                                value={athleteFacultyFilter}
                                onChange={e => {
                                    setAthleteFacultyFilter(e.target.value);
                                    setNewAthleteForm({ ...newAthleteForm, university: e.target.value, course: '' });
                                }}
                            >
                                <option value="">Selecione a Faculdade...</option>
                                {uniqueFaculties.map(fac => (
                                    <option key={fac} value={fac}>{fac}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Curso *</label>
                            <select
                                style={inputStyle}
                                value={newAthleteForm.course}
                                onChange={e => setNewAthleteForm({ ...newAthleteForm, course: e.target.value })}
                                disabled={!athleteFacultyFilter}
                            >
                                <option value="">{athleteFacultyFilter ? 'Selecione o Curso...' : 'Selecione a Faculdade primeiro'}</option>
                                {coursesForFaculty(athleteFacultyFilter).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Modalidade Principal *</label>
                            <select style={inputStyle} value={newAthleteForm.sport} onChange={e => setNewAthleteForm({ ...newAthleteForm, sport: e.target.value })}>
                                <option value="">Selecione a Modalidade...</option>
                                <option value="Futsal">Futsal</option>
                                <option value="Futebol Society">Futebol Society</option>
                                <option value="Handebol">Handebol</option>
                                <option value="Vôlei">Vôlei</option>
                                <option value="Natação">Natação</option>
                                <option value="Tênis de Mesa">Tênis de Mesa</option>
                                <option value="Futevôlei">Futevôlei</option>
                                <option value="Beach Tennis">Beach Tennis</option>
                                <option value="Vôlei de Praia">Vôlei de Praia</option>
                                <option value="Basquete 3x3">Basquete 3x3</option>
                            </select>
                        </div>

                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={handleSaveNewAthlete} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Atleta</button>
                            <button onClick={() => { setIsNewAthleteOpen(false); setAthleteFacultyFilter(''); }} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isAddingFeatured && (
                <ModalOverlay onClose={() => { setIsAddingFeatured(false); setFeaturedFacultyFilter(''); }}>
                    <h2 style={{ marginBottom: '16px' }}>Adicionar Melhor Atleta</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Faculdade *</label>
                            <select
                                style={inputStyle}
                                value={featuredFacultyFilter}
                                onChange={e => {
                                    setFeaturedFacultyFilter(e.target.value);
                                    setNewFeatured({ ...newFeatured, institution: e.target.value, course: '' });
                                }}
                            >
                                <option value="">Selecione a Faculdade...</option>
                                {uniqueFaculties.map(fac => (
                                    <option key={fac} value={fac}>{fac}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Curso *</label>
                            <select
                                style={inputStyle}
                                value={newFeatured.course}
                                onChange={e => setNewFeatured({ ...newFeatured, course: e.target.value, gender: '', sport: '', name: '' })}
                                disabled={!featuredFacultyFilter}
                            >
                                <option value="">{featuredFacultyFilter ? 'Selecione o Curso...' : 'Selecione a Faculdade primeiro'}</option>
                                {coursesForFaculty(featuredFacultyFilter).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Gênero *</label>
                            <select
                                style={inputStyle}
                                value={newFeatured.gender}
                                onChange={e => setNewFeatured({ ...newFeatured, gender: e.target.value, sport: '', name: '' })}
                                disabled={!newFeatured.course}
                            >
                                <option value="">Selecione o gênero...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Modalidade *</label>
                            <select
                                style={inputStyle}
                                value={newFeatured.sport}
                                onChange={e => setNewFeatured({ ...newFeatured, sport: e.target.value, name: '' })}
                                disabled={!newFeatured.gender}
                            >
                                <option value="">Selecione a modalidade...</option>
                                {AVAILABLE_SPORTS.map(sport => (
                                    <option key={sport} value={sport}>{sport}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Atleta *</label>
                            <select
                                style={inputStyle}
                                value={newFeatured.name}
                                onChange={e => setNewFeatured({ ...newFeatured, name: e.target.value })}
                                disabled={!newFeatured.sport}
                            >
                                <option value="">Selecione o atleta...</option>
                                {athletesList
                                    .filter(a => a.institution === newFeatured.institution && a.course === newFeatured.course && a.sex === newFeatured.gender && a.sports.includes(newFeatured.sport))
                                    .sort((a, b) => a.firstName.localeCompare(b.firstName))
                                    .map(a => (
                                        <option key={a.id} value={`${a.firstName} ${a.lastName}`}>{a.firstName} {a.lastName}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Motivo do Destaque *</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={newFeatured.reason}
                                onChange={e => setNewFeatured({ ...newFeatured, reason: e.target.value })}
                            />
                        </div>

                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button
                                onClick={() => {
                                    if (!newFeatured.name || !newFeatured.course || !newFeatured.institution || !newFeatured.sport || !newFeatured.reason) {
                                        showNotification('Preencha todos os campos obrigatórios!');
                                        return;
                                    }
                                    addFeaturedAthlete({
                                        id: Date.now().toString(),
                                        name: newFeatured.name,
                                        institution: newFeatured.institution,
                                        course: newFeatured.course,
                                        sport: newFeatured.sport,
                                        reason: newFeatured.reason
                                    });
                                    setIsAddingFeatured(false);
                                    setFeaturedFacultyFilter('');
                                    setNewFeatured({ athleteId: '', name: '', institution: '', course: '', sport: '', reason: '', gender: '' });
                                    showNotification('Atleta destaque salvo com sucesso!');
                                }}
                                style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}
                            >
                                Salvar Atleta
                            </button>
                            <button onClick={() => { setIsAddingFeatured(false); setFeaturedFacultyFilter(''); }} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isScoreOpen && selectedMatch && (
                <ModalOverlay onClose={() => setIsScoreOpen(false)}>
                    <h2 style={{ marginBottom: '8px' }}>Atualizar Placar</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '13px' }}>{selectedMatch.timeA} vs {selectedMatch.timeB}</p>

                    <div className="admin-score-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', background: 'var(--bg-hover)', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{selectedMatch.timeA}</div>
                            <input type="number" value={scoreForm.scoreA} onChange={e => setScoreForm({ ...scoreForm, scoreA: Number(e.target.value) })} style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', padding: '10px' }} />
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-secondary)' }}>X</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{selectedMatch.timeB}</div>
                            <input type="number" value={scoreForm.scoreB} onChange={e => setScoreForm({ ...scoreForm, scoreB: Number(e.target.value) })} style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', padding: '10px' }} />
                        </div>
                    </div>

                    <div className="admin-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={handleUpdatePlacar} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Placar</button>
                        <button onClick={() => setIsScoreOpen(false)} style={modalButtonStyle}>Cancelar</button>
                    </div>
                </ModalOverlay>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const ModalOverlay: React.FC<{ children: React.ReactNode, onClose: () => void }> = ({ children, onClose }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(5px)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
        <div className="premium-card modal-content-wide" style={{ padding: '30px', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 3001 }}>
            {children}
        </div>
    </div>
);

const inputStyle = {
    background: '#2a2a2a',
    border: '1px solid #333',
    padding: '12px',
    borderRadius: '6px',
    color: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const
};

const modalButtonStyle = {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--bg-hover)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer'
};

export default AdminDashboard;
