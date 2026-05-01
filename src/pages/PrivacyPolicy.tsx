import React from 'react';

const PrivacyPolicy: React.FC = () => {

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.close();
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '10px',
            paddingBottom: '80px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius)',
                padding: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '8px 16px',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ← Voltar
                </button>

                <h1 style={{
                    fontSize: 'clamp(20px, 5vw, 28px)',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: 'var(--accent-color)',
                    lineHeight: '1.2'
                }}>
                    Política de Privacidade e Termos de Uso
                </h1>

                <p style={{
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px'
                }}>
                    Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        1. Privacidade e Proteção de Dados (LGPD)
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px'
                    }}>
                        Seus dados pessoais serão tratados nos termos da <strong>Lei 13.709/2018 - Lei Geral de Proteção de Dados (LGPD)</strong>. 
                        A Unisanta está comprometida em proteger a privacidade e os dados pessoais de todos os usuários da plataforma dos Jogos Unisanta.
                    </p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        2. Dados Coletados
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                    }}>
                        Ao se cadastrar na plataforma, coletamos as seguintes informações:
                    </p>
                    <ul style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.8',
                        color: 'var(--text-secondary)',
                        paddingLeft: '20px'
                    }}>
                        <li>Nome completo</li>
                        <li>Endereço de e-mail</li>
                        <li>Curso de graduação</li>
                        <li>Senha criptografada</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        3. Finalidade do Tratamento de Dados
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                    }}>
                        Os dados coletados são utilizados para:
                    </p>
                    <ul style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.8',
                        color: 'var(--text-secondary)',
                        paddingLeft: '20px'
                    }}>
                        <li>Criar e gerenciar sua conta de usuário</li>
                        <li>Permitir participação em ligas e bolões esportivos</li>
                        <li>Enviar notificações sobre jogos e eventos</li>
                        <li>Personalizar sua experiência na plataforma</li>
                        <li>Gerar estatísticas e rankings dos participantes</li>
                        <li>Comunicar informações relevantes sobre os Jogos Unisanta</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        4. Compartilhamento de Dados
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)'
                    }}>
                        Seus dados pessoais não serão compartilhados com terceiros sem o seu consentimento expresso, 
                        exceto quando necessário para o funcionamento da plataforma ou quando exigido por lei.
                    </p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        5. Segurança dos Dados
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)'
                    }}>
                        Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais 
                        contra acesso não autorizado, perda, destruição ou alteração. Todas as senhas são armazenadas 
                        de forma criptografada e as comunicações são realizadas através de conexões seguras.
                    </p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        6. Seus Direitos
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                    }}>
                        De acordo com a LGPD, você tem direito a:
                    </p>
                    <ul style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.8',
                        color: 'var(--text-secondary)',
                        paddingLeft: '20px'
                    }}>
                        <li>Confirmar a existência de tratamento de seus dados</li>
                        <li>Acessar seus dados pessoais</li>
                        <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                        <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                        <li>Revogar o consentimento a qualquer momento</li>
                        <li>Solicitar a portabilidade de seus dados</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        7. Termos de Uso
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                    }}>
                        Ao utilizar a plataforma dos Jogos Unisanta, você concorda em:
                    </p>
                    <ul style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.8',
                        color: 'var(--text-secondary)',
                        paddingLeft: '20px'
                    }}>
                        <li>Fornecer informações verdadeiras e atualizadas</li>
                        <li>Manter a confidencialidade de sua senha</li>
                        <li>Não utilizar a plataforma para fins ilícitos ou não autorizados</li>
                        <li>Respeitar os demais usuários e as regras dos jogos</li>
                        <li>Não tentar acessar áreas restritas da plataforma</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        8. Alterações na Política
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)'
                    }}>
                        Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos que você 
                        revise esta página regularmente para se manter informado sobre como protegemos seus dados.
                    </p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3'
                    }}>
                        9. Contato
                    </h2>
                    <p style={{
                        fontSize: 'clamp(13px, 3.5vw, 15px)',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)'
                    }}>
                        Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, 
                        entre em contato através dos canais oficiais da Unisanta.
                    </p>
                </section>

                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: 'rgba(var(--accent-rgb, 227,6,19), 0.1)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--accent-color)'
                }}>
                    <p style={{
                        fontSize: 'clamp(12px, 3vw, 14px)',
                        lineHeight: '1.6',
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        <strong>Importante:</strong> Ao criar uma conta e utilizar a plataforma dos Jogos Unisanta, 
                        você declara ter lido, compreendido e concordado com todos os termos desta Política de Privacidade 
                        e Termos de Uso.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
