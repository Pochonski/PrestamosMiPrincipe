import React from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import { Stepper } from '../../../components/ui/Stepper';
import { Step1RutaPeriodo } from './steps/Step1RutaPeriodo';
import { Step2Monto } from './steps/Step2Monto';
import { Step3CuotasTasa } from './steps/Step3CuotasTasa';
import { Step4Fechas } from './steps/Step4Fechas';
import { Step5Resumen } from './steps/Step5Resumen';
import { usePrestamoForm } from '../hooks/usePrestamoForm';

const STEPS = [
  { num: 1, label: 'Ruta y período' },
  { num: 2, label: 'Monto' },
  { num: 3, label: 'Cuotas y tasa' },
  { num: 4, label: 'Fechas' },
  { num: 5, label: 'Resumen' },
];

export function PrestamoEditModal({ prestamo, onClose, onSaved }) {
  const form = usePrestamoForm({ initialPrestamo: prestamo });

  async function handleSave() {
    const res = await form.submit();
    if (res.ok) {
      onSaved?.(res.prestamo);
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
        {form.step < 5 ? (
          <Button
            variant="primary"
            iconRight={ArrowRight}
            onClick={form.nextStep}
            disabled={!form.stepIsValid}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={form.submitting}
            disabled={!form.allValid}
          >
            Guardar cambios
          </Button>
        )}
      </div>
    </>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Editar préstamo"
      description="Modificá los datos del préstamo. Se recalculan las cuotas pendientes y se preservan las ya pagadas."
      size="lg"
      footer={footer}
    >
      <div className="space-y-5">
        <div>
          <p className="section-label mb-2">Paso {form.step} de 5</p>
          <Stepper steps={STEPS} current={form.step} onJump={form.goToStep} />
        </div>

        <div className="min-h-[260px]">
          {form.step === 1 && (
            <Step1RutaPeriodo
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 2 && (
            <Step2Monto
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 3 && (
            <Step3CuotasTasa
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 4 && (
            <Step4Fechas
              values={form.values}
              errors={form.errors}
              showError={form.showError}
              set={form.set}
              touch={form.touch}
            />
          )}
          {form.step === 5 && <Step5Resumen values={form.values} cliente={null} />}
        </div>
      </div>
    </ModalShell>
  );
}
