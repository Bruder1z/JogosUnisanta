import { type FC } from 'react';
import { X } from 'lucide-react';

interface ModalRegrasProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
}

const ModalRegras: FC<ModalRegrasProps> = ({ aberto, setAberto }) => {
    if (!aberto) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={() => setAberto(false)}
        >
            {/* Card Modal */}
            <div
                style={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    padding: '24px',
                    borderRadius: '12px',
                    position: 'relative',
                    maxWidth: '384px',
                    width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botão X */}
                <button
                    onClick={() => setAberto(false)}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Fechar"
                >
                    <X size={24} />
                </button>

                {/* Título */}
                <h2
                    style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: '16px',
                        paddingRight: '32px',
                    }}
                >
                    Regras do Palpitômetro

                </h2>

                {/* Texto principal */}
                <p
                    style={{
                        fontSize: '14px',
                        color: '#e4e4e7',
                        marginBottom: '20px',
                        lineHeight: '1.5',
                    }}
                >
                    Você ganha <strong>3 pontos</strong> se acertar o placar exato da partida e <strong>1 ponto</strong> se acertar a equipe vencedora.
                </p>

                {/* Seção de Desempate */}
                <div>
                    <p
                        style={{
                            fontSize: '13px',
                            color: '#e4e4e7',
                            marginBottom: '10px',
                            lineHeight: '1.6',
                        }}
                    >
                        Os critérios de desempate utilizados no bolão são:
                    </p>
                    <ul
                        style={{
                            fontSize: '13px',
                            color: '#e4e4e7',
                            paddingLeft: '20px',
                            lineHeight: '1.6',
                            margin: '0',
                        }}
                    >
                        <li>Maior número de acertos em placares exatos.</li>
                        <li>Quem fez o palpite primeiro.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ModalRegras;
