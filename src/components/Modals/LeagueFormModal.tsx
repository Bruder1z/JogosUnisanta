import { type FC, useState } from 'react';
import { X, Trophy, Link as LinkIcon, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface LeagueFormModalProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
}

const LeagueFormModal: FC<LeagueFormModalProps> = ({ aberto, setAberto }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [copied, setCopied] = useState(false);

    if (!aberto) return null;

    const generatedLink = `https://jogosunisanta.com.br/liga/${name.toLowerCase().replace(/\s+/g, '-') || 'nova-liga'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setStep(2);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setAberto(false);
        // Reset state after a delay to avoid flicker during closing animation
        setTimeout(() => {
            setStep(1);
            setName('');
            setDescription('');
        }, 300);
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

                {/* Step Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                }}>
                    <div style={{
                        height: '4px',
                        flex: 1,
                        background: step >= 1 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                    }} />
                    <div style={{
                        height: '4px',
                        flex: 1,
                        background: step >= 2 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                    }} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: 'var(--text-secondary)',
                        marginLeft: '8px',
                        letterSpacing: '1px',
                    }}>
                        PASSO {step} DE 2
                    </span>
                </div>

                {step === 1 ? (
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

                        <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                style={{
                                    marginTop: '12px',
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
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
                                    e.currentTarget.style.filter = 'brightness(1.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(227, 6, 19, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.filter = 'brightness(1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(227, 6, 19, 0.3)';
                                }}
                            >
                                Próximo Passo
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="fade-in text-center">
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <Check size={32} style={{margin: 'auto'}}/>
                            </div>
                            <h2 style={{
                                fontSize: '26px',
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                                marginBottom: '8px',
                                letterSpacing: '-0.5px',
                            }}>
                                LIGA CRIADA!
                            </h2>
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                            }}>
                                Agora é só convidar seus amigos enviando o link de compartilhamento abaixo.
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px dashed var(--border-color)',
                            marginBottom: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--accent-color)',
                                fontSize: '11px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}>
                                <LinkIcon size={14} />
                                Link de Convite
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '12px',
                                borderRadius: '8px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                                border: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'left',
                            }}>
                                {generatedLink}
                            </div>
                            <button
                                onClick={handleCopy}
                                style={{
                                    background: copied ? '#22c55e' : 'rgba(255,255,255,0.05)',
                                    color: copied ? 'white' : 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copied ? (
                                    <><Check size={16} /> COPIADO!</>
                                ) : (
                                    <><Copy size={16} /> COPIAR LINK</>
                                )}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <ArrowLeft size={16} />
                                VOLTAR
                            </button>
                            <button
                                onClick={handleClose}
                                style={{
                                    flex: 2,
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                            >
                                CONCLUIR
                            </button>
                        </div>
                    </div>
                )}
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
