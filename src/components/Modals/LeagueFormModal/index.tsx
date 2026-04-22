import { type FC, useState } from 'react';
import { X, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../NotificationContext';
import './styles.css';

interface LeagueFormModalProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
    onCreated?: () => void;
}

const LeagueFormModal: FC<LeagueFormModalProps> = ({ aberto, setAberto, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
    const { user } = useAuth();
    const { showNotification } = useNotification();

    if (!aberto) return null;

    const handleClose = () => {
        setAberto(false);
        // Reset state after a delay to avoid flicker during closing animation
        setTimeout(() => {
            setName('');
            setDescription('');
            setCreatedLeagueId(null);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const creator = user?.email?.toLowerCase() || 'anonymous';

            // ── Check league limit (max 5 including automatic leagues) ──
            const { data: allLeagues, error: countError } = await supabase
                .from('leagues')
                .select('id, participants');

            if (!countError && allLeagues) {
                const privateLeagueCount = allLeagues.filter((l: any) => {
                    const parts: string[] = Array.isArray(l.participants)
                        ? l.participants
                        : typeof l.participants === 'string'
                            ? (() => { try { return JSON.parse(l.participants); } catch { return l.participants.split(',').map((p: string) => p.trim()); } })()
                            : [];
                    return parts.some((p: string) => p.toLowerCase() === creator);
                }).length;

                const automaticCount = 1 + (user?.preferredCourse ? 1 : 0);
                const totalCount = privateLeagueCount + automaticCount;

                if (totalCount >= 5) {
                    showNotification('Você já participa de 5 ligas, que é o máximo permitido. Saia de uma liga antes de criar uma nova.', 'error');
                    setIsLoading(false);
                    return;
                }
            }

            // ── Create the league ──
            const { data, error } = await supabase
                .from('leagues')
                .insert([
                    {
                        name: name.trim(),
                        description: description.trim(),
                        owner_email: creator,
                        participants: [creator]
                    }
                ])
                .select('id')
                .single();

            if (error) {
                console.error("Erro ao criar liga:", error);
                showNotification("Erro ao salvar liga no banco de dados. Verifique a tabela 'leagues'.", 'error');
                return;
            }

            if (data) {
                setCreatedLeagueId(data.id);
            }

            if (onCreated) onCreated();
        } catch (err) {
            console.error("Exception ao criar liga:", err);
        } finally {
            setIsLoading(false);
        }
    };







    return (
        <div className="league-form-overlay" onClick={handleClose}>
            <div className="league-form-card" onClick={(event) => event.stopPropagation()}>
                <button onClick={handleClose} className="league-form-close-btn">
                    <X size={20} />
                </button>

                <div className="league-form-fade-in">
                    {createdLeagueId ? (
                        <div className="league-form-success">
                            <div className="league-form-success-icon">
                                <Trophy size={32} style={{ color: '#22c55e' }} />
                            </div>
                            <h2 className="league-form-success-title">LIGA CRIADA!</h2>
                            <p className="league-form-success-text">Compartilhe o link abaixo para convidar seus amigos:</p>

                            <div className="league-form-share-box">
                                <input
                                    readOnly
                                    value={`${window.location.origin}/?join=${createdLeagueId}`}
                                    className="league-form-share-input"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/?join=${createdLeagueId}`);
                                        showNotification('Link copiado!', 'success');
                                    }}
                                    className="league-form-copy-btn"
                                >
                                    COPIAR
                                </button>
                            </div>

                            <button onClick={handleClose} className="league-form-finish-btn">
                                CONCLUIR
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="league-form-header">
                                <h2 className="league-form-title">
                                    <Trophy size={28} className="league-form-title-icon" />
                                    CRIAR NOVA LIGA
                                </h2>
                                <p className="league-form-subtitle">
                                    Preencha os dados abaixo para configurar sua nova competição entre amigos.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="league-form">
                                <div className="league-form-field">
                                    <label className="league-form-label">Nome da Liga</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Ex: Liga dos Amigos 2024"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        className="league-form-input"
                                    />
                                </div>

                                <div className="league-form-field">
                                    <label className="league-form-label">Descrição</label>
                                    <textarea
                                        placeholder="Como vai funcionar sua liga? Defina as regras aqui..."
                                        rows={4}
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        className="league-form-textarea"
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="league-form-submit-btn">
                                    {isLoading ? 'CRIANDO...' : <>{'CRIAR LIGA'} <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeagueFormModal;
