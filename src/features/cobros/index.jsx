import React from 'react';
import { useEffect, useState } from 'react';
import { Save, Search, UserPlus, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { ModalShell } from '../../components/ui/ModalShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { IconBox } from '../../components/ui/IconBox';
import { CobroFormBody } from './components/CobroFormBody';
import { formatCRC } from '../../lib/format';
import { useCobroForm } from './hooks/useCobroForm';
import { useAuth } from '../auth/useAuth';
import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import { showToast } from '../../components/ui/Toast';

export function CobroPage({ onNavigate, params }) {
  const prestamoId = params?.prestamoId;

  if (!prestamoId) {
    return <PrestamoPickerFlow onNavigate={onNavigate} />;
  }

  return (
    <CobroForm
      prestamoId={prestamoId}
      onNavigate={onNavigate}
      clienteId={params?.clienteId}
    />
  );
}

function CobroForm({ prestamoId, onNavigate, clienteId }) {
  const form = useCobroForm({ prestamoId });
  const { user } = useAuth();
  const prestamo = form.prestamo;
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    if (!prestamo) {
      setCliente(null);
      return;
    }
    let cancelled = false;
    clientesService.getById(prestamo.clienteId).then((c) => {
      if (!cancelled) setCliente(c);
    });
    return () => {
      cancelled = true;
    };
  }, [prestamo]);

  async function handleSave() {
    const res = await form.submit({ cobradorId: user?.id, cliente });
    if (res.ok) {
      showToast('Cobro registrado correctamente', 'success');
      if (prestamoId) {
        onNavigate?.('prestamo-detalle', { prestamoId, clienteId: prestamo.clienteId });
      } else if (clienteId) {
        onNavigate?.('cliente-detalle', { clienteId });
      } else {
        onNavigate?.('cobro', {});
      }
    } else {
      showToast(res.error || 'Error al registrar cobro', 'error');
    }
  }

  function handleClose() {
    if (clienteId) {
      onNavigate?.('cliente-detalle', { clienteId });
    } else {
      onNavigate?.('clientes', {});
    }
  }

  return (
    <ModalShell
      open
      onClose={handleClose}
      title="Registrar cobro"
      description={cliente ? `Para ${cliente.nombre}` : null}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={Boolean(form.error) || form.submitting}
            loading={form.submitting}
          >
            Registrar cobro
          </Button>
        </>
      }
    >
      <CobroFormBody form={form} />
    </ModalShell>
  );
}

function PrestamoPickerFlow({ onNavigate }) {
  const [clienteId, setClientId] = useState(null);
  if (!clienteId) {
    return (
      <PickerClientes
        onPick={setClientId}
        onClose={() => onNavigate?.('clientes', {})}
      />
    );
  }
  return (
    <PickerPrestamos
      clienteId={clienteId}
      onPick={(prestamoId) => onNavigate?.('cobro', { prestamoId, clienteId })}
      onBack={() => setClientId(null)}
    />
  );
}

function PickerClientes({ onPick, onClose }) {
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
      description="Buscá el cliente al que le vas a registrar el cobro."
      size="md"
    >
      <div className="space-y-4">
        <Input
          name="picker-cliente-search"
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={Search}
          autoFocus
        />
        <div className="max-h-[55vh] -mx-1 overflow-y-auto px-1 scrollbar-thin">
          {clientes.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-neutral-500 dark:text-navy-300">Sin clientes</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {clientes.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick(c.id)}
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

function PickerPrestamos({ clienteId, onPick, onBack }) {
  const [prestamos, setPrestamos] = useState([]);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      clientesService.getById(clienteId),
      prestamosService.delCliente(clienteId),
    ]).then(([c, all]) => {
      if (cancelled) return;
      setCliente(c);
      setPrestamos((all || []).filter((p) => p.estado === 'vigente' || p.estado === 'atrasado'));
    });
    return () => {
      cancelled = true;
    };
  }, [clienteId]);

  return (
    <ModalShell
      open
      onClose={onBack}
      title={`Préstamos de ${cliente?.nombre?.split(' ')[0] || 'cliente'}`}
      size="md"
      footer={
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
          Volver
        </Button>
      }
    >
      <div className="max-h-[55vh] -mx-1 overflow-y-auto px-1 scrollbar-thin">
        {prestamos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IconBox icon={UserPlus} tone="neutral" size="lg" ring />
            <p className="text-sm text-neutral-500 dark:text-navy-300">
              Este cliente no tiene préstamos activos
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {prestamos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-left transition-colors',
                    'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                    'dark:hover:bg-navy-700',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-gold-gradient text-navy-900 shadow-glow">
                    <span className="text-xs font-bold">₡</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                      {p.ruta || 'Sin ruta'} · {p.nCuotas} cuotas
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-navy-300">
                      {p.estado === 'atrasado' ? 'Atrasado · ' : 'Vigente · '}capital{' '}
                      {formatCRC(p.monto)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

export default CobroPage;
