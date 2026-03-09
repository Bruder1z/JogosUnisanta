import { type FC, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import ModalDetalhes from '../components/Modals/ModalDetalhes';
import {
    COURSE_ICONS,
    COURSE_EMBLEMS,
    AVAILABLE_SPORTS,
} from '../data/mockData';
import { useData } from '../components/context/DataContext';
import {
    School,
    Search,
    X
} from 'lucide-react';

const Participants: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'courses' | 'athletes'>('courses');

    // Selected Course Details
    const [selectedCourseDetails, setSelectedCourseDetails] = useState<{
        name: string;
        university: string;
        icon: React.ReactNode;
        emblemUrl: string | null;
    } | null>(null);

    // Athlete Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState('Todos');
    const [selectedCourse, setSelectedCourse] = useState('Todos');
    const [selectedInstitution, setSelectedInstitution] = useState('Todas');

    // Context Data
    const { courses, athletes, customEmblems } = useData();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'athletes') {
            setActiveTab('athletes');
        } else {
            setActiveTab('courses');
        }
    }, [searchParams]);

    const getCourseIcon = (name: string) => {
        const foundKey = Object.keys(COURSE_ICONS).find(key => name.includes(key));
        return foundKey ? COURSE_ICONS[foundKey] : '🎓';
    };

    const filteredAthletes = useMemo(() => {
        return athletes.filter(athlete => {
            const nameMatch = `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
            const sportMatch = selectedSport === 'Todos' || athlete.sports.includes(selectedSport);
            const courseMatch = selectedCourse === 'Todos' || athlete.course === selectedCourse;

            // Handle institution filtering - simple include check
            const instMatch = selectedInstitution === 'Todas' ||
                athlete.institution.toLowerCase().includes(selectedInstitution.toLowerCase());

            return nameMatch && sportMatch && courseMatch && instMatch;
        }).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    }, [searchTerm, selectedSport, selectedCourse, selectedInstitution, athletes]);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            return course.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a, b) => a.localeCompare(b));
    }, [searchTerm, courses]);

    const uniqueInstitutions = useMemo(() => {
        const institutions = new Set<string>();
        athletes.forEach(a => {
            // Extract core institution name (e.g., Unisanta, Unisantos)
            const parts = a.institution.split(' - ');
            const core = parts.length > 1 ? parts[parts.length - 1] : parts[0];
            institutions.add(core);
        });
        return Array.from(institutions).sort();
    }, [athletes]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Participantes</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Fique por dentro de todos os talentos e delegações dos Jogos</p>
                        </div>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder={activeTab === 'athletes' ? "Buscar atleta por nome..." : "Buscar curso ou atlética..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 40px',
                                    background: 'var(--bg-main)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    cursor: 'text',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--accent-color)';
                                    e.target.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        padding: '4px',
                                        borderRadius: '50%',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginBottom: '40px',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '0'
                    }}>
                        <button
                            onClick={() => setActiveTab('courses')}
                            style={{
                                padding: '15px 30px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'courses' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'courses' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Cursos & Atléticas
                        </button>
                        <button
                            onClick={() => setActiveTab('athletes')}
                            style={{
                                padding: '15px 30px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'athletes' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'athletes' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Atletas
                        </button>
                    </div>

                    {activeTab === 'courses' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {filteredCourses.map((course, index) => {
                                const [name, university] = course.split(' - ');
                                const icon = getCourseIcon(name);
                                const emblemUrl = customEmblems[course] || (course in COURSE_EMBLEMS ? `/emblemas/${COURSE_EMBLEMS[course]}` : null);

                                return (
                                    <div
                                        key={index}
                                        className="premium-card hover-glow"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            padding: '20px',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedCourseDetails({ name, university, icon, emblemUrl })}
                                    >
                                        {emblemUrl ? (
                                            <div style={{
                                                width: '60px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <img
                                                    src={emblemUrl}
                                                    alt={`${name} emblem`}
                                                    style={{ width: '60px', height: 'auto', objectFit: 'contain' }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextElementSibling) {
                                                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                                <div style={{
                                                    display: 'none',
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'var(--bg-hover)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--accent-color)',
                                                    fontSize: '24px'
                                                }}>
                                                    {icon}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent-color)',
                                                fontSize: '24px'
                                            }}>
                                                {icon}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {name}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <School size={12} />
                                                {university}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredCourses.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Nenhum participante ou curso encontrado com este nome.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'athletes' && (
                        <div>
                            {/* Desktop Filters */}
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                {/* Search input was moved to correct header scope */}
                                <select
                                    value={selectedSport}
                                    onChange={(e) => setSelectedSport(e.target.value)}
                                    style={{
                                        padding: '12px 15px',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        flex: '1 1 200px'
                                    }}
                                >
                                    <option value="Todos">Todos os Esportes</option>
                                    {AVAILABLE_SPORTS.map(sport => (
                                        <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    style={{
                                        padding: '12px 15px',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        flex: '1 1 200px'
                                    }}
                                >
                                    <option value="Todos">Todos os Cursos</option>
                                    {courses.map(course => (
                                        <option key={course} value={course.split(' - ')[0]}>{course.split(' - ')[0]}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedInstitution}
                                    onChange={(e) => setSelectedInstitution(e.target.value)}
                                    style={{
                                        padding: '12px 15px',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        flex: '1 1 200px'
                                    }}
                                >
                                    <option value="Todas">Todas Instituições</option>
                                    {uniqueInstitutions.map(inst => (
                                        <option key={inst} value={inst}>{inst}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                gap: '20px'
                            }}>
                                {filteredAthletes.map(athlete => (
                                    <div key={athlete.id} className="premium-card hover-glow" style={{ padding: '20px', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: 'var(--bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent-color)',
                                                fontSize: '20px',
                                                fontWeight: 800
                                            }}>
                                                {athlete.firstName[0]}{athlete.lastName[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {athlete.firstName} {athlete.lastName}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {athlete.course}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.8 }}>
                                                    {athlete.institution}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {athlete.sports.map(sport => (
                                                <span key={sport} style={{
                                                    background: 'var(--bg-main)',
                                                    color: 'var(--text-secondary)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    {sport}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {filteredAthletes.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        Nenhum participante ou curso encontrado com este nome.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .hover-glow:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-color);
                    background: var(--bg-hover);
                    box-shadow: 0 10px 30px rgba(227, 6, 19, 0.1);
                }
            `}</style>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            <ModalDetalhes
                isOpen={!!selectedCourseDetails}
                onClose={() => setSelectedCourseDetails(null)}
                courseData={selectedCourseDetails}
            />
        </div >
    );
};

export default Participants;
