import { type FC, useState } from 'react';
import { X, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface LeagueFormModalProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
}

const LeagueFormModal: FC<LeagueFormModalProps> = ({ aberto, setAberto }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    if (!aberto) return null;

    const handleClose = () => {
        setAberto(false);
        // Reset state after a delay to avoid flicker during closing animation
        setTimeout(() => {
            setName('');
            setDescription('');
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsLoading(true);
            try {
                const creator = user?.email || 'anonymous';
                const initialParticipants = [creator];

                const { error } = await supabase
                    .from('leagues')
                    .insert([
                        {
                            name: name.trim(),
                            description: description.trim(),
                            participants: initialParticipants
                        }
                    ]);

                if (error) {
                    console.error("Erro ao criar liga:", error);
                    alert("Erro ao salvar liga no banco de dados. Verifique a tabela 'leagues'.");
                    return;
                }
                
                // Fecha a modal, mantendo na tela de "COMPETIÇÕES" (já que o Modal surgiu nela)
                handleClose();
            } catch (err) {
                console.error("Exception ao criar liga:", err);
            } finally {
                setIsLoading(false);
            }
        }
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
            onClick={handleClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '32px',
                    borderRadius: '20px',
                    position: 'relative',
                    maxWidth: '480px',
                    width: '90%',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
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

                <div className="fade-in">
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            letterSpacing: '-0.5px',
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
                                fontSize: '12px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Nome da Liga
                            </label>
                            <input
                                type="text"
                                required
                                autoFocus
                                placeholder="Ex: Liga dos Amigos 2024"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    color: 'white',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Descrição
                            </label>
                            <textarea
                                placeholder="Como vai funcionar sua liga? Defina as regras aqui..."
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '12px',
                                backgroundColor: 'var(--accent-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '15px',
                                fontWeight: 800,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.3s',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 8px 20px rgba(227, 6, 19, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                                if(!isLoading) {
                                    e.currentTarget.style.filter = 'brightness(1.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(227, 6, 19, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if(!isLoading) {
                                    e.currentTarget.style.filter = 'brightness(1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(227, 6, 19, 0.3)';
                                }
                            }}
                        >
                            {isLoading ? 'CRIANDO...' : (
                                <>
                                    CRIAR LIGA
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <style>{`
                .fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LeagueFormModal;
