import { type FC, useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import './LiveChat.css';

interface ChatMessage {
    id: string;
    username: string;
    userColor: string;
    text: string;
    timestamp: Date;
    isSystemWarning?: boolean;
    senderRole?: string;
}

interface LiveChatProps {
    matchId?: string;
}

const LiveChat: FC<LiveChatProps> = ({ matchId = 'live-geral' }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const storageKey = `chat_messages_${matchId}`;

    // Detecta se é super admin com segurança
    const isAdmin = user && user.role === 'superadmin';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Lê histórico e sincroniza mensagens entre abas locais e por supabase broadcast
    useEffect(() => {
        const loadMessages = () => {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setMessages(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    console.error('Erro ao carregar mensagens:', e);
                    setMessages([]);
                }
            } else {
                setMessages([]);
            }
        };

        loadMessages();

        // Escuta mudanças de storage (mesmo browser)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setMessages(Array.isArray(parsed) ? parsed : []);
                } catch (err) {
                    console.error('Erro na sincronização do chat:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Supabase Realtime Broadcast (cruza navegadores/dispositivos diferentes)
        const channel = supabase.channel(`chat_${matchId}`, {
            config: {
                broadcast: { ack: false },
            },
        });

        channel
            .on('broadcast', { event: 'new_message' }, (payload) => {
                const incomingMessage = payload.payload as ChatMessage;
                setMessages((prev) => {
                    // Evita duplicadades caso recebamos o próprio broadcast via storage também
                    if (prev.some((m) => m.id === incomingMessage.id)) return prev;

                    const updatedMessages = [...prev, incomingMessage];
                    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
                    return updatedMessages;
                });
            })
            .on('broadcast', { event: 'delete_message' }, (payload) => {
                const messageId = payload.payload.id as string;
                setMessages((prev) => {
                    const updatedMessages = prev.filter((m) => m.id !== messageId);
                    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
                    return updatedMessages;
                });
            })
            .subscribe();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            supabase.removeChannel(channel);
        };
    }, [matchId, storageKey]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!inputText.trim()) return;

        // Lista de palavras proibidas
        const FORBIDDEN_WORDS = [
            'merda', 'porra', 'caralho', 'puta', 'viado', 'buceta', 'cuzao',
            'arrombado', 'fdp', 'cacete', 'desgracado', 'idiota', 'imbecil',
            'macaco', 'macaca', 'macacos', 'macacada', 'crioulo', 'crioula',
            'neguinho', 'neguinha', 'preto', 'preta', 'pretos', 'pretas',
            'favelado', 'favelada', 'senzala', 'nigga', 'nigger'
        ];

        // Normaliza input tirando acentos
        const normalizedInput = inputText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        // Verifica palavras proibidas
        const hasBadWord = FORBIDDEN_WORDS.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(normalizedInput);
        });

        const senderName = user?.name || 'Torcedor(a)';
        const role = user?.role || 'user';
        const isMsgAdmin = role === 'superadmin';

        const newMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            username: senderName,
            userColor: isMsgAdmin ? 'var(--accent-color)' : '#fff',
            text: hasBadWord ? '🚫 [Mensagem apagada por conter termos impróprios]' : inputText,
            isSystemWarning: hasBadWord,
            timestamp: new Date(),
            senderRole: role
        };

        setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            const upToDateMessages = [...prev, newMessage];
            localStorage.setItem(storageKey, JSON.stringify(upToDateMessages));
            // Dispara evento de storage manualmente para outras tabs sincronizarem
            window.dispatchEvent(new Event('storage'));
            return upToDateMessages;
        });

        // Envia por Supabase Realtime Broadcast (outros computadores/celulares)
        const channel = supabase.channel(`chat_${matchId}`);
        channel.send({
            type: 'broadcast',
            event: 'new_message',
            payload: newMessage,
        });

        setInputText('');
    };

    const deleteMessage = (messageId: string) => {
        setMessages((prev) => {
            const updated = prev.filter((msg) => msg.id !== messageId);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });

        const channel = supabase.channel(`chat_${matchId}`);
        channel.send({
            type: 'broadcast',
            event: 'delete_message',
            payload: { id: messageId },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="live-chat-container">
            <div className="live-chat-header">
                Chat da Partida {isAdmin && '👨‍⚖️ (Admin)'}
            </div>

            <div className="live-chat-messages">
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Nenhuma mensagem ainda. Seja o primeiro a comentar!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="chat-message">
                            <span
                                className="chat-username"
                                style={{ color: msg.userColor }}
                            >
                                {msg.username}:
                            </span>
                            <span
                                className="chat-text"
                                style={{
                                    fontStyle: msg.isSystemWarning ? 'italic' : 'normal',
                                    color: msg.isSystemWarning ? '#f59e0b' : 'var(--text-secondary)'
                                }}
                            >
                                {msg.text}
                            </span>
                            {isAdmin && !msg.isSystemWarning && (
                                <button
                                    className="chat-delete-btn"
                                    onClick={() => deleteMessage(msg.id)}
                                    title="Excluir mensagem"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="live-chat-input-area" onSubmit={sendMessage}>
                <input
                    type="text"
                    className="live-chat-input"
                    placeholder="Digite uma mensagem..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={200}
                    autoFocus
                />
                <button
                    type="submit"
                    className="live-chat-submit"
                    disabled={!inputText.trim()}
                >
                    Enviar
                </button>
            </form>
        </div>
    );
};

export default LiveChat;
