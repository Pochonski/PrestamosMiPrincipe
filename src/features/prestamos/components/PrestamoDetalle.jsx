import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Wallet, TrendingUp, Banknote, Calendar, Receipt, ArrowDownCircle, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { formatCRC, formatDate, formatDateTime } from '../../../lib/format';
import { showToast } from '../../../components/ui/Toast';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import * as clientesService from '../../../services/clientes';
import * as cobrosService from '../../../services/cobros';
import * as prestamosService from '../../../services/prestamos';
import { getStatus, cuotasAgotadas } from '../../../services/prestamos';
import { getResumenPrestamo } from '../../../lib/resumen';
import { labelPeriodo } from '../selectors';
import { PrestamoCalendar } from './PrestamoCalendar';
import { ExtenderCuotasModal } from './ExtenderCuotasModal';
import { Badge } from '../../../components/ui/Badge';

const STATUS_META = {
  vigente: { tone: 'success', label: 'Vigente' },
  atrasado: { tone: 'danger', label: 'Atrasado' },
  cancelado: { tone: 'neutral', label: 'Cancelado' },
};

const COBRO_TIPO_META = {
  interes: { label: 'Interés', tone: 'gold' },
  capital: { label: 'Capital', tone: 'emerald' },
};

export function PrestamoDetalle({ onNavigate, params }) {
  const prestamoId = params?.prestamoId;
  const [prestamo, setPrestamo] = useState(null);
  const [cobros, setCobros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extenderOpen, setExtenderOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, cs] = await Promise.all([
          prestamosService.getById(prestamoId),
          cobrosService.delPrestamo(prestamoId),
        ]);
        if (!cancelled) {
          setPrestamo(p);
          setCobros(cs);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [prestamoId]);

  useDataChange(async () => {
    const [p, cs] = await Promise.all([
      prestamosService.getById(prestamoId),
      cobrosService.delPrestamo(prestamoId),
    ]);
    setPrestamo(p);
    setCobros(cs);
  });

  if (loading && !prestamo) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const cliente = prestamo ? clientesService.getById(prestamo.clienteId) : null;

  if (!prestamo) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-navy-300">Préstamo no encontrado.</p>
        <button
          type="button"
          onClick={() => onNavigate?.('clientes', {})}
          className="rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-900 shadow-glow"
        >
          Volver a Clientes
        </button>
      </div>
    );
  }

  const status = getStatus(prestamo);
  const meta = STATUS_META[status];
  const resumen = getResumenPrestamo(prestamo);
  const labelPeriodoValue = labelPeriodo(prestamo.periodo);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 sm:gap-6">
      <button
        type="button"
        onClick={() => onNavigate?.('cliente-detalle', { clienteId: prestamo.clienteId })}
        className="inline-flex w-fit items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al cliente
      </button>

      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl dark:bg-gold-500/10" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient text-navy-900">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tabular-nums text-navy-900 sm:text-2xl dark:text-white">
                    {formatCRC(prestamo.monto)}
                  </h1>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                  {prestamo.ruta} · {labelPeriodoValue} · {prestamo.tasa}% por cuota
                </p>
              </div>
            </div>
          </div>
          {cliente && (
            <button
              type="button"
              onClick={() => onNavigate?.('cliente-detalle', { clienteId: cliente.id })}
              className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-navy-700/50 dark:hover:bg-navy-700"
            >
              <Avatar nombre={cliente.nombre} size="sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">{cliente.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-navy-300">{cliente.cedula}</p>
              </div>
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiTile
          icon={TrendingUp}
          label="Progreso"
          value={`${resumen.pagadas}/${resumen.total}`}
          sub={`${resumen.canceladas} canceladas`}
          tone="navy"
        />
        <KpiTile
          icon={Banknote}
          label="Saldo capital"
          value={formatCRC(resumen.saldo)}
          sub={`Cuota ${formatCRC(resumen.interes)}`}
          tone="gold"
        />
        <KpiTile
          icon={Wallet}
          label="Total pagado"
          value={formatCRC(resumen.totalPagado)}
          sub="incluye capital"
          tone="emerald"
        />
        <KpiTile
          icon={Calendar}
          label="Próx. cobro"
          value={resumen.proximoCobro ? formatDate(resumen.proximoCobro.fecha) : '—'}
          sub={resumen.proximoCobro ? `Cuota #${resumen.proximoCobro.numero}` : 'sin pendientes'}
          tone="sky"
        />
      </div>

      {status !== 'cancelado' && (
        <button
          type="button"
          onClick={() => onNavigate?.('cobro', { prestamoId: prestamo.id, clienteId: prestamo.clienteId })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-4 py-3.5 text-sm font-bold text-navy-900 shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] sm:text-base"
        >
          <Plus className="h-5 w-5" />
          Registrar cobro
        </button>
      )}

      {cuotasAgotadas(prestamo) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Cuotas agotadas
              </p>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                Todas las cuotas del préstamo están cerradas pero aún queda saldo pendiente de{' '}
                <strong className="tabular-nums">{formatCRC(prestamosService.getSaldoCapital(prestamo))}</strong>.
                No se puede dar por cancelado hasta pagar el capital completo.
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                Extendé las cuotas para continuar cobrando intereses, o pagá el capital completo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExtenderOpen(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Extender cuotas
          </button>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
          Calendario de cuotas
        </h2>
        <PrestamoCalendar cuotas={prestamo.cuotas} total={resumen.totalPagado + prestamo.cuotas.filter((c) => c.estado === 'pendiente').reduce((s, c) => s + c.monto, 0)} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
          Historial de cobros ({cobros.length})
        </h2>
        {cobros.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <Receipt className="h-6 w-6 text-slate-400 dark:text-navy-300" />
            <p className="text-sm font-medium text-navy-700 dark:text-navy-100">
              Aún no hay cobros registrados
            </p>
            <p className="text-xs text-slate-500 dark:text-navy-300">
              Tocá "Registrar cobro" para empezar.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-navy-700/60">
            {cobros
              .slice()
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .map((c) => {
                const tipoMeta = COBRO_TIPO_META[c.tipo] || COBRO_TIPO_META.interes;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-4">
                    <div
                      className={clsx(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        c.tipo === 'capital'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-gold-50 text-gold-600 dark:bg-gold-500/10 dark:text-gold-300',
                      )}
                    >
                      <ArrowDownCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-navy-900 dark:text-white">
                          {formatCRC(c.monto)}
                        </p>
                        <Badge tone={tipoMeta.tone}>{tipoMeta.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-navy-300">
                        Cuota #{c.cuotaNumero} · {formatDateTime(c.fecha)}
                      </p>
                      {c.nota && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-navy-300">
                          "{c.nota}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </Card>
        )}
      </section>

      {extenderOpen && (
        <ExtenderCuotasModal
          prestamo={prestamo}
          onClose={() => setExtenderOpen(false)}
          onSaved={() => {
            setExtenderOpen(false);
            showToast(`Cuotas extendidas`, 'success');
          }}
        />
      )}
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100',
    gold: 'bg-gold-50 text-gold-600 dark:bg-gold-500/10 dark:text-gold-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  };
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            {label}
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-navy-900 dark:text-white sm:text-lg">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-navy-300">{sub}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default PrestamoDetalle;