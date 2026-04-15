import { type FC, useState } from 'react';
import { ArrowLeft, CalendarDays, Download, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';

const MAIN_VENUES = [
    'Arena Unisanta',
    'Bloco A',
    'Centro de Treinamento',
    'Clube dos Ingleses',
    'Laerte Gonçalves (Bloco D)',
    'Piscina Olimpica',
    'Poliesportivo Unisanta (Bloco M)',
    'Rebouças',
];

const Calendario: FC = () => {
    const [showRanking, setShowRanking] = useState(false);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} className="calendar-page-root">
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '18px' }}>
                        <Link
                            to="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            <ArrowLeft size={16} /> Voltar
                        </Link>
                    </div>

                    <section className="premium-card" style={{ padding: '30px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }} className="calendar-page-head">
                            <div>
                                <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.1, fontWeight: 900 }}>
                                    Calendario Oficial
                                </h1>
                                <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '15px' }}>
                                    Jogos Unisanta 2025
                                </p>
                            </div>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '999px',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                fontWeight: 700
                            }}>
                                <CalendarDays size={14} /> 04 a 22 de maio de 2026
                            </span>
                        </div>

                        <div className="calendar-venues-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '14px',
                            marginBottom: '24px'
                        }}>
                            {MAIN_VENUES.map((venue) => (
                                <div key={venue} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <MapPin size={16} color="var(--accent-color)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '14px', lineHeight: 1.35 }}>{venue}</span>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/pdf/tabela-jogos-2026.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            download="tabela-jogos-2026.pdf"
                            onClick={() => {
                                console.log('Iniciando download da tabela oficial...');
                                console.log('Caminho tentado: /pdf/tabela-jogos-2026.pdf');
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: 'var(--accent-color)',
                                color: '#fff',
                                textDecoration: 'none',
                                padding: '12px 20px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '14px',
                                boxShadow: '0 8px 20px rgba(227,6,19,0.28)'
                            }}
                        >
                            <Download size={18} /> Baixar tabela oficial (PDF)
                        </a>
                    </section>
                </div>
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .calendar-page-root main {
                        padding: 14px !important;
                    }

                    .calendar-page-head {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }

                    .calendar-page-head h1 {
                        font-size: 28px !important;
                    }

                    .calendar-venues-grid {
                        grid-template-columns: 1fr !important;
                    }
                }

                @media (max-width: 390px) {
                    .calendar-page-root main {
                        padding: 10px !important;
                    }

                    .calendar-page-head h1 {
                        font-size: 24px !important;
                    }
                }
            `}</style>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

export default Calendario;
