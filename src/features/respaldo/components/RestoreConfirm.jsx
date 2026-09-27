import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';

export function RestoreConfirm({ backupDate, onConfirm, onCancel }) {
  let label = 'fecha desconocida';
  if (backupDate) {
    try {
      label = new Date(backupDate).toLocaleString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      label = 'fecha inválida';
    }
  }

  return (
    <ModalShell
      open
      onClose={onCancel}
      tone="danger"
      icon={AlertTriangle}
      title="Restaurar datos"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" icon={RotateCcw} onClick={onConfirm}>
            Restaurar
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600 dark:text-navy-300">
        Vas a fusionar los datos del respaldo del{' '}
        <strong className="text-navy-900 dark:text-white">{label}</strong> con los actuales. Lo que
        borraste después del respaldo <strong>no se borra de nuevo</strong> (es merge, no reemplazo).
      </p>
    </ModalShell>
  );
}
