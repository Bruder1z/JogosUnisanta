import { type FC, useState } from 'react';
import { X, Trophy, AlignLeft } from 'lucide-react';

interface LeagueFormModalProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
}

const LeagueFormModal: FC<LeagueFormModalProps> = ({ aberto, setAberto }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!aberto) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would normally call an API to create the league
        console.log('Criando liga:', { name, description });
        alert(`Liga "${name}" criada com sucesso! (Simulação)`);
        setAberto(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
            }}
            onClick={() => setAberto(false)}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '32px',
                    borderRadius: '16px',
                    position: 'relative',
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setAberto(false)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <Trophy size={28} style={{ color: 'var(--accent-color)' }} />
                        CRIAR NOVA LIGA
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                    }}>
                        Preencha os dados abaixo para configurar sua nova competição entre amigos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'uppercase',
                        }}>
                            Nome da Liga
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Liga dos Amigos 2024"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'uppercase',
                        }}>
                            Descrição
                        </label>
                        <textarea
                            placeholder="Mande um recado para os participantes ou descreva as regras..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'none',
                                transition: 'border-color 0.2s',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--accent-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: '0 4px 15px rgba(227, 6, 19, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.filter = 'brightness(1.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(227, 6, 19, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = 'brightness(1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(227, 6, 19, 0.3)';
                            }}
                        >
                            CRIAR LIGA AGORA
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeagueFormModal;
