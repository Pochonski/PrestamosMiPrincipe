import { useState } from 'react';
import { ArrowLeft, Plus, MapPin, Phone, IdCard, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { formatPhoneCR } from '../../../lib/format';
import { colorFor } from '../../../lib/color';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import * as clientesService from '../../../services/clientes';
import { PrestamoCard } from '../../prestamos/components/PrestamoCard';
import { usePrestamosCliente } from '../../prestamos/hooks/usePrestamosCliente';
import { statsCliente } from '../../../lib/resumen';

export function ClienteDetalle({ onNavigate, params }) {
  const clienteId = params?.clienteId;
  const [cliente, setCliente] = useState(() => clientesService.getById(clienteId));
  const prestamos = usePrestamosCliente(clienteId);

  useDataChange(() => setCliente(clientesService.getById(clienteId)));

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
        <div className="relative flex items-start gap-4">
          <Avatar nombre={cliente.nombre} color={colorFor(cliente.id)} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              {cliente.nombre}
            </h1>
            <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-600 dark:text-navy-300">
              <p className="flex items-center gap-2">
                <IdCard className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
                {cliente.cedula}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
                {formatPhoneCR(cliente.telefono)}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-navy-300" />
                <span>{cliente.direccion}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile
          icon={Wallet}
          label="Préstamos"
          value={stats.total}
          tone="navy"
        />
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-navy-700 dark:text-navy-300">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
              Este cliente aún no tiene préstamos
            </p>
            <p className="text-xs text-slate-500 dark:text-navy-300">
              Toca "Registrar préstamo" para crear el primero.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {prestamos.map((p) => (
              <li key={p.id} className="animate-fade-in">
                <PrestamoCard prestamo={p} onOpen={handleOpenPrestamo} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
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