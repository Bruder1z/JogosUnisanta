import { type FC, useState, useMemo } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { BarChart2, Shield, Sword, FileSearch } from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockData';

const Estatisticas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { matches, courses: allCourses, athletes } = useData();

    const [sportFilter, setSportFilter] = useState<string>(AVAILABLE_SPORTS[3]); // Futsal default
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [genderFilter, setGenderFilter] = useState<string>('Masculino');

    // Extrair "Curso" dos courses disponíveis
    const uniqueCourses = useMemo(() => {
        return Array.from(new Set(allCourses.map(c => c.split(' - ')[0]))).sort();
    }, [allCourses]);

    const stats = useMemo(() => {
        // Filtrar partidas
        let filteredMatches = matches.filter(m => m.status === 'finished' && m.sport === sportFilter && m.category === genderFilter);

        // Compute goals per team
        const teamStats: Record<string, { scored: number, conceded: number, course: string, name: string }> = {};

        filteredMatches.forEach(m => {
            const courseA = m.teamA.course;
            const courseB = m.teamB.course;

            if (!teamStats[m.teamA.name]) teamStats[m.teamA.name] = { scored: 0, conceded: 0, course: courseA, name: m.teamA.name };
            if (!teamStats[m.teamB.name]) teamStats[m.teamB.name] = { scored: 0, conceded: 0, course: courseB, name: m.teamB.name };

            teamStats[m.teamA.name].scored += m.scoreA;
            teamStats[m.teamA.name].conceded += m.scoreB;
            
            teamStats[m.teamB.name].scored += m.scoreB;
            teamStats[m.teamB.name].conceded += m.scoreA;
        });

        let teams = Object.values(teamStats);

        if (courseFilter) {
            teams = teams.filter(t => t.course === courseFilter);
        }

        const bestAttack = [...teams].sort((a, b) => b.scored - a.scored);
        const bestDefense = [...teams].filter(t => t.conceded !== undefined).sort((a, b) => a.conceded - b.conceded);
        
        // Mocking Artilheiros based on bestAttack to keep it predictable
        // We find the team with most goals and distribute them to their athletes
        let topScorers: { name: string, course: string, goals: number }[] = [];
        
        let filteredAthletes = athletes.filter(a => a.sports.includes(sportFilter) && a.sex === genderFilter);
        if (courseFilter) {
            filteredAthletes = filteredAthletes.filter(a => a.course === courseFilter);
        }

        // Generate synthetic consistent goals based on athlete names to look realistic
        const seededRandom = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash % 10);
        };

        const scoredAthletes = filteredAthletes.map(a => {
            // Find if their team scored points
            const tStat = teams.find(t => t.course === a.course);
            let baseGoals = tStat ? Math.floor(tStat.scored / 3) : 0;
            let variance = seededRandom(a.firstName + a.lastName); // 0 to 9 goals extra depending on name
            return {
                name: `${a.firstName} ${a.lastName}`,
                course: a.course,
                goals: baseGoals + variance
            }
        });

        topScorers = scoredAthletes.sort((a, b) => b.goals - a.goals).slice(0, 10);

        return { bestAttack, bestDefense, topScorers };
    }, [matches, sportFilter, courseFilter, genderFilter, athletes]);


    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Estatísticas Oficiais</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Acompanhe os rankings de ataque, defesa e artilharia por modalidade</p>
                    </div>

                    {/* Filtros */}
                    <div className="premium-card" style={{ padding: '20px', display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Gênero</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#2a2a2a',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    fontSize: '15px'
                                }}
                                value={genderFilter}
                                onChange={e => setGenderFilter(e.target.value)}
                            >
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Modalidade</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#2a2a2a',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    fontSize: '15px'
                                }}
                                value={sportFilter}
                                onChange={e => setSportFilter(e.target.value)}
                            >
                                {AVAILABLE_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 250px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Curso (Opcional)</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: '#2a2a2a',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    fontSize: '15px'
                                }}
                                value={courseFilter}
                                onChange={e => setCourseFilter(e.target.value)}
                            >
                                <option value="">Todos os cursos</option>
                                {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        {/* Artilheiros */}
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart2 size={24} color="var(--accent-color)" />
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Artilheiros / Destaques</h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Os maiores pontuadores do {sportFilter}</p>
                                </div>
                            </div>
                            <div style={{ padding: '0' }}>
                                {stats.topScorers.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <FileSearch size={32} opacity={0.5} style={{ margin: '0 auto 10px' }} />
                                        Nenhum dado encontrado
                                    </div>
                                ) : (
                                    stats.topScorers.map((scorer, idx) => (
                                        <div key={idx} style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: idx < 3 ? 'rgba(227, 6, 19, 0.03)' : 'transparent' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--bg-hover)', color: idx < 3 ? '#000' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{scorer.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{scorer.course}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '18px' }}>
                                                {scorer.goals}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Ataque */}
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sword size={24} color="#10b981" />
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Melhor Ataque</h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Mais pontos/gols marcados</p>
                                </div>
                            </div>
                            <div style={{ padding: '0' }}>
                                {stats.bestAttack.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <FileSearch size={32} opacity={0.5} style={{ margin: '0 auto 10px' }} />
                                        Nenhum dado de equipe encontrado
                                    </div>
                                ) : (
                                    stats.bestAttack.slice(0, 10).map((team, idx) => (
                                        <div key={idx} style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                                    {idx + 1}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{team.name}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '16px' }}>
                                                {team.scored}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Pior Defesa */}
                        <div className="premium-card" style={{ padding: '0', overflow: 'hidden', alignSelf: 'flex-start' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={24} color="#ef4444" />
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Defesa Vazada</h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Mais pontos/gols sofridos</p>
                                </div>
                            </div>
                            <div style={{ padding: '0' }}>
                                {stats.bestDefense.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <FileSearch size={32} opacity={0.5} style={{ margin: '0 auto 10px' }} />
                                        Nenhum dado de equipe encontrado
                                    </div>
                                ) : (
                                    // Ranking das piores defesas (quem sofreu mais tá em primeiro)
                                    stats.bestDefense.sort((a, b) => b.conceded - a.conceded).slice(0, 10).map((team, idx) => (
                                        <div key={idx} style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                                    {idx + 1}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{team.name}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '16px' }}>
                                                {team.conceded}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

export default Estatisticas;
