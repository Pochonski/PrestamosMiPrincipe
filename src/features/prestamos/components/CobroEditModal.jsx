import React from 'react';
import { Save } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
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
    </ModalShell>
  );
}
