import React from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Wallet,
  TrendingUp,
  Banknote,
  Calendar,
  Receipt,
  ArrowDownCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { IconBox } from '../../../components/ui/IconBox';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
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
import { DeletePrestamoConfirm } from './DeletePrestamoConfirm';
import { PrestamoEditModal } from './PrestamoEditModal';

const STATUS_META = {
  vigente: { tone: 'success', label: 'Vigente' },
  atrasado: { tone: 'danger', label: 'Atrasado' },
  cancelado: { tone: 'neutral', label: 'Cancelado' },
};

const COBRO_TIPO_META = {
  interes: { label: 'Interés', tone: 'gold', iconTone: 'gold' },
  capital: { label: 'Capital', tone: 'emerald', iconTone: 'emerald' },
};

export function PrestamoDetalle({ onNavigate, params }) {
  const prestamoId = params?.prestamoId;
  const [prestamo, setPrestamo] = useState(null);
  const [cobros, setCobros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extenderOpen, setExtenderOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cliente, setCliente] = useState(null);

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
    return () => {
      cancelled = true;
    };
  }, [prestamoId]);

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!prestamo) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-neutral-600 dark:text-navy-300">Préstamo no encontrado.</p>
        <Button variant="primary" onClick={() => onNavigate?.('clientes', {})}>
          Volver a Clientes
        </Button>
      </div>
    );
  }

  const status = getStatus(prestamo);
  const meta = STATUS_META[status];
  const resumen = getResumenPrestamo(prestamo) || {
    pagadas: 0,
    total: 0,
    canceladas: 0,
    saldo: 0,
    interes: 0,
    totalPagado: 0,
    proximoCobro: null,
  };
  const labelPeriodoValue = labelPeriodo(prestamo.periodo);
  const clienteNombre = cliente?.nombre?.split(' ')[0] || 'cliente';

  async function handleEditSaved(updated) {
    setEditOpen(false);
    setPrestamo(updated);
    showToast('Préstamo actualizado', 'success');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await prestamosService.remove(prestamo.id);
      setDeleteOpen(false);
      showToast('Préstamo eliminado', 'success');
      onNavigate?.('cliente-detalle', { clienteId: prestamo.clienteId });
    } catch (err) {
      setDeleting(false);
      showToast(err.message || 'Error al eliminar', 'error');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <Button
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onClick={() => onNavigate?.('cliente-detalle', { clienteId: prestamo.clienteId })}
        className="!w-fit"
      >
        Volver al cliente
      </Button>

      <Card className="relative overflow-hidden p-0">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl dark:bg-gold-500/10" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-card bg-gold-gradient text-navy-900 shadow-glow">
                <Wallet className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tabular-nums text-navy-900 sm:text-2xl dark:text-white">
                    {formatCRC(prestamo.monto)}
                  </h1>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
                  {prestamo.ruta} · {labelPeriodoValue} · {prestamo.tasa}% por cuota
                </p>
              </div>
            </div>
            {prestamo.estado !== 'cancelado' && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Pencil}
                  onClick={() => setEditOpen(true)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setDeleteOpen(true)}
                >
                  Eliminar
                </Button>
              </div>
            )}
          </div>
          {cliente && (
            <button
              type="button"
              onClick={() => onNavigate?.('cliente-detalle', { clienteId: cliente.id })}
              className="mt-4 flex items-center gap-3 rounded-input bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-navy-700/50 dark:hover:bg-navy-700"
            >
              <Avatar nombre={cliente.nombre} size="sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">{cliente.nombre}</p>
                <p className="text-xs text-neutral-500 dark:text-navy-300">{cliente.cedula}</p>
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
        <Button
          variant="primary"
          size="lg"
          icon={Plus}
          fullWidth
          onClick={() =>
            onNavigate?.('cobro', { prestamoId: prestamo.id, clienteId: prestamo.clienteId })
          }
        >
          Registrar cobro
        </Button>
      )}

      {cuotasAgotadas(prestamo) && (
        <Alert tone="warning" title="Cuotas agotadas">
          <p>
            Todas las cuotas del préstamo están cerradas pero aún queda saldo pendiente de{' '}
            <strong className="tabular-nums">
              {formatCRC(prestamosService.getSaldoCapital(prestamo))}
            </strong>
            . No se puede dar por cancelado hasta pagar el capital completo.
          </p>
          <p>Extendé las cuotas para continuar cobrando intereses, o pagá el capital completo.</p>
          <Button
            variant="warning"
            size="md"
            icon={Plus}
            onClick={() => setExtenderOpen(true)}
            className="!mt-1"
          >
            Extender cuotas
          </Button>
        </Alert>
      )}

      <section className="space-y-2">
        <h2 className="section-label">Calendario de cuotas</h2>
        <PrestamoCalendar
          cuotas={prestamo.cuotas || []}
          total={
            resumen.totalPagado +
            (prestamo.cuotas || [])
              .filter((c) => c.estado === 'pendiente')
              .reduce((s, c) => s + c.monto, 0)
          }
        />
      </section>

      <section className="space-y-2">
        <h2 className="section-label">Historial de cobros ({cobros.length})</h2>
        {cobros.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aún no hay cobros registrados"
            description='Tocá "Registrar cobro" para empezar.'
          />
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-navy-700/60">
            {cobros.map((c) => {
              const tipoMeta = COBRO_TIPO_META[c.tipo] || COBRO_TIPO_META.interes;
              return (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <IconBox icon={ArrowDownCircle} tone={tipoMeta.iconTone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white">
                        {formatCRC(c.monto)}
                      </p>
                      <Badge tone={tipoMeta.tone}>{tipoMeta.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-navy-300">
                      Cuota #{c.cuota_numero} · {formatDateTime(c.fecha)}
                    </p>
                    {c.nota && (
                      <p className="mt-1 text-xs text-neutral-600 dark:text-navy-300">
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
          onSaved={() => setExtenderOpen(false)}
        />
      )}

      {editOpen && (
        <PrestamoEditModal
          prestamo={prestamo}
          onClose={() => setEditOpen(false)}
          onSaved={handleEditSaved}
        />
      )}

      {deleteOpen && (
        <DeletePrestamoConfirm
          prestamo={{ ...prestamo, nombre_cliente: clienteNombre }}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, sub, tone }) {
  const toneMap = { navy: 'navy', gold: 'gold', emerald: 'emerald', sky: 'sky', rose: 'rose' };
  return (
    <Card padding="sm" hover>
      <div className="flex items-start gap-3">
        <IconBox icon={Icon} tone={toneMap[tone] || 'gold'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="section-label">{label}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white sm:text-lg">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-navy-300">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default PrestamoDetalle;
