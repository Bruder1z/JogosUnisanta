import { type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './ModalShell.css';

export interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    overlayClassName?: string;
    backdropClassName?: string;
    cardClassName?: string;
    closeButtonClassName?: string;
    showCloseButton?: boolean;
    closeButtonLabel?: string;
}

const ModalShell: FC<ModalShellProps> = ({
    isOpen,
    onClose,
    children,
    overlayClassName,
    backdropClassName,
    cardClassName,
    closeButtonClassName,
    showCloseButton = true,
    closeButtonLabel = 'Fechar modal',
}) => {
    if (!isOpen) return null;

    return (
        <div className={`modalShellOverlay ${overlayClassName || ''}`.trim()}>
            <div className={`modalShellBackdrop ${backdropClassName || ''}`.trim()} onClick={onClose} />
            <div className={`modalShellCard ${cardClassName || ''}`.trim()} onClick={(event) => event.stopPropagation()}>
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className={`modalShellCloseButton ${closeButtonClassName || ''}`.trim()}
                        aria-label={closeButtonLabel}
                    >
                        <X size={20} />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export default ModalShell;