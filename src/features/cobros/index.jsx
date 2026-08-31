import { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { CobroFormBody } from './components/CobroFormBody';
import { useCobroForm } from './hooks/useCobroForm';
import * as usuariosService from '../../services/usuarios';
import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import { showToast } from '../../components/ui/Toast';

export function CobroPage({ onNavigate, params }) {
  const prestamoId = params?.prestamoId;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (params?.clienteId) {
          onNavigate?.('cliente-detalle', { clienteId: params.clienteId });
        } else if (prestamoId) {
          onNavigate?.('prestamo-detalle', { prestamoId, clienteId: prestamosService.getById(prestamoId)?.clienteId });
        } else {
          onNavigate?.('clientes', {});
        }
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onNavigate, prestamoId, params]);

  if (!prestamoId) {
    return <PrestamoPickerFlow onNavigate={onNavigate} />;
  }

  return <CobroForm prestamoId={prestamoId} onNavigate={onNavigate} clienteId={params?.clienteId} />;
}

function CobroForm({ prestamoId, onNavigate, clienteId }) {
  const form = useCobroForm({ prestamoId });
  const actual = usuariosService.getActual();
  const prestamo = form.prestamo;
  const cliente = prestamo ? clientesService.getById(prestamo.clienteId) : null;

  function handleSave() {
    const res = form.submit({ cobradorId: actual?.id, cliente });
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
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4',
        'animate-fade-in',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={clsx(
          'flex w-full flex-col bg-white shadow-cardHover sm:max-w-lg sm:rounded-3xl',
          'dark:bg-navy-800',
          'animate-slide-up',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          <button
            type="button"
            onClick={handleClose}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors',
              'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
            )}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">
            Registrar cobro
          </h2>
          <div className="w-9" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <CobroFormBody form={form} />
        </div>

        <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-navy-700 dark:bg-navy-800/95">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={Boolean(form.error) || form.submitting}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              'bg-gold-gradient text-navy-900 shadow-glow',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
            )}
          >
            {form.submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Registrar cobro
          </button>
        </footer>
      </div>
    </div>
  );
}

function PrestamoPickerFlow({ onNavigate }) {
  const [clienteId, setClientId] = useState(null);
  if (!clienteId) {
    return <PickerClientes onPick={setClientId} onClose={() => onNavigate?.('clientes', {})} />;
  }
  return <PickerPrestamos clienteId={clienteId} onPick={(prestamoId) => onNavigate?.('cobro', { prestamoId, clienteId })} onBack={() => setClientId(null)} />;
}

function PickerClientes({ onPick, onClose }) {
  const [query, setQuery] = useState('');
  const clientes = clientesService.buscar(query);
  return (
    <PickerShell title="Elegí un cliente" onClose={onClose} query={query} setQuery={setQuery}>
      {clientes.length === 0 ? (
        <Empty text="Sin clientes" />
      ) : (
        <ul className="space-y-1">
          {clientes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                <PickerAvatar name={c.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{c.nombre}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-navy-300">{c.cedula}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PickerShell>
  );
}

function PickerPrestamos({ clienteId, onPick, onBack }) {
  const prestamos = prestamosService.delCliente(clienteId).filter(
    (p) => p.estado === 'vigente' || p.estado === 'atrasado',
  );
  const cliente = clientesService.getById(clienteId);
  return (
    <PickerShell
      title={`Préstamos de ${cliente?.nombre?.split(' ')[0] || 'cliente'}`}
      onClose={onBack}
      showBack
    >
      {prestamos.length === 0 ? (
        <Empty text="Este cliente no tiene préstamos activos" />
      ) : (
        <ul className="space-y-1">
          {prestamos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-900">
                  <span className="text-xs font-bold">₡</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                    {p.ruta || 'Sin ruta'} · {p.nCuotas} cuotas
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-navy-300">
                    {p.estado === 'atrasado' ? 'Atrasado · ' : 'Vigente · '}capital {p.monto.toLocaleString('es-CR')}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PickerShell>
  );
}

function PickerShell({ title, onClose, query, setQuery, showBack, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-navy-900/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="flex w-full flex-col bg-white shadow-cardHover sm:max-w-md sm:rounded-3xl dark:bg-navy-800 animate-slide-up">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-navy-700">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">{title}</h2>
          <div className="w-9" />
        </header>
        {setQuery && (
          <div className="border-b border-slate-100 px-4 py-3 dark:border-navy-700">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
          </div>
        )}
        <div className="max-h-[60vh] flex-1 overflow-y-auto p-3">{children}</div>
        {showBack && (
          <footer className="border-t border-slate-100 p-3 dark:border-navy-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700"
            >
              Volver
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function PickerAvatar({ name }) {
  const initials = String(name || '').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-navy-700 dark:text-navy-100">
      {initials}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-sm text-slate-500 dark:text-navy-300">{text}</p>
    </div>
  );
}

export default CobroPage;