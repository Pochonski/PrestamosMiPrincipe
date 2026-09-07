import React from 'react';
import { Trash2 } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { formatCRC, formatDateTime } from '../../../lib/format';

export function DeleteCobroConfirm({ cobro, loading, onConfirm, onCancel }) {
  const capitalRevertido = cobro?.tipo === 'capital' ? Number(cobro?.capital_pagado ?? 0) : 0;

  return (
    <ModalShell
      open
      onClose={onCancel}
      tone="danger"
      icon={Trash2}
      title="Eliminar último cobro"
      description="Esta acción revierte sus efectos: la cuota vuelve a pendiente y el saldo se restaura. No se puede deshacer."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" icon={Trash2} onClick={onConfirm} loading={loading}>
            Eliminar cobro
          </Button>
        </>
      }
    >
      <div className="rounded-card bg-slate-50 px-4 py-3 dark:bg-navy-700/50">
        <p className="section-label">Cobro</p>
        <p className="mt-1 text-lg font-bold tabular-nums text-navy-900 dark:text-white">
          {formatCRC(cobro?.monto || 0)}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-navy-300">
          {cobro?.tipo === 'capital' ? 'Abono a capital' : 'Pago de interés'} · Cuota #
          {cobro?.cuota_numero ?? cobro?.cuotaNumero} ·{' '}
          {cobro?.fecha ? formatDateTime(cobro.fecha) : '—'}
        </p>
        {capitalRevertido > 0 && (
          <p className="mt-1 text-xs font-medium text-warning-700 dark:text-warning-500">
            Al eliminarlo, el saldo del préstamo aumenta en {formatCRC(capitalRevertido)}.
          </p>
        )}
      </div>
    </ModalShell>
  );
}
