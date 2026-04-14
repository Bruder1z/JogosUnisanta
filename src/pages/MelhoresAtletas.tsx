import { type FC, useMemo, useState } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { useData } from '../components/context/DataContext';
import { Trophy } from 'lucide-react';

const MelhoresAtletas: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const { featuredAthletes, mvpCandidates } = useData();

    const mvpLeaders = useMemo(() => {
        const byMatch = new Map<string, typeof mvpCandidates>();

        mvpCandidates.forEach((candidate) => {
            const bucket = byMatch.get(candidate.matchId) || [];
            bucket.push(candidate);
            byMatch.set(candidate.matchId, bucket);
        });

        const winners = Array.from(byMatch.values())
            .map((candidates) =>
                [...candidates].sort((a, b) => {
                    if (b.votes !== a.votes) return b.votes - a.votes;
                    if (b.points !== a.points) return b.points - a.points;
                    return a.playerName.localeCompare(b.playerName);
                })[0],
            )
            .filter((winner) => winner && winner.votes > 0);

        const grouped = new Map<string, {
            playerName: string;
            institution: string;
            course: string;
            sportSample: string;
            mvpCount: number;
            totalVotes: number;
        }>();

        winners.forEach((winner) => {
            const key = `${winner.playerName.toLowerCase()}::${winner.course.toLowerCase()}::${winner.institution.toLowerCase()}`;
            const current = grouped.get(key);

            if (!current) {
                grouped.set(key, {
                    playerName: winner.playerName,
                    institution: winner.institution,
                    course: winner.course,
                    sportSample: winner.sport,
                    mvpCount: 1,
                    totalVotes: winner.votes,
                });
                return;
            }

            current.mvpCount += 1;
            current.totalVotes += winner.votes;
        });

        return Array.from(grouped.values()).sort((a, b) => {
            if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
            if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
            return a.playerName.localeCompare(b.playerName);
        });
    }, [mvpCandidates]);
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Melhores Atletas</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Os destaques desta edição dos Jogos Unisanta</p>
                    </div>

                    <div>
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Trophy size={20} color="var(--accent-color)" />
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Melhores jogadores</h2>
                            </div>

                            <div className="premium-card" style={{ overflow: 'hidden' }}>
                                {mvpLeaders.length === 0 ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Ainda não há jogadores com MVP contabilizado.
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-hover)' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>#</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Jogador</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Curso / Instituicao</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Esporte</th>
                                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>MVPs</th>
                                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Votos</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mvpLeaders.map((athlete, index) => (
                                                    <tr key={`${athlete.playerName}-${athlete.course}-${athlete.institution}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{index + 1}</td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{athlete.playerName}</td>
                                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{athlete.course} - {athlete.institution}</td>
                                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{athlete.sportSample}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-color)' }}>{athlete.mvpCount}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{athlete.totalVotes}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Trophy size={20} color="var(--accent-color)" />
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Destaques dos Jogos</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '20px'
                            }}>
                                {featuredAthletes.length === 0 ? (
                                    <div className="premium-card" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Nenhum atleta em destaque no momento.
                                    </div>
                                ) : (
                                    featuredAthletes.map(athlete => (
                                        <div key={athlete.id} className="premium-card hover-glow" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
                                                width: '72px',
                                                height: '72px',
                                                borderRadius: '50%',
                                                background: 'var(--bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent-color)',
                                                fontSize: '28px',
                                                fontWeight: 800,
                                                margin: '0 auto 15px',
                                                border: '2px solid var(--accent-color)'
                                            }}>
                                                {athlete.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
                                                {athlete.name}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                {athlete.course} - {athlete.institution}
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '15px' }}>
                                                <Trophy size={14} /> {athlete.reason}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <span style={{
                                                    background: 'var(--bg-hover)',
                                                    color: 'white',
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    border: '1px solid var(--border-color)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {athlete.sport}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
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
