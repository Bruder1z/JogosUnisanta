import { type FC, useState } from 'react';
import { ArrowRight, Trophy, X } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../NotificationContext';
import ModalShell from '../ModalShell';
import './LeagueFormModal.css';
import type { LeagueFormModalProps, LeagueRow } from './types';

const parseParticipants = (participants: unknown): string[] => {
    if (Array.isArray(participants)) {
        return participants.map((participant) => String(participant));
    }

    if (typeof participants === 'string' && participants) {
        try {
            const parsed = JSON.parse(participants);
            return Array.isArray(parsed)
                ? parsed.map((participant) => String(participant))
                : participants.split(',').map((participant) => participant.trim());
        } catch {
            return participants.split(',').map((participant) => participant.trim());
        }
    }

    if (participants && typeof participants === 'object') {
        return Object.values(participants as Record<string, unknown>).map((participant) => String(participant));
    }

    return [];
};

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
        setTimeout(() => {
            setName('');
            setDescription('');
            setCreatedLeagueId(null);
        }, 300);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!name.trim()) return;

        setIsLoading(true);

        try {
            const creator = user?.email?.toLowerCase() || 'anonymous';

            const { data: allLeagues, error: countError } = await supabase
                .from('leagues')
                .select('id, participants');

            if (!countError && allLeagues) {
                const privateLeagueCount = (allLeagues as LeagueRow[]).filter((league) => {
                    const participants = parseParticipants(league.participants);
                    return participants.some((participant) => participant.toLowerCase() === creator);
                }).length;

                const automaticCount = 1 + (user?.preferredCourse ? 1 : 0);
                const totalCount = privateLeagueCount + automaticCount;

                if (totalCount >= 5) {
                    showNotification('Você já participa de 5 ligas, que é o máximo permitido. Saia de uma liga antes de criar uma nova.', 'error');
                    setIsLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from('leagues')
                .insert([
                    {
                        name: name.trim(),
                        description: description.trim(),
                        owner_email: creator,
                        participants: [creator],
                    },
                ])
                .select('id')
                .single();

            if (error) {
                console.error('Erro ao criar liga:', error);
                showNotification("Erro ao salvar liga no banco de dados. Verifique a tabela 'leagues'.", 'error');
                return;
            }

            if (data) {
                setCreatedLeagueId(data.id);
            }

            if (onCreated) onCreated();
        } catch (error) {
            console.error('Exception ao criar liga:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const inviteLink = createdLeagueId ? `${window.location.origin}/?join=${createdLeagueId}` : '';

    return (
        <ModalShell
            isOpen={aberto}
            onClose={handleClose}
            overlayClassName="leagueFormOverlay"
            cardClassName="leagueFormModal leagueFormFadeIn"
            showCloseButton={false}
        >
            <button onClick={handleClose} className="leagueFormCloseButton" aria-label="Fechar">
                <X size={20} />
            </button>

            <div className="leagueFormContent">
                {createdLeagueId ? (
                    <div className="leagueFormCreatedWrap">
                        <div className="leagueFormCreatedIcon">
                            <Trophy size={32} style={{ color: '#22c55e' }} />
                        </div>
                        <h2 className="leagueFormCreatedTitle">LIGA CRIADA!</h2>
                        <p className="leagueFormCreatedText">Compartilhe o link abaixo para convidar seus amigos:</p>

                        <div className="leagueFormLinkBox">
                            <input readOnly value={inviteLink} className="leagueFormLinkInput" />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteLink);
                                    showNotification('Link copiado!', 'success');
                                }}
                                className="leagueFormCopyButton"
                            >
                                COPIAR
                            </button>
                        </div>

                        <button onClick={handleClose} className="leagueFormDoneButton">
                            CONCLUIR
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="leagueFormHeadingWrap">
                            <h2 className="leagueFormHeading">
                                <Trophy size={28} style={{ color: 'var(--accent-color)' }} />
                                CRIAR NOVA LIGA
                            </h2>
                            <p className="leagueFormDescription">
                                Preencha os dados abaixo para configurar sua nova competição entre amigos.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="leagueForm">
                            <div className="leagueFormField">
                                <label className="leagueFormLabel">Nome da Liga</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ex: Liga dos Amigos 2024"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="leagueFormInput"
                                />
                            </div>

                            <div className="leagueFormField">
                                <label className="leagueFormLabel">Descrição</label>
                                <textarea
                                    placeholder="Como vai funcionar sua liga? Defina as regras aqui..."
                                    rows={4}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="leagueFormTextarea"
                                />
                            </div>

                            <button type="submit" disabled={isLoading} className="leagueFormSubmitButton">
                                {isLoading ? 'CRIANDO...' : (
                                    <>
                                        CRIAR LIGA
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </ModalShell>
    );
};

export default LeagueFormModal;