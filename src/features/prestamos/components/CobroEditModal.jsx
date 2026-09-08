import React from 'react';
import { Save, Percent } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { CobroFormBody } from '../../cobros/components/CobroFormBody';
import { useCobroEditForm } from '../hooks/useCobroEditForm';
import { showToast } from '../../../components/ui/Toast';

export function CobroEditModal({ cobro, prestamo, onClose, onSaved }) {
  const form = useCobroEditForm({ cobro, prestamo });

  async function handleSave() {
    const res = await form.submit();
    if (res.ok) {
      showToast('Cobro actualizado correctamente', 'success');
      onSaved?.(res.cobro);
    } else {
      showToast(res.error || 'Error al actualizar cobro', 'error');
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Editar último cobro"
      description="Solo el cobro más reciente puede editarse. El préstamo y las cuotas se recalculan automáticamente."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={Boolean(form.error) || form.submitting}
            loading={form.submitting}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <CobroFormBody form={form} />
      <div className="mt-5">
        <Input
          type="text"
          name="comision"
          size="md"
          label="Tu comisión (% extra, opcional)"
          hint="Se guarda en el préstamo: el cliente paga tasa + comisión"
          icon={Percent}
          trailing={<Percent className="h-4 w-4 text-neutral-400 dark:text-navy-300" aria-hidden="true" />}
          inputMode="decimal"
          value={form.comision ?? ''}
          onChange={(e) => form.setComision(e.target.value)}
          placeholder="0 = sin comisión"
        />
      </div>
    </ModalShell>
  );
}
