import React from 'react';
import { useState } from 'react';
import { Receipt, AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { CobroTipoPicker } from './CobroTipoPicker';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { IconBox } from '../../../components/ui/IconBox';
import { formatCRC, formatDate } from '../../../lib/format';
import * as prestamosService from '../../../services/prestamos';

export function CobroFormBody({ form }) {
  const {
    tipo,
    setTipo,
    monto,
    setMonto,
    incluirInteres,
    setIncluirInteres,
    aceptaAtrasados,
    setAceptaAtrasados,
    nota,
    setNota,
    prestamo,
    cuotaActual,
    cuotaNumero,
    setCuotaNumero,
  } = form || {};
  const atrasadas = form?.atrasadas || [];
  const cuotasQueImpidenCapital = form?.cuotasQueImpidenCapital || [];
  const error = form?.error;

  const [showNota, setShowNota] = useState(Boolean(nota));

  if (!prestamo) {
    return (
      <Alert tone="danger" icon={AlertCircle}>
        Préstamo no encontrado
      </Alert>
    );
  }

  const saldo = prestamosService.getSaldoCapital(prestamo);
  const liquidar = prestamosService.liquidarTotal(prestamo);
  const agotadas = prestamosService.cuotasAgotadas(prestamo);
  // Solo las cuotas agotadas bloquean el capital. Con intereses atrasados se
  // muestra aviso + checkbox de confirmación (ya no bloquea).
  const capitalBloqueado = tipo === 'capital' && agotadas;
  const hayAtrasadas =
    tipo === 'capital' && cuotasQueImpidenCapital.length > 0 && !agotadas;

  const cuotasPendientes = (prestamo.cuotas || []).filter((c) => c.estado === 'pendiente');
  const showCuotaSelector = cuotasPendientes.length > 1 && setCuotaNumero && cuotaNumero;

  return (
    <div className="space-y-5">
      {showCuotaSelector && (
        <label className="block">
          <span className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">
            Cuota a pagar
          </span>
          <select
            value={cuotaNumero}
            onChange={(e) => setCuotaNumero(Number(e.target.value))}
            className="w-full rounded-input border border-slate-200 bg-white px-3.5 py-3 text-base text-navy-900 outline-none transition-colors focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          >
            {cuotasPendientes.map((c) => {
              const isAtrasada =
                new Date(c.fecha) <
                (() => {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  return d;
                })();
              return (
                <option key={c.numero} value={c.numero}>
                  #{c.numero} · {formatDate(c.fecha)} · {formatCRC(c.monto)}
                  {isAtrasada ? ' · atrasada' : ''}
                </option>
              );
            })}
          </select>
        </label>
      )}

      <CobroTipoPicker value={tipo} onChange={setTipo} />

      {capitalBloqueado && <CuotasAgotadasWarning saldo={saldo} />}

      {hayAtrasadas && (
        <AtrasadasWarning
          cuotas={cuotasQueImpidenCapital}
          incluirInteres={incluirInteres}
          aceptaAtrasados={Boolean(aceptaAtrasados)}
          onAceptaChange={setAceptaAtrasados}
          onSwitchToInteres={() => setTipo('interes')}
        />
      )}

      {tipo === 'interes' && cuotaActual && (
        <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-label">
                Cuota #{cuotaActual.numero} · {formatDate(cuotaActual.fecha)}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
                Interés del período
              </p>
              {atrasadas.length > 0 && atrasadas.some((c) => c.numero === cuotaActual.numero) && (
                <p className="mt-1 text-xs font-medium text-warning-700 dark:text-warning-500">
                  Esta cuota estaba atrasada.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="section-label">A cobrar</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-navy-900 dark:text-white">
                {formatCRC(cuotaActual.monto)}
              </p>
            </div>
          </div>
        </div>
      )}

      {tipo === 'capital' && (
        <div className="space-y-3">
          <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-navy-300">
                Saldo pendiente
              </span>
              <span className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                {formatCRC(saldo)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-navy-300">
                Liquidar todo (saldo + interés)
              </span>
              <span className="text-sm font-bold tabular-nums text-success-600 dark:text-success-500">
                {formatCRC(liquidar)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-neutral-500 dark:text-navy-300">
              Al abonar a capital, las cuotas futuras se recalculan con el saldo restante.
            </p>
          </div>

          <Input
            type="text"
            name="monto"
            size="lg"
            label={
              <>
                Monto a abonar <span className="text-danger-500">*</span>
              </>
            }
            prefix="₡"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
            disabled={capitalBloqueado}
            error={capitalBloqueado ? null : error}
            className={clsx(
              '!text-2xl !font-bold !tabular-nums',
              capitalBloqueado && 'cursor-not-allowed opacity-50',
            )}
          />

          <label
            className={clsx(
              'flex items-start gap-3 rounded-card border p-3 transition-colors',
              capitalBloqueado
                ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-navy-700 dark:bg-navy-800/50'
                : 'cursor-pointer border-slate-200 bg-white hover:border-gold-400 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-gold-400',
            )}
          >
            <input
              type="checkbox"
              checked={incluirInteres}
              onChange={(e) => setIncluirInteres(e.target.checked)}
              disabled={capitalBloqueado}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-gold-500 focus:ring-gold-400 dark:border-navy-600 dark:bg-navy-700"
            />
            <div>
              <p className="text-sm font-semibold text-navy-900 dark:text-white">
                Incluir interés del período
              </p>
              <p className="text-xs text-neutral-500 dark:text-navy-300">
                Suma {cuotaActual ? formatCRC(cuotaActual.monto) : '—'} al cobro y marca la cuota
                como pagada.
              </p>
            </div>
          </label>
        </div>
      )}

      {tipo === 'interes' && error && (
        <p className="text-xs font-medium text-danger-600 dark:text-danger-500">{error}</p>
      )}

      <div>
        {!showNota ? (
          <button
            type="button"
            onClick={() => setShowNota(true)}
            className="inline-flex items-center gap-1.5 rounded-input text-xs font-semibold text-neutral-500 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:text-navy-300 dark:hover:text-white dark:focus-visible:ring-offset-navy-900"
          >
            <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
            Agregar nota
          </button>
        ) : (
          <div>
            <Input
              as="textarea"
              name="nota"
              size="md"
              label="Nota (opcional)"
              value={nota}
              onChange={(e) => setNota(e.target.value.slice(0, 200))}
              placeholder="Ej: pagó en efectivo"
              maxLength={200}
              rows={2}
              className="resize-none"
            />
            <p className="mt-1 text-right text-[10px] text-neutral-400 dark:text-navy-300">
              {nota.length}/200
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AtrasadasWarning({ cuotas, incluirInteres, aceptaAtrasados, onAceptaChange, onSwitchToInteres }) {
  const total = cuotas.reduce((s, c) => s + c.monto, 0);
  return (
    <div className="rounded-card border border-warning-500/40 bg-warning-50 p-4 dark:bg-warning-500/10">
      <div className="flex items-start gap-3">
        <IconBox icon={AlertTriangle} tone="amber" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-warning-700 dark:text-warning-500">
            Intereses atrasados
          </p>
          <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-500">
            Hay{' '}
            {cuotas.length === 1 ? '1 interés atrasado' : `${cuotas.length} intereses atrasados`}{' '}
            por <strong className="tabular-nums">{formatCRC(total)}</strong> que siguen
            pendientes.
            {incluirInteres ? ' Podés abonar a capital igual marcando la casilla de abajo.' : ''}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {cuotas.map((c) => (
          <li
            key={c.numero}
            className="flex items-center justify-between gap-2 rounded-input bg-white/60 px-3 py-2 text-xs dark:bg-navy-900/40"
          >
            <span className="flex items-center gap-2 font-semibold text-warning-700 dark:text-warning-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Cuota #{c.numero} · {formatDate(c.fecha)}
            </span>
            <span className="font-bold tabular-nums text-warning-700 dark:text-warning-500">
              {formatCRC(c.monto)}
            </span>
          </li>
        ))}
      </ul>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-warning-500/30 pt-3">
        <input
          type="checkbox"
          checked={Boolean(aceptaAtrasados)}
          onChange={(e) => onAceptaChange?.(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-warning-500/50 text-warning-600 focus:ring-warning-500"
        />
        <span className="text-xs font-semibold text-warning-700 dark:text-warning-500">
          Entiendo que quedan {formatCRC(total)} en intereses atrasados pendientes y quiero
          abonar a capital igual.
        </span>
      </label>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-warning-700 dark:text-warning-500">
          Total atrasado: <strong className="tabular-nums">{formatCRC(total)}</strong>
        </p>
        <Button
          type="button"
          variant="warning"
          size="sm"
          onClick={onSwitchToInteres}
        >
          Pagar atrasos primero
        </Button>
      </div>
    </div>
  );
}

function CuotasAgotadasWarning({ saldo }) {
  return (
    <div className="rounded-card border border-warning-500/40 bg-warning-50 p-4 dark:bg-warning-500/10">
      <div className="flex items-start gap-3">
        <IconBox icon={AlertTriangle} tone="amber" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-warning-700 dark:text-warning-500">
            Cuotas agotadas
          </p>
          <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-500">
            Todas las cuotas del préstamo están cerradas pero aún queda saldo pendiente de{' '}
            <strong className="tabular-nums">{formatCRC(saldo)}</strong>. El préstamo no puede
            darse por cancelado.
          </p>
          <p className="mt-1 text-xs text-warning-700 dark:text-warning-500">
            Cerrá este formulario y tocá "Extender cuotas" en el detalle del préstamo.
          </p>
        </div>
      </div>
    </div>
  );
}
