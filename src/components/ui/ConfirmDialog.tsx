import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const colors = {
    danger: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/10 text-amber-600',
    info: 'bg-primary/10 text-primary',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-4 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1 shadow-2xl"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-6">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border border-border shadow-soft ${colors[variant]}`}
        >
          <AlertTriangle size={36} strokeWidth={2.5} />
        </div>
        <p className="text-muted-foreground leading-relaxed font-bold text-lg px-2 opacity-80">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
