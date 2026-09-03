import React from 'react';
import { Plus } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Card } from '../../../components/ui/Card';
import { formatCRC, formatDate } from '../../../lib/format';
import { useExtenderCuotas } from '../hooks/useExtenderCuotas';

export function ExtenderCuotasModal({ prestamo, onClose, onSaved }) {
  const form = useExtenderCuotas({ prestamo });

  async function handleSave() {
    const res = await form.submit();
    if (res.ok) {
      onSaved?.(res.prestamo);
    }
  }

  if (!prestamo) {
    return (
      <ModalShell
        open
        onClose={onClose}
        title="Extender cuotas"
        size="md"
      >
        <Alert tone="danger">
          Préstamo no encontrado
        </Alert>
      </ModalShell>
    );
  }

  const totalInteres = form.preview.reduce((s, c) => s + c.monto, 0);

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Extender cuotas"
      description="Agregá nuevas cuotas para continuar cobrando intereses sobre el saldo pendiente."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleSave}
            disabled={Boolean(form.error)}
            loading={form.submitting}
          >
            Extender cuotas
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <p className="section-label">Cuotas actuales</p>
          <p className="mt-1 text-base font-bold text-navy-900 dark:text-white">
            {(prestamo.cuotas || []).length}{' '}
            {(prestamo.cuotas || []).length === 1 ? 'cuota' : 'cuotas'} cerradas ·{' '}
            {(prestamo.cuotas || []).filter((c) => c.estado === 'pagada').length} pagadas
          </p>
        </div>

        <Input
          type="text"
          name="n-cuotas"
          label={
            <>
              N° de cuotas a agregar <span className="text-danger-500">*</span>
            </>
          }
          hint="1 a 60"
          inputMode="numeric"
          value={form.nCuotas ? String(form.nCuotas) : ''}
          onChange={(e) => form.setN(e.target.value)}
          placeholder="2"
          error={form.error}
        />

        {form.preview.length > 0 && (
          <div className="space-y-2">
            <p className="section-label">Vista previa</p>
            <Card padding="sm">
              <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
                {form.preview.map((c) => (
                  <li
                    key={c.numero}
                    className="flex items-center justify-between gap-2 py-2.5 first:pt-1 last:pb-1"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy-900 dark:text-white">
                        Cuota #{c.numero}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-navy-300">{formatDate(c.fecha)}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                      {formatCRC(c.monto)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-navy-700/60">
                <span className="text-xs font-medium text-neutral-600 dark:text-navy-300">
                  Total en intereses
                </span>
                <span className="text-sm font-bold tabular-nums text-gold-600 dark:text-gold-300">
                  {formatCRC(totalInteres)}
                </span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
