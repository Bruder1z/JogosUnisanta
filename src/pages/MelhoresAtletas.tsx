import { type FC, useState } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { mockAthletes } from '../data/mockData';
import { Trophy } from 'lucide-react';

const MelhoresAtletas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: '40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Melhores Atletas</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Os destaques desta edição dos Jogos Unisanta</p>
                    </div>

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
                                {[...mockAthletes].sort(() => 0.5 - Math.random()).slice(0, 6).map(athlete => (
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
                                        <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <Trophy size={14} /> {(athlete.id.charCodeAt(athlete.id.length - 1) % 5) + 3} MVP
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
        </div >
    );
};

export default MelhoresAtletas;
