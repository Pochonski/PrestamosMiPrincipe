import React from 'react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatCRC } from '../../../lib/format';

export function DeletePrestamoConfirm({ prestamo, loading, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');

  const expected =
    (prestamo?.nombre_cliente && prestamo.nombre_cliente.split(' ')[0]) ||
    prestamo?.id?.slice(0, 6) ||
    '';
  const matches = expected.length > 0 && confirmText.trim().toLowerCase() === expected.toLowerCase();

  return (
    <ModalShell
      open
      onClose={onCancel}
      tone="danger"
      icon={Trash2}
      title="Eliminar préstamo"
      description="Esta acción no se puede deshacer. Se eliminarán también todas las cuotas pendientes."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={onConfirm}
            disabled={!matches || loading}
            loading={loading}
          >
            Eliminar préstamo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-card bg-slate-50 px-4 py-3 dark:bg-navy-700/50">
          <p className="section-label">Préstamo</p>
          <p className="mt-1 text-sm font-semibold text-navy-900 dark:text-white">
            {prestamo?.ruta || '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">
            Capital: {formatCRC(prestamo?.monto || 0)} · {prestamo?.n_cuotas || prestamo?.nCuotas || 0} cuotas
          </p>
        </div>

        <Input
          name="confirm-delete-prestamo"
          label={
            <>
              Para confirmar, escribí <strong>{expected || 'el id'}</strong>
            </>
          }
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={expected || 'ID del préstamo'}
          autoFocus
        />
      </div>
    </ModalShell>
  );
}
