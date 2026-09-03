import React from 'react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';

export function DeleteConfirm({ cliente, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const needsConfirm = cliente?.nombre?.split(' ')[0] || '';
  const isReady = confirmText.trim().toLowerCase() === needsConfirm.toLowerCase();

  return (
    <ModalShell
      open
      onClose={onCancel}
      tone="danger"
      icon={Trash2}
      title="Eliminar cliente"
      description="Esta acción no se puede deshacer. Se eliminarán también todos los cobros asociados."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" icon={Trash2} onClick={onConfirm} disabled={!isReady}>
            Eliminar cliente
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-card bg-slate-50 px-3 py-3 dark:bg-navy-700/50">
          <Avatar nombre={cliente?.nombre} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
              {cliente?.nombre}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-navy-300">{cliente?.cedula}</p>
          </div>
        </div>

        <Input
          name="confirm-delete"
          label={
            <>
              Para confirmar, escribí{' '}
              <strong className="font-bold text-navy-900 dark:text-white">{needsConfirm}</strong>
            </>
          }
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={needsConfirm}
          autoFocus
        />
      </div>
    </ModalShell>
  );
}
