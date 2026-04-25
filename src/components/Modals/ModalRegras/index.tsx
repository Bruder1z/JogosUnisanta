import { type FC } from 'react';
import ModalShell from '../ModalShell';
import './ModalRegras.css';
import type { ModalRegrasProps } from './types';

const ModalRegras: FC<ModalRegrasProps> = ({ aberto, setAberto }) => {
  if (!aberto) return null;

  return (
    <ModalShell
      isOpen={aberto}
      onClose={() => setAberto(false)}
      overlayClassName="modalRegrasOverlay"
      backdropClassName="modalRegrasBackdrop"
      cardClassName="modalRegrasCard"
      closeButtonClassName="modalRegrasCloseButton"
      closeButtonLabel="Fechar regras"
    >
      <h2 className="modalRegrasTitle">Regras do Palpitômetro</h2>

      <p className="modalRegrasText">
        Você ganha <strong>3 pontos</strong> se acertar o placar exato da partida e <strong>1 ponto</strong> se acertar a equipe vencedora.
      </p>

      <div>
        <p className="modalRegrasSectionText">
          Os critérios de desempate utilizados no Palpitômetro são:
        </p>
        <ul className="modalRegrasList">
          <li>Maior número de acertos em placares exatos.</li>
          <li>Quem fez o palpite primeiro.</li>
        </ul>
      </div>
    </ModalShell>
  );
};

export default ModalRegras;