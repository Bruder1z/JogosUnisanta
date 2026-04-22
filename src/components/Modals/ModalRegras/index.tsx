import { type FC } from 'react';
import { X } from 'lucide-react';
import './styles.css';

interface ModalRegrasProps {
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
}

const ModalRegras: FC<ModalRegrasProps> = ({ aberto, setAberto }) => {
    if (!aberto) return null;

    return (
        <div className="modal-regras-overlay" onClick={() => setAberto(false)}>
            <div className="modal-regras-card" onClick={(event) => event.stopPropagation()}>
                <button
                    onClick={() => setAberto(false)}
                    className="modal-regras-close-btn"
                    title="Fechar"
                >
                    <X size={24} />
                </button>

                <h2 className="modal-regras-title">Regras do Bolão</h2>

                <p className="modal-regras-text">
                    Você ganha <strong>3 pontos</strong> se acertar o placar exato da partida e <strong>1 ponto</strong> se acertar a equipe vencedora.
                </p>

                <div>
                    <p className="modal-regras-deck">
                        Os critérios de desempate utilizados no bolão são:
                    </p>
                    <ul className="modal-regras-list">
                        <li>Maior número de acertos em placares exatos.</li>
                        <li>Quem fez o palpite primeiro.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ModalRegras;