import React, { useState } from 'react';
import {
    Users,
    Settings,
    PlusCircle,
    Trophy,
    BookOpen,
    Clock,
    Layout,
    MapPin,
    Calendar,
    Save,
    Trash2
} from 'lucide-react';
import { COURSE_EMBLEMS, COURSE_ICONS, AVAILABLE_SPORTS } from '../../data/mockData';
import { useData } from '../context/DataContext';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Matches Filter
    const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

    // Modal & Feedback States
    const [selectedStat, setSelectedStat] = useState<any>(null);
    const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
    const [isNewAthleteOpen, setIsNewAthleteOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    // DataContext
    const { courses: coursesList, addCourse, removeCourse, athletes: athletesList, addAthlete, removeAthlete, customEmblems, addCustomEmblem, matches, addMatch, updateMatch, deleteMatch } = useData();

    // Form and Data States
    const [newCourseForm, setNewCourseForm] = useState({ name: '', university: '', emblem: '' });
    const [newAthleteForm, setNewAthleteForm] = useState({ name: '', university: '', course: '', sport: '' });

    // Form States
    const [newMatchForm, setNewMatchForm] = useState({
        teamA: '', facultyA: '', teamB: '', facultyB: '', sport: '', category: 'Masculino' as 'Masculino' | 'Feminino', date: '', time: '', location: ''
    });
    const [scoreForm, setScoreForm] = useState({ scoreA: 0, scoreB: 0 });
    const [settingsForm, setSettingsForm] = useState({
        regulationUrl: 'https://jogos.unisanta.br/regulamento.pdf',
        liveStreamUrl: 'https://youtube.com/santaceciliatv'
    });

    const [notification, setNotification] = useState('');

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleSaveNewMatch = () => {
        if (!newMatchForm.teamA || !newMatchForm.teamB || !newMatchForm.sport || !newMatchForm.time || !newMatchForm.location || !newMatchForm.date) {
            showNotification('Preencha todos os campos!');
            return;
        }
        const newMatch: any = { // Using any to bypass deep Team type check since we just need simple mapping for now
            id: 'm' + Date.now(),
            teamA: { id: 't1', name: newMatchForm.teamA, course: newMatchForm.teamA, faculty: newMatchForm.facultyA },
            teamB: { id: 't2', name: newMatchForm.teamB, course: newMatchForm.teamB, faculty: newMatchForm.facultyB },
            scoreA: 0,
            scoreB: 0,
            sport: newMatchForm.sport,
            category: newMatchForm.category,
            status: 'scheduled',
            date: newMatchForm.date,
            time: newMatchForm.time,
            location: newMatchForm.location
        };
        addMatch(newMatch);
        setIsNewMatchOpen(false);
        setNewMatchForm({ teamA: '', facultyA: '', teamB: '', facultyB: '', sport: '', category: 'Masculino', date: '', time: '', location: '' });
        showNotification("Partida criada com sucesso!");
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
        showNotification("Placar atualizado e finalizado!");
    };

    const handleDeleteMatch = (matchId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
            deleteMatch(matchId);
            showNotification("Partida excluída com sucesso!");
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

    const handleSaveNewCourse = () => {
        if (!newCourseForm.name || !newCourseForm.university) {
            showNotification('Preencha Nome e Faculdade!');
            return;
        }
        const fullCourseString = `${newCourseForm.name} - ${newCourseForm.university}`;
        addCourse(fullCourseString);

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
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Painel de Controle Super Admin</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie os Jogos Unisanta, equipes e resultados.</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {stats.map(stat => (
                    <div
                        key={stat.label}
                        className="premium-card"
                        onClick={() => setSelectedStat(stat)}
                        style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `${stat.color}20`,
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                            <div style={{ fontSize: '24px', fontWeight: 800 }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Admin Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { id: 'overview', label: 'Visão Geral', icon: <Layout size={18} /> },
                        { id: 'matches', label: 'Gerenciar Partidas', icon: <Clock size={18} /> },
                        { id: 'teams', label: 'Equipes & Cursos', icon: <Users size={18} /> },
                        { id: 'athletes', label: 'Atletas', icon: <Users size={18} /> },
                        { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                background: activeTab === tab.id ? 'var(--accent-color)' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                                border: 'none',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {activeTab === 'overview' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Últimas Atividades</h2>
                                <button
                                    onClick={() => setIsNewMatchOpen(true)}
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

                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
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

                            <div style={{ padding: '0', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
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
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.teamA.course} {match.scoreA} x {match.scoreB} {match.teamB.course}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{match.location} - {match.date ? `${match.date} ` : ''}{match.time}</div>
                                                </td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{match.sport} {match.category}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{
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
                                                <td style={{ padding: '16px 20px' }}>
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

                    {activeTab === 'matches' && (
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Clock size={24} color="var(--accent-color)" />
                                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gerenciar Todas as Partidas</h2>
                            </div>
                            <div style={{ padding: '0', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>PARTIDA</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>MODALIDADE</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>AÇÕES (AGENDAMENTO)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matches.map(match => (
                                            <tr key={match.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{match.teamA.course} x {match.teamB.course}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{match.location} - {match.date ? `${match.date} ` : ''}{match.time}</div>
                                                </td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{match.sport} {match.category}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <button
                                                        onClick={() => showNotification("Editar Horário em desenvolvimento...")}
                                                        style={{ color: 'var(--text-primary)', fontWeight: 600, marginRight: '15px', background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <Calendar size={14} /> Horário
                                                    </button>
                                                    <button
                                                        onClick={() => showNotification("Definir Local em desenvolvimento...")}
                                                        style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <MapPin size={14} /> Local
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
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Users size={24} color="var(--accent-color)" />
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Equipes & Cursos Inscritos</h2>
                                </div>
                                <button
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
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Users size={24} color="var(--accent-color)" />
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gerenciar Atletas</h2>
                                </div>
                                <button
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

                            <div style={{ padding: '20px' }}>
                                {athletesList.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                                        Nenhum atleta cadastrado ainda.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                        {[...athletesList].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)).map((athlete) => (
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

                    {activeTab === 'settings' && (
                        <div className="premium-card" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                                <Settings size={24} color="var(--accent-color)" />
                                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Configurações do Sistema</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        Link do Regulamento Geral (PDF)
                                    </label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={settingsForm.regulationUrl}
                                        onChange={e => setSettingsForm({ ...settingsForm, regulationUrl: e.target.value })}
                                        placeholder="Ex: https://dominio.com/regulamento.pdf"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        Link da Transmissão (Padrão)
                                    </label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={settingsForm.liveStreamUrl}
                                        onChange={e => setSettingsForm({ ...settingsForm, liveStreamUrl: e.target.value })}
                                        placeholder="Ex: https://youtube.com/..."
                                    />
                                </div>
                                <button
                                    onClick={() => showNotification('Configurações salvas!')}
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        alignSelf: 'flex-start',
                                        marginTop: '10px'
                                    }}
                                >
                                    <Save size={18} />
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#0bb34c',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    {notification}
                </div>
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
                            <input type="text" placeholder="Equipe A (Ex: Engenharia)" style={inputStyle} value={newMatchForm.teamA} onChange={e => setNewMatchForm({ ...newMatchForm, teamA: e.target.value })} />

                            <select style={{ ...inputStyle, marginTop: '8px' }} value={newMatchForm.facultyA} onChange={e => setNewMatchForm({ ...newMatchForm, facultyA: e.target.value })}>
                                <option value="" disabled>Selecione a Faculdade (Opcional)</option>
                                <option value="Unisanta">Unisanta</option>
                                <option value="Unimes">Unimes</option>
                                <option value="Unip">Unip</option>
                                <option value="Unaerp">Unaerp</option>
                                <option value="Unisantos">Unisantos</option>
                                <option value="Esamc">Esamc</option>
                                <option value="Federal de Cubatão">Federal de Cubatão</option>
                                <option value="São Judas">São Judas</option>
                                <option value="Unifesp">Unifesp</option>
                                <option value="Unilus">Unilus</option>
                                <option value="Unoeste">Unoeste</option>
                                <option value="Strong">Strong</option>
                                <option value="FPG">FPG</option>
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 800, margin: '10px 0', fontSize: '14px' }}>X</div>

                        {/* Equipe B */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Equipe B *</label>
                            <input type="text" placeholder="Equipe B (Ex: Fefesp)" style={inputStyle} value={newMatchForm.teamB} onChange={e => setNewMatchForm({ ...newMatchForm, teamB: e.target.value })} />

                            <select style={{ ...inputStyle, marginTop: '8px' }} value={newMatchForm.facultyB} onChange={e => setNewMatchForm({ ...newMatchForm, facultyB: e.target.value })}>
                                <option value="" disabled>Selecione a Faculdade (Opcional)</option>
                                <option value="Unisanta">Unisanta</option>
                                <option value="Unimes">Unimes</option>
                                <option value="Unip">Unip</option>
                                <option value="Unaerp">Unaerp</option>
                                <option value="Unisantos">Unisantos</option>
                                <option value="Esamc">Esamc</option>
                                <option value="Federal de Cubatão">Federal de Cubatão</option>
                                <option value="São Judas">São Judas</option>
                                <option value="Unifesp">Unifesp</option>
                                <option value="Unilus">Unilus</option>
                                <option value="Unoeste">Unoeste</option>
                                <option value="Strong">Strong</option>
                                <option value="FPG">FPG</option>
                            </select>
                        </div>
                        <select style={inputStyle} value={newMatchForm.sport} onChange={e => setNewMatchForm({ ...newMatchForm, sport: e.target.value })}>
                            <option value="">Selecione a Modalidade</option>
                            {AVAILABLE_SPORTS.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                        <select style={inputStyle} value={newMatchForm.category} onChange={e => setNewMatchForm({ ...newMatchForm, category: e.target.value as 'Masculino' | 'Feminino' })}>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="date" style={inputStyle} value={newMatchForm.date} onChange={e => setNewMatchForm({ ...newMatchForm, date: e.target.value })} />
                            <input type="time" style={inputStyle} value={newMatchForm.time} onChange={e => setNewMatchForm({ ...newMatchForm, time: e.target.value })} />
                        </div>
                        <select style={inputStyle} value={newMatchForm.location} onChange={e => setNewMatchForm({ ...newMatchForm, location: e.target.value })}>
                            <option value="">Selecione o Local</option>
                            <option value="Centro de Treinamento">Centro de Treinamento</option>
                            <option value="Poliesportivo Unisanta (Bloco M)">Poliesportivo Unisanta (Bloco M)</option>
                            <option value="Laerte Gonçalves (Bloco D)">Laerte Gonçalves (Bloco D)</option>
                            <option value="Clube dos Ingleses">Clube dos Ingleses</option>
                            <option value="Arena Unisanta">Arena Unisanta</option>
                            <option value="Rebouças">Rebouças</option>
                            <option value="Piscina Olímpica">Piscina Olímpica</option>
                            <option value="Bloco A">Bloco A</option>
                        </select>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={handleSaveNewMatch} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Partida</button>
                            <button onClick={() => setIsNewMatchOpen(false)} style={modalButtonStyle}>Cancelar</button>
                        </div>
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

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={handleSaveNewCourse} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Cadastro</button>
                            <button onClick={() => setIsNewCourseOpen(false)} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isNewAthleteOpen && (
                <ModalOverlay onClose={() => setIsNewAthleteOpen(false)}>
                    <h2 style={{ marginBottom: '16px' }}>Cadastrar Novo Atleta</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nome Completo</label>
                            <input type="text" placeholder="Ex: João da Silva" style={inputStyle} value={newAthleteForm.name} onChange={e => setNewAthleteForm({ ...newAthleteForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Faculdade (Ex: Unisanta)</label>
                            <input type="text" placeholder="Ex: Unisanta" style={inputStyle} value={newAthleteForm.university} onChange={e => setNewAthleteForm({ ...newAthleteForm, university: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Curso (Ex: Engenharia)</label>
                            <input type="text" placeholder="Ex: Engenharia de Produção" style={inputStyle} value={newAthleteForm.course} onChange={e => setNewAthleteForm({ ...newAthleteForm, course: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Modalidade Principal</label>
                            <select style={inputStyle} value={newAthleteForm.sport} onChange={e => setNewAthleteForm({ ...newAthleteForm, sport: e.target.value })}>
                                <option value="">Selecione a Modalidade...</option>
                                <option value="Futsal">Futsal</option>
                                <option value="Futebol Society">Futebol Society</option>
                                <option value="Handebol">Handebol</option>
                                <option value="Vôlei">Vôlei</option>
                                <option value="Natação">Natação</option>
                                <option value="Karatê">Karatê</option>
                                <option value="Judô">Judô</option>
                                <option value="Tamboréu">Tamboréu</option>
                                <option value="Xadrez">Xadrez</option>
                                <option value="Tênis de Mesa">Tênis de Mesa</option>
                                <option value="Futevôlei">Futevôlei</option>
                                <option value="Beach Tennis">Beach Tennis</option>
                                <option value="Vôlei de Praia">Vôlei de Praia</option>
                                <option value="Basquete 3x3">Basquete 3x3</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={handleSaveNewAthlete} style={{ ...modalButtonStyle, background: 'var(--accent-color)' }}>Salvar Atleta</button>
                            <button onClick={() => setIsNewAthleteOpen(false)} style={modalButtonStyle}>Cancelar</button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isScoreOpen && selectedMatch && (
                <ModalOverlay onClose={() => setIsScoreOpen(false)}>
                    <h2 style={{ marginBottom: '8px' }}>Atualizar Placar</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '13px' }}>{selectedMatch.timeA} vs {selectedMatch.timeB}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', background: 'var(--bg-hover)', padding: '20px', borderRadius: '8px' }}>
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

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
        <div className="premium-card" style={{ padding: '30px', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 3001 }}>
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
