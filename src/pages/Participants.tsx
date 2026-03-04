import { type FC, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import {
    AVAILABLE_COURSES,
    COURSE_ICONS,
    mockAthletes,
    AVAILABLE_SPORTS,
} from '../data/mockData';
import {
    School,
    Search,
    User,
    Trophy
} from 'lucide-react';

const Participants: FC = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'courses' | 'athletes'>('courses');

    // Athlete Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState('Todos');
    const [selectedCourse, setSelectedCourse] = useState('Todos');
    const [selectedInstitution, setSelectedInstitution] = useState('Todas');

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
        return mockAthletes.filter(athlete => {
            const nameMatch = `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
            const sportMatch = selectedSport === 'Todos' || athlete.sports.includes(selectedSport);
            const courseMatch = selectedCourse === 'Todos' || athlete.course === selectedCourse;

            // Handle institution filtering - simple include check
            const instMatch = selectedInstitution === 'Todas' ||
                athlete.institution.toLowerCase().includes(selectedInstitution.toLowerCase());

            return nameMatch && sportMatch && courseMatch && instMatch;
        });
    }, [searchTerm, selectedSport, selectedCourse, selectedInstitution]);

    const uniqueInstitutions = useMemo(() => {
        const institutions = new Set<string>();
        mockAthletes.forEach(a => {
            // Extract core institution name (e.g., Unisanta, Unisantos)
            const parts = a.institution.split(' - ');
            const core = parts.length > 1 ? parts[parts.length - 1] : parts[0];
            institutions.add(core);
        });
        return Array.from(institutions).sort();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <div style={{ display: 'flex', flex: 1, paddingLeft: 'var(--sidebar-width)', paddingTop: 'var(--header-height)' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Participantes</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Fique por dentro de todos os talentos e delegações dos Jogos</p>
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

                    {activeTab === 'courses' ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {AVAILABLE_COURSES.map((course, index) => {
                                const [name, university] = course.split(' - ');
                                const icon = getCourseIcon(name);

                                return (
                                    <div key={index} className="premium-card hover-glow" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '20px',
                                        transition: 'all 0.2s'
                                    }}>
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
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Trophy size={20} color="var(--accent-color)" />
                                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Destaques dos Jogos</h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {[...mockAthletes].sort(() => 0.5 - Math.random()).slice(0, 5).map(athlete => (
                                        <div key={athlete.id} className="premium-card hover-glow" style={{ padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                background: 'var(--accent-color)',
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                opacity: 0.1
                                            }} />
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                background: 'var(--bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent-color)',
                                                fontSize: '24px',
                                                fontWeight: 800,
                                                margin: '0 auto 15px',
                                                border: '2px solid var(--accent-color)'
                                            }}>
                                                {athlete.firstName[0]}{athlete.lastName[0]}
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>
                                                {athlete.firstName} {athlete.lastName}
                                            </div>
                                            <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                                {athlete.sports.map(sport => (
                                                    <span key={sport} style={{
                                                        background: 'var(--bg-hover)',
                                                        color: 'white',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        border: '1px solid var(--border-color)'
                                                    }}>
                                                        {sport}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style>{`
                .hover-glow:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-color);
                    background: var(--bg-hover);
                    box-shadow: 0 10px 30px rgba(227, 6, 19, 0.1);
                }
            `}</style>
        </div >
    );
};

export default Participants;
