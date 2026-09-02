import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, MapPin, Phone, IdCard, Wallet, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { formatPhoneCR } from '../../../lib/format';
import { colorFor } from '../../../lib/color';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import { showToast } from '../../../components/ui/Toast';
import * as clientesService from '../../../services/clientes';
import * as prestamosService from '../../../services/prestamos';
import { PrestamoCard } from '../../prestamos/components/PrestamoCard';
import { PrestamoEditModal } from '../../prestamos/components/PrestamoEditModal';
import { DeletePrestamoConfirm } from '../../prestamos/components/DeletePrestamoConfirm';
import { usePrestamosCliente } from '../../prestamos/hooks/usePrestamosCliente';
import { statsCliente } from '../../../lib/resumen';

export function ClienteDetalle({ onNavigate, params }) {
  const clienteId = params?.clienteId;
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const prestamos = usePrestamosCliente(clienteId);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const c = await clientesService.getById(clienteId);
        if (!cancelled) {
          setCliente(c);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clienteId]);

  useDataChange(() => {
    clientesService.getById(clienteId).then(setCliente);
  });

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-navy-300">
          Cliente no encontrado.
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.('clientes')}
          className="rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-900 shadow-glow"
        >
          Volver a Clientes
        </button>
      </div>
    );
  }

  const stats = statsCliente(clienteId);

  function handleOpenPrestamo(p) {
    onNavigate?.('prestamo-detalle', { prestamoId: p.id, clienteId });
  }

  function handleEditPrestamo(p) {
    setEditTarget(p);
  }

  function handleDeletePrestamo(p) {
    setDeleteTarget(p);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await prestamosService.remove(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Préstamo eliminado', 'success');
    } catch (err) {
      showToast(err.message || 'Error al eliminar el préstamo', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 sm:gap-6">
      <button
        type="button"
        onClick={() => onNavigate?.('clientes')}
        className={clsx(
          'inline-flex w-fit items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
          'text-navy-700 hover:bg-slate-100',
          'dark:text-navy-100 dark:hover:bg-navy-800',
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Clientes
      </button>

      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl dark:bg-gold-500/10" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colorFor(clienteId), color: '#fff' }}
              >
                <span className="text-base font-bold">
                  {cliente.nombre
                    .split(' ')
                    .map((s) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
                  {cliente.nombre}
                </h1>
                <p className="text-sm text-slate-600 dark:text-navy-300">{cliente.cedula}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-navy-700/50">
              <Phone className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
              <span className="text-sm text-navy-900 dark:text-white">{formatPhoneCR(cliente.telefono)}</span>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-navy-700/50">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
              <span className="text-sm text-navy-900 dark:text-white">{cliente.direccion}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile icon={Wallet} label="Préstamos" value={stats.total} tone="navy" />
        <StatTile
          icon={TrendingUp}
          label="Vigentes"
          value={stats.vigentes}
          tone="emerald"
        />
        <StatTile
          icon={AlertTriangle}
          label="Atrasados"
          value={stats.atrasados}
          tone={stats.atrasados > 0 ? 'rose' : 'slate'}
        />
      </div>

      <button
        type="button"
        onClick={() => onNavigate?.('registrar-prestamo', { clienteId })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-4 py-3.5 text-sm font-bold text-navy-900 shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] sm:text-base"
      >
        <Plus className="h-5 w-5" />
        Registrar préstamo
      </button>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
          Préstamos del cliente
        </h2>
        {prestamos.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <Wallet className="h-6 w-6 text-slate-400 dark:text-navy-300" />
            <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
              Este cliente aún no tiene préstamos
            </p>
            <p className="text-xs text-slate-500 dark:text-navy-300">
              Tocá "Registrar préstamo" para crear el primero.
            </p>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {prestamos.map((p) => (
              <li key={p.id} className="animate-fade-in">
                <PrestamoCard
                  prestamo={p}
                  onOpen={handleOpenPrestamo}
                  onEdit={handleEditPrestamo}
                  onDelete={handleDeletePrestamo}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editTarget && (
        <PrestamoEditModal
          prestamo={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeletePrestamoConfirm
          prestamo={{ ...deleteTarget, nombre_cliente: cliente.nombre.split(' ')[0] || 'cliente' }}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    slate: 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300',
  };
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            {label}
          </p>
          <p className="text-xl font-bold tabular-nums text-navy-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default ClienteDetalle;
