import { type FC, useState } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar';
import RankingModal from '../components/Modals/RankingModal';

const History: FC = () => {
    const [showRanking, setShowRanking] = useState(false);
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header />
            <Sidebar onShowRanking={() => setShowRanking(true)} />
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: '40px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>História dos Jogos</h1>

                        <div className="premium-card hover-glow" style={{ padding: '40px', lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: '16px' }}>
                            <p style={{ marginBottom: '20px' }}>
                                Os Jogos da Unisanta representam uma das mais tradicionais e importantes competições universitárias do estado de São Paulo. Realizados anualmente, o evento reúne estudantes-atletas de diversas instituições de ensino superior da Baixada Santista, promovendo não apenas o esporte, mas também a integração, o espírito de equipe e a vivência universitária.
                            </p>

                            <p style={{ marginBottom: '20px' }}>
                                Criados no início da década de 1980, os Jogos nasceram com o objetivo de incentivar a prática esportiva entre os estudantes universitários da região. A iniciativa partiu de professores idealistas que acreditavam no esporte como ferramenta de formação humana, disciplina e união acadêmica. Inicialmente, a competição recebeu o nome de Jogos da Susan (Sociedade Universitária de Santos). Posteriormente, passou a se chamar Jogos da Uniceb e, a partir de 1997, com a consolidação da Universidade Santa Cecília, o evento passou a ser oficialmente denominado Jogos da Unisanta.
                            </p>

                            <p style={{ marginBottom: '20px' }}>
                                Ao longo de mais de quatro décadas, a competição evoluiu significativamente. O que começou como um torneio regional com poucas modalidades transformou-se em um grande evento esportivo universitário, reunindo milhares de atletas e espectadores a cada edição. O crescimento foi tanto em número de participantes quanto em organização, estrutura e variedade de modalidades disputadas.
                            </p>

                            <p style={{ marginBottom: '10px' }}>Hoje, os Jogos contam com diversas modalidades esportivas, como:</p>
                            <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
                                <li>Futebol</li>
                                <li>Futsal</li>
                                <li>Basquete</li>
                                <li>Vôlei</li>
                                <li>Handebol</li>
                                <li>Atletismo</li>
                                <li>Natação</li>
                                <li>Judô</li>
                                <li>Entre outras competições individuais e coletivas</li>
                            </ul>

                            <p style={{ marginBottom: '20px' }}>
                                Além das disputas esportivas, o evento também se tornou um marco no calendário universitário, fortalecendo a identidade dos cursos participantes. Muitas faculdades e cursos desenvolveram tradição dentro da competição, criando rivalidades históricas e torcidas organizadas que movimentam a cidade durante o período dos Jogos.
                            </p>

                            <p style={{ marginBottom: '20px' }}>
                                Outro ponto importante da evolução dos Jogos foi a divisão das categorias masculina e feminina, garantindo maior equilíbrio nas disputas e premiando campeões gerais em diferentes categorias. Esse formato valorizou ainda mais o desempenho coletivo das instituições e ampliou a participação feminina nas competições.
                            </p>

                            <p style={{ marginBottom: '20px' }}>
                                Em suas edições mais recentes, os Jogos da Unisanta passaram a reunir mais de 3.000 atletas e milhares de espectadores por dia, consolidando-se como o maior evento universitário esportivo da região. A estrutura do evento inclui ginásios, quadras, piscinas e campos preparados para receber competições simultâneas, além de organização técnica especializada.
                            </p>

                            <p style={{ marginBottom: '10px' }}>Mais do que um torneio, os Jogos da Unisanta representam:</p>
                            <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
                                <li>Integração entre cursos e instituições</li>
                                <li>Desenvolvimento do espírito esportivo</li>
                                <li>Incentivo à prática de atividades físicas</li>
                                <li>Formação de lideranças estudantis</li>
                                <li>Criação de memórias marcantes da vida universitária</li>
                            </ul>

                            <p style={{ marginBottom: '20px' }}>
                                Ao longo de sua história, a competição contribuiu para revelar talentos esportivos e fortalecer a cultura universitária na Baixada Santista. O evento também impacta positivamente a economia local, movimentando a cidade durante sua realização.
                            </p>

                            <p>
                                Com mais de 40 anos de tradição, os Jogos da Unisanta seguem como símbolo de união, competitividade saudável e orgulho acadêmico, reafirmando seu papel como uma das maiores celebrações do esporte universitário paulista.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
        </div>
    );
};

export default History;
