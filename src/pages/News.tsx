import { type FC, useState, useEffect } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';
import { mockNews } from '../data/mockData';
import { ExternalLink, Calendar, RefreshCw } from 'lucide-react';

const News: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
    const [nextUpdate, setNextUpdate] = useState(3600); // 1 hour in seconds
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setNextUpdate((prev) => {
                if (prev <= 1) {
                    refreshNews();
                    return 3600;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const refreshNews = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastUpdated(new Date().toLocaleTimeString());
            setIsRefreshing(false);
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '10px' }}>Notícias</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Fique por dentro de tudo o que acontece nos Jogos da Unisanta</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                                <span>Última atualização: {lastUpdated}</span>
                            </div>
                            <div>Próxima atualização em: {formatTime(nextUpdate)}</div>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'var(--news-grid-cols)',
                        gap: '30px'
                    }}>
                        {mockNews.map((article) => (
                            <div key={article.id} className="premium-card hover-glow" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                padding: '30px',
                                transition: 'transform 0.2s',
                                minHeight: '320px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                    <Calendar size={14} />
                                    <span>{article.date}</span>
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                                    {article.title}
                                </h3>
                                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {article.summary}
                                </p>
                                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: 'var(--accent-color)',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Ler no Santa Portal
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '60px',
                        padding: '40px',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--border-radius)',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Quer acompanhar em tempo real?</h2>
                        <a
                            href="https://santaportal.com.br/jogos-da-unisanta"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="premium-button"
                            style={{
                                display: 'inline-block',
                                padding: '14px 32px',
                                background: 'var(--accent-color)',
                                color: 'white',
                                borderRadius: 'var(--border-radius)',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '16px'
                            }}
                        >
                            Acessar Santa Portal Completo
                        </a>
                    </div>
                </div>
            </main>

            <style>{`
                .hover-glow:hover {
                    transform: translateY(-8px);
                    border-color: var(--accent-color);
                    box-shadow: 0 20px 40px rgba(227, 6, 19, 0.15);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div >
    );
};

export default News;
