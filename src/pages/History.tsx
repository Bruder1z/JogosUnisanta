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
            <main style={{ marginLeft: 'var(--sidebar-width)', marginTop: 'var(--header-height)', padding: 'var(--main-padding)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>História dos Jogos</h1>
                            <button 
                                onClick={() => setShowRanking(true)}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                                }}
                            >
                                🏆 Pontuação Oficial Jogos 2025
                            </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            {/* Top Gradient Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: '8px',
                                height: '60px',
                                background: 'linear-gradient(to bottom, var(--bg-card), transparent)',
                                pointerEvents: 'none',
                                zIndex: 10,
                                borderRadius: 'var(--card-radius) var(--card-radius) 0 0'
                            }} />

                            <div className="premium-card hover-glow history-scrollbar" style={{
                                padding: '30px',
                                border: '1px solid #333',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}>
                                <div style={{ color: 'var(--text-secondary)', padding: '20px 0', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                    <p style={{ marginBottom: '20px' }}>Há exatos 42 anos, o professor Milton José Ribeiro, o Mono, na época já ocupando a direção do Departamento de Educação Física e Esportes da Santa Cecília (DEFE), e o então vice-diretor da Faculdade de Educação Física de Santos (Fefis), professor Luiz Carlos dos Santos, deram início ao processo que redundaria na criação do maior evento de caráter esportivo universitário do Estado de São Paulo.</p>

                                    <p style={{ marginBottom: '20px' }}>Atendendo às orientações da direção da Sociedade Universitária de Santos (SUSAN), os professores Mono e Luiz Carlos idealizaram o regulamento de uma competição de caráter poliesportivo com a finalidade de reunir alunos-atletas das faculdades mantidas pela Sociedade Universitária de Santos (SUSAN), entidade que aglutinava o Instituto Superior de Educação Santa Cecília (ISESC) e o Centro Unificado de Estudos Unificados Bandeirantes (CEUBAN).</p>

                                    <p style={{ marginBottom: '20px' }}>De 1983 a 1985, foram realizados os Jogos da Susan, envolvendo as faculdades de Engenharia, Artes Plásticas e Ciências, do ISESC, bem como a Fefis e a Faccas, do CEUBAN.</p>

                                    <p style={{ marginBottom: '20px' }}>Já em 1986, com a criação da Universidade Santa Cecília dos Bandeirantes (UNICEB) – numa função da Santa Cecília com o CEUBAN – a competição ganhou nova nomenclatura, passando a chamar-se Jogos da UNICEB.</p>

                                    <p style={{ marginBottom: '20px' }}>Mas as novidades não ficariam por ai. A partir deste ano, além das faculdades da UNICEB, outras instituições passaram a tomar parte das disputas, na condição de convidadas.</p>

                                    <p style={{ marginBottom: '20px' }}>Os Jogos da UNICEB duraram até 1996.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 1997, com o desmembramento da UNICEB em duas universidades: Universidade Santa Cecília (UNISANTA) e Universidade Metropolitana de Santos (UNIMES), os jogos passaram a contar com sua terceira denominação: Jogos da UNISANTA.</p>

                                    <p style={{ marginBottom: '20px' }}>Com essa nova nomenclatura, pensou-se inicialmente em iniciar-se um novo ciclo de competições universitárias, de maneira que esses jogos acabaram por receber a denominação de I JOGOS DA UNISANTA. No ano seguinte, por iniciativa do Dr. Marcelo Teixeira, presidente da Comissão Organizadora dos Jogos, ficou definido que a contagem seria mantida, independente das alterações havia na nomenclatura.</p>

                                    <p style={{ marginBottom: '20px' }}>Assim, ao invés de termos os II JOGOS DA UNISANTA, a competição em 98, ficou definida como XV JOGOS DA UNISANTA.</p>

                                    <p style={{ marginBottom: '20px' }}>Nos primeiros anos de disputa, havia apenas um campeão geral, a partir da soma dos pontos das categorias feminina e masculina. Sendo assim, a Fefis ficou com a posse em definitiva do primeiro troféu de campeão geral. Pelo regulamento, a conquista em definitivo do troféu de campeão geral é determinada pela conquista de três títulos consecutivos ou cinco alternados.</p>

                                    <p style={{ marginBottom: '20px' }}>Com a separação das duas categorias, passaram a ser disputados dois troféus. A Engenharia Santa Cecília ganhou na época dois troféus de campeã geral, sendo o último deles obtido em 1998. Em 1999, a mesma Engenharia Santa Cecília venceu e ficou com a posse transitória do novo troféu colocado em disputa.</p>

                                    <p style={{ marginBottom: '20px' }}>No feminino, a equipe unificada da UNISANTA venceu nas temporadas 1998 e 1999. A partir de 2000, com o desmembramento de algumas das equipes femininas da UNISANTA, a equipe unificada perdeu a força para deixar de existir a partir da temporada 2001.</p>

                                    <p style={{ marginBottom: '20px' }}>No ano 2000, a Engenharia UNISANTA voltou a vencer na contagem geral masculina, enquanto a Fefis (Educação Física Unimes) levou o título no feminino.</p>

                                    <p style={{ marginBottom: '20px' }}>A hegemonia da Engenharia UNISANTA, no masculino, chegou ao fim em 2001, com a FEFESP levantando o título de campeã. A festa da Educação Física UNISANTA foi ainda maior, já que obteve também o título do feminino.</p>

                                    <p style={{ marginBottom: '20px' }}>Já em 2002, a FEFESP não conseguiu manter seu desempenho em um igualmente elevado. Assim, Engenharia UNISANTA, no masculino, e Fefis Unimes, no feminino, voltaram a vencer, conquistando os títulos em disputa na temporada. Em 2003, a FEFESP dominou tanto no feminino quanto no masculino, recuperando a hegemonia com extrema facilidade. O mesmo verificou-se em 2004, com a FEFESP sagrando-se bicampeã nas duas categorias.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2005, o excelente trabalho de preparação promovido pela Faculdade de Fisioterapia da UNISANTA, redundou na quebra da hegemonia da FEFESP no feminino. As meninas da Fisio mostraram seu enorme valor, garantindo a conquista de uma maneira até que bastante tranquila diante de sua supremacia frente às rivais. No masculino, a FEFESP ficou com a posse definitiva do Troféu, dado o tricampeonato, assegurado com seis pontos de vantagem sobre a Engenharia UNISANTA (85 a 79).</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2006, com o fantástico recorde de 54 faculdades, a festa maior ficou para a Engenharia, campeã no masculino, e Fefesp, no feminino, sendo que a Fefesp somou o mesmo número de pontos que a Fisio (52), mas levou vantagem no número de títulos conquistados: quatro contra três.</p>

                                    <p style={{ marginBottom: '20px' }}>Na temporada 2007, nova marca recorde, com 63 faculdades inscritas e a repetição de Engenharia, no masculino, e Fefesp, no feminino, nas primeiras posições.</p>

                                    <p style={{ marginBottom: '20px' }}>Já em 2008, o evento contou com 56 faculdades, e teve como campeã a Fefesp (tri no feminino e campeã no masculino).</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2009, os Jogos impuseram a exigência de inscrição mínima em três modalidades, levando a participação de 39 faculdades e, mais uma vez, a Fefesp se sagrou campeã nas duas categorias, sendo tetra no feminino e bicampeã na masculina.</p>

                                    <p style={{ marginBottom: '20px' }}>No ano de 2010, mantida a exigência de um mínimo de três modalidades, a disputa reuniu 36 faculdades, mas contou com um acréscimo em termos de equipes e modalidades participantes. A Engenharia ficou com o título no masculino, enquanto a Fefesp manteve a hegemonia, alcançando o pentacampeonato.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2011, a FEFESP conquistou o hexacampeonato feminino e o campeonato masculino da competição, em disputas emocionantes decididas apenas nas últimas rodadas. Os 28º. Jogos da Unisanta reuniram 38 faculdades da região.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2012, a Engenharia Unisanta foi campeã no geral masculino e a FEFESP, no feminino.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2013, na 30ª edição do torneio, a FEFESP faturou, com facilidade, os títulos de campeã geral no masculino e também no feminino.</p>

                                    <p style={{ marginBottom: '20px' }}>Já em 2014, quem levou o troféu no masculino foi a Engenharia Unisanta, com uma larga vantagem sobre a vice-campeã, Medicina Santos. A FEFESP, campeã do ano passado, ficou, neste ano de 2014, com o terceiro lugar.<br />Já no feminino, a FEFESP é quem faturou o título da categoria, sendo este um bicampeonato (venceu na categoria também em 2013). No segundo lugar aparece a Medicina Santos, e, fechando o pódio, as garotas da Fisioterapia Unisanta.</p>

                                    <p style={{ marginBottom: '20px' }}>No ano de 2015, a polarização entre Engenharia Unisanta e Fefesp, mais uma vez, seguiu firme nos Jogos da Unisanta. A Engenharia faturou o geral masculino, enquanto que quem ficou com o feminino foi sua arquirrival Fefesp.</p>

                                    <p style={{ marginBottom: '20px' }}>No ano de 2016, a Engenharia Unisanta voou. No feminino, terminou com incríveis 92 pontos – 12 à frente da Fefesp, segunda colocada. O desempenho das futuras engenheiras foi tão impressionante que elas conseguiram pelo menos três pontos em todas as modalidades, tendo vencido, inclusive, seis das 13 disputadas. Quase metades dos esportes tiveram ao menos uma futura engenheira da Unisanta no topo do pódio.</p>

                                    <p style={{ marginBottom: '20px' }}>No masculino, a Engenharia Unisanta também garantiu o título, conseguindo 86 pontos e ficando à frente da Fefesp/Unisanta por uma diferença de dois pontos. A Engenharia Unisanta conseguiu seis títulos no feminino (handebol, natação, caratê, judô, futevôlei e tamboréu) e seis no masculino. (futevôlei, basquete, natação, judô, xadrez e tamboréu). O curso também conseguiu pontos em todas as outras modalidades no masculino, com exceção do society.</p>

                                    <p style={{ marginBottom: '20px' }}>Em todas as temporadas foram mais de 2.500 alunos-atletas envolvidos em média por ano e um público médio diário de 3.000 pessoas.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2017, fortes emoções do começo ao fim. Somente nas últimas partidas foi definido o campeão geral masculino. A Fefesp Unisanta ficou com o título de Campeã Geral do masculino. A segunda posição foi para a Engenharia Unisanta. Em terceiro Medicina Unimes, seguida por Engenharia Unisantos e Medicina Unilus, empatadas.<br />Já no feminino, a Engenharia Unisanta se consagrou bicampeã na classificação geral, com 94 pontos, cinco à frente da Fefesp, vice-campeã. O terceiro lugar ficou com a Medicina Unilus. A Fisioterapia Unisanta ficou em quarto e Direito Unisantos em quinto.</p>

                                    <p style={{ marginBottom: '20px' }}>Já no feminino, as atletas da Engenharia Unisanta se consagraram bicampeãs na classificação geral, com 94 pontos, cinco à frente da Fefesp, vice-campeã, com 89. Um dos fatores decisivos para o segundo título consecutivo das futuras engenheiras foram as modalidades de praia e artes marciais, nas quais a delegação conquistou cinco modalidades das sete em disputa (Natação, Caratê, Judô, Vôlei de Praia e Tamboréu). O terceiro lugar ficou com a Medicina Unilus. A Fisioterapia Unisanta ficou em quarto, e Direito Unisantos, em quinto.</p>

                                    <p style={{ marginBottom: '20px' }}>Além das modalidades citadas anteriormente, a Engenharia Unisanta conquistou também pontos em todos os outros esportes.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2017, participaram 35 faculdades de 13 instituições da Baixada Santista, sendo que mais de três mil universitários disputaram a competição, que contou com o número recorde de 250 jogos divididos em 14 modalidades no masculino e no feminino.</p>

                                    <p style={{ marginBottom: '20px' }}>Na edição de 2018, os XXXV Jogos, houve uma nova quebra de recorde de faculdades participantes, com 36 inscritos, sendo que todas disputaram modalidades masculinas e 32 competiram em modalidades femininas. Houve também a estreia da Faculdade de Bertioga.</p>

                                    <p style={{ marginBottom: '20px' }}>A FEFESP Unisanta conquistou o título geral no masculino com 92 pontos. A equipe conquistou o primeiro lugar nas modalidades de futsal, futebol society, basquete, tênis de mesa, caratê, beach tennis e tamboréu. Além desses, a FEFESP Unisanta pontuou em todas os outros esportes, com exceção do futevôlei.</p>

                                    <p style={{ marginBottom: '20px' }}>Em segundo lugar ficou a Engenharia Unisanta (76 pontos), seguida pela Medicina Unilus (45), Medicina Unimes (38) e Educação Física Fefis Unimes (30).</p>

                                    <p style={{ marginBottom: '20px' }}>No feminino, a FEFESP Unisanta conquistou o título com 87 pontos. A Faculdade venceu as modalidades na natação e no tamboréu, e também pontuou em todos os outros esportes, com exceção do vôlei de praia. Em segundo lugar ficou a Engenharia Unisanta (com 77 pontos), seguida por Medicina Unilus (55), Direito Unisantos (37) e Medicina Unimes (36).</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2019, a Fefesp levantou o troféu de campeã geral no masculino e no feminino pelo segundo ano consecutivo. Destaque da competição, a equipe esteve na liderança desde o início dos Jogos e conquistou os títulos de sete modalidades no feminino e seis no masculino, mantendo-se nas primeiras posições na maioria das disputas, garantindo a regularidade durante todo o evento esportivo.</p>

                                    <p style={{ marginBottom: '20px' }}>A XXXVI edição dos Jogos reuniu 38 faculdades do litoral norte ao sul de São Paulo, em 14 modalidades, num período de 17 dias de disputas em várias praças esportivas.</p>

                                    <p style={{ marginBottom: '20px' }}>Na edição 2022, a FEFESP Unisanta voltou a levantar o troféu geral no masculino e no feminino, pelo terceiro ano consecutivo. A equipe foi soberana na maior competição esportiva universitária do Estado de São Paulo.</p>

                                    <p style={{ marginBottom: '20px' }}>A FEFESP Unisanta somou 83 pontos no feminino e 105 pontos no masculino. Essa edição reuniu 33 Faculdades, que competiram em 14 modalidades, ao longo de 17 dias.</p>

                                    <p style={{ marginBottom: '20px' }}>No ano de 2023, a XXXVIII edição dos Jogos contou com 42 faculdades inscritas e as estreias do Basquete 3×3 e do futebol x1. O troféu geral desta temporada foi erguido pela FEFESP UNISANTA no masculino. Já no feminino, a Engenharia Unisanta desbancou os futuros educadores físicos e conquistaram o geral.</p>

                                    <p style={{ marginBottom: '20px' }}>Em 2024, a Engenharia Unisanta sagrou-se campeã geral da 39.ª edição dos Jogos, conquistando o título no feminino e no masculino. A competição contou com 46 faculdades inscritas em 16 modalidades, estabelecendo um novo recorde de participantes.</p>

                                    <p>A Fefesp Unisanta confirmou o título de campeã geral, no masculino e no feminino, na 40ª edição dos Jogos da Unisanta, disputada em 2025. A competição teve a participação de 45 atléticas e número recorde para a participação feminina. Foram disputadas 16 modalidades.</p>
                                </div>
                            </div>

                            {/* Bottom Gradient Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: '8px',
                                height: '60px',
                                background: 'linear-gradient(to top, var(--bg-card), transparent)',
                                pointerEvents: 'none',
                                zIndex: 10,
                                borderRadius: '0 0 var(--card-radius) var(--card-radius)'
                            }} />
                        </div>
                    </div>
                </div>
            </main>
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} useOfficialRanking={true} />}
        </div>
    );
};

export default History;
