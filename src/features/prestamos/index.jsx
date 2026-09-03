import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Save, Search, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { ModalShell } from '../../components/ui/ModalShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Avatar } from '../../components/ui/Avatar';
import { IconBox } from '../../components/ui/IconBox';
import { Step1RutaPeriodo } from './components/steps/Step1RutaPeriodo';
import { Step2Monto } from './components/steps/Step2Monto';
import { Step3CuotasTasa } from './components/steps/Step3CuotasTasa';
import { Step4Fechas } from './components/steps/Step4Fechas';
import { Step5Resumen } from './components/steps/Step5Resumen';
import { usePrestamoForm } from './hooks/usePrestamoForm';
import { useAuth } from '../auth/useAuth';
import * as clientesService from '../../services/clientes';

const STEPS = [
  { num: 1, label: 'Ruta y período' },
  { num: 2, label: 'Monto' },
  { num: 3, label: 'Cuotas y tasa' },
  { num: 4, label: 'Fechas' },
  { num: 5, label: 'Resumen' },
];

export function PrestamoCreatePage({ onNavigate, params }) {
  const initialClienteId = params?.clienteId || null;
  const [clienteId, setClienteId] = useState(initialClienteId);
  const handleClosePicker = useCallback(() => onNavigate?.('clientes', {}), [onNavigate]);

  if (!clienteId) {
    return <ClientPicker onPick={setClienteId} onClose={handleClosePicker} />;
  }

  return <PrestamoForm clienteId={clienteId} onNavigate={onNavigate} />;
}

function ClientPicker({ onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    clientesService.buscar(query).then((r) => {
      if (!cancelled) setClientes(r);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Elegí un cliente"
      description="Buscá el cliente al que le vas a registrar el préstamo."
      size="md"
    >
      <div className="space-y-4">
        <Input
          name="cliente-search"
          placeholder="Buscar cliente por nombre o cédula..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={Search}
          autoFocus
        />
        <div className="max-h-[55vh] -mx-1 overflow-y-auto px-1 scrollbar-thin">
          {clientes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IconBox icon={UserPlus} tone="neutral" size="lg" ring />
              <p className="text-sm font-semibold text-navy-700 dark:text-navy-100">Sin clientes</p>
              <p className="text-xs text-neutral-500 dark:text-navy-300">
                Primero creá un cliente para poder registrar un préstamo.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {clientes.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick?.(c.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-left transition-colors',
                      'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                      'dark:hover:bg-navy-700',
                    )}
                  >
                    <Avatar nombre={c.nombre} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                        {c.nombre}
                      </p>
                      <p className="truncate text-xs text-neutral-500 dark:text-navy-300">{c.cedula}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function PrestamoForm({ clienteId, onNavigate }) {
  const form = usePrestamoForm({ clienteId });
  const { user } = useAuth();
  const [cliente, setCliente] = useState(null);
  const handleClose = useCallback(() => onNavigate?.('cliente-detalle', { clienteId }), [onNavigate, clienteId]);

  useEffect(() => {
    let cancelled = false;
    clientesService.getById(clienteId).then((c) => {
      if (!cancelled) setCliente(c);
    });
    return () => {
      cancelled = true;
    };
  }, [clienteId]);

  async function handleSave() {
    const res = await form.submit(user?.id);
    if (res.ok) {
      onNavigate?.('cliente-detalle', { clienteId });
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
            Guardar préstamo
          </Button>
        )}
      </div>
    </>
  );

  return (
    <ModalShell
      open
      onClose={handleClose}
      title="Nuevo préstamo"
      description={cliente ? `Para ${cliente.nombre}` : null}
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
          {form.step === 5 && <Step5Resumen values={form.values} cliente={cliente} />}
        </div>
      </div>
    </ModalShell>
  );
}

export default PrestamoCreatePage;
