import React from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Stepper } from '../../../components/ui/Stepper';
import { Step1Identidad } from './steps/Step1Identidad';
import { Step2Contacto } from './steps/Step2Contacto';
import { Step3Resumen } from './steps/Step3Resumen';
import { useClienteForm } from '../hooks/useClienteForm';
import { useAuth } from '../../auth/useAuth';
import { showToast } from '../../../components/ui/Toast';

const STEPS = [
  { num: 1, label: 'Identidad' },
  { num: 2, label: 'Contacto' },
  { num: 3, label: 'Resumen' },
];

export function ClienteFormFlow({ cliente, onClose, onSaved }) {
  const form = useClienteForm({ cliente });
  const { user } = useAuth();

  async function handleSave() {
    const res = await form.submit(user?.id);
    if (res.ok) {
      onSaved?.(res.cliente);
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  }

  const footer = (
    <>
      {form.step > 1 ? (
        <Button variant="ghost" icon={ArrowLeft} onClick={form.prevStep}>
          Atrás
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        {form.step < 3 ? (
          <Button
            variant="primary"
            iconRight={ArrowRight}
            onClick={form.nextStep}
            disabled={!form.stepIsValid}
          >
            Siguiente
          </Button>
        ) : (
          <Button variant="primary" icon={Save} onClick={handleSave} loading={form.submitting}>
            {form.isEdit ? 'Guardar cambios' : 'Guardar cliente'}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      title={form.isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      description={form.isEdit ? 'Modificá los datos del cliente.' : 'Empezá cargando los datos básicos.'}
      size="md"
      footer={footer}
    >
      <div className="space-y-5">
        <div>
          <p className="section-label mb-2">Paso {form.step} de 3</p>
          <Stepper steps={STEPS} current={form.step} onJump={form.goToStep} />
        </div>

        <div className="min-h-[260px]">
          {form.step === 1 && (
            <Step1Identidad
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 2 && (
            <Step2Contacto
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 3 && <Step3Resumen values={form.values} />}
        </div>
      </div>
    </ModalShell>
  );
}
