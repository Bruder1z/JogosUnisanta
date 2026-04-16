import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar.tsx';
import MatchModal from '../components/Match/MatchModal';
import ModalitiesModal from '../components/Modals/ModalitiesModal';
import RankingModal from '../components/Modals/RankingModal';
import Login from './Login';
import AdminDashboard from '../components/Admin/AdminDashboard';
import { mockNews, type Match } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useData } from '../components/context/DataContext';
import HomeFilterBar from './Home/components/HomeFilterBar';
import HomeMatchSections from './Home/components/HomeMatchSections';
import HomeSidebarPanel from './Home/components/HomeSidebarPanel';
import HomeViewToggle from './Home/components/HomeViewToggle';
import { filterHomeMatches, type HomeCategoryFilter, type HomeDateFilter } from './Home/utils/homeFilters';
import './Home/Home.css';

const Home: React.FC = () => {
    const { user } = useAuth();
    const { matches } = useData();
    const location = useLocation();
    const navigate = useNavigate();

    const [showLogin, setShowLogin] = useState(false);
    const [showModalities, setShowModalities] = useState(false);
    const [showRanking, setShowRanking] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<HomeCategoryFilter>('Todos');
    const [selectedDate, setSelectedDate] = useState<HomeDateFilter>('Hoje');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [activeView, setActiveView] = useState<'public' | 'admin'>('public');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sportParam = params.get('sport');
        const rankingParam = params.get('ranking');
        const modalitiesParam = params.get('modalities');
        const viewParam = params.get('view');

        if (viewParam === 'admin' && user?.role === 'superadmin') {
            setActiveView('admin');
            navigate(location.pathname, { replace: true });
            return;
        }

        if (sportParam) {
            setSelectedSport(decodeURIComponent(sportParam));
            setSelectedCategory('Todos');
            navigate(location.pathname, { replace: true });
        } else if (rankingParam === 'true') {
            setShowRanking(true);
            navigate(location.pathname, { replace: true });
        } else if (modalitiesParam === 'true') {
            setShowModalities(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, navigate, location.pathname, user]);

    const filteredMatches = filterHomeMatches(matches, selectedSport, selectedCategory, selectedDate);
    const liveMatches = filteredMatches.filter((match) => match.status === 'live');
    const upcomingMatches = filteredMatches.filter((match) => match.status === 'scheduled');
    const finishedMatches = filteredMatches.filter((match) => match.status === 'finished');

    const randomHighlight = useMemo(() => {
        return mockNews[Math.floor(Math.random() * mockNews.length)];
    }, []);

    return (
        <div className="home-page">
            <Header />

            {!user && (
                <div className="home-fixed-login" style={{ position: 'fixed', top: '12px', right: '24px', zIndex: 1100 }}>
                    <button
                        onClick={() => setShowLogin(true)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--border-radius)',
                            background: 'var(--accent-color)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        Login / Cadastro
                    </button>
                </div>
            )}

            <Sidebar
                onShowModalities={() => setShowModalities(true)}
                onSelectSport={(sport: string) => {
                    setSelectedSport(sport);
                    setSelectedCategory('Todos');
                }}
                onShowRanking={() => setShowRanking(true)}
            />

            <main className="home-main">
                {user?.role === 'superadmin' && (
                    <HomeViewToggle activeView={activeView} onChangeView={setActiveView} />
                )}

                {activeView === 'admin' && user?.role === 'superadmin' ? (
                    <AdminDashboard />
                ) : (
                    <div className="home-grid">
                        <section>
                            <HomeFilterBar
                                selectedSport={selectedSport}
                                onClearSport={() => setSelectedSport(null)}
                                selectedDate={selectedDate}
                                onChangeDate={setSelectedDate}
                                selectedCategory={selectedCategory}
                                onChangeCategory={setSelectedCategory}
                                showDateDropdown={showDateDropdown}
                                onToggleDateDropdown={() => setShowDateDropdown((current) => !current)}
                                onCloseDateDropdown={() => setShowDateDropdown(false)}
                            />

                            <HomeMatchSections
                                liveMatches={liveMatches}
                                upcomingMatches={upcomingMatches}
                                finishedMatches={finishedMatches}
                                onSelectMatch={setSelectedMatch}
                            />
                        </section>

                        <HomeSidebarPanel isSuperAdmin={user?.role === 'superadmin'} highlight={randomHighlight} />
                    </div>
                )}
            </main>

            {showLogin && <Login onClose={() => setShowLogin(false)} />}
            {showModalities && (
                <ModalitiesModal
                    onClose={() => setShowModalities(false)}
                    onSelectSport={(sport: string) => {
                        setSelectedSport(sport);
                        setSelectedCategory('Todos');
                    }}
                />
            )}
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {selectedMatch && (
                <MatchModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
};

export default Home;