import { useState } from 'react';
import { Check, Receipt, AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { CobroTipoPicker } from './CobroTipoPicker';
import { formatCRC, formatDate } from '../../../lib/format';
import * as prestamosService from '../../../services/prestamos';

export function CobroFormBody({ form }) {
  const {
    tipo, setTipo,
    monto, setMonto,
    incluirInteres, setIncluirInteres,
    nota, setNota,
    prestamo, cuotaActual,
    cuotaNumero, setCuotaNumero,
  } = form || {};
  const atrasadas = form?.atrasadas || [];
  const cuotasQueImpidenCapital = form?.cuotasQueImpidenCapital || [];
  const error = form?.error;

  const [showNota, setShowNota] = useState(Boolean(nota));

  if (!prestamo) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertCircle className="h-5 w-5 shrink-0" />
        Préstamo no encontrado
      </div>
    );
  }

  const saldo = prestamosService.getSaldoCapital(prestamo);
  const liquidar = prestamosService.liquidarTotal(prestamo);
  const agotadas = prestamosService.cuotasAgotadas(prestamo);
  const capitalBloqueado =
    tipo === 'capital' && (cuotasQueImpidenCapital.length > 0 || agotadas);

  const cuotasPendientes = prestamo.cuotas.filter((c) => c.estado === 'pendiente');
  const showCuotaSelector = cuotasPendientes.length > 1 && setCuotaNumero && cuotaNumero;

  return (
    <div className="space-y-5">
      {showCuotaSelector && (
        <label className="block">
          <span className="mb-1.5 text-sm font-medium text-navy-700 dark:text-navy-100">
            Cuota a pagar
          </span>
          <select
            value={cuotaNumero}
            onChange={(e) => setCuotaNumero(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-navy-900 outline-none transition-colors focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          >
            {cuotasPendientes.map((c) => {
              const isAtrasada = new Date(c.fecha) < (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
              return (
                <option key={c.numero} value={c.numero}>
                  #{c.numero} · {formatDate(c.fecha)} · {formatCRC(c.monto)}{isAtrasada ? ' · atrasada' : ''}
                </option>
              );
            })}
          </select>
        </label>
      )}

      <CobroTipoPicker value={tipo} onChange={setTipo} />

      {capitalBloqueado && (
        agotadas ? (
          <CuotasAgotadasWarning saldo={saldo} />
        ) : (
          <AtrasadasWarning
            cuotas={cuotasQueImpidenCapital}
            incluirInteres={incluirInteres}
            onSwitchToInteres={() => setTipo('interes')}
          />
        )
      )}

      {tipo === 'interes' && cuotaActual && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
                Cuota #{cuotaActual.numero} · {formatDate(cuotaActual.fecha)}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
                Interés del período
              </p>
              {atrasadas.length > 0 && atrasadas.some((c) => c.numero === cuotaActual.numero) && (
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Esta cuota estaba atrasada.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
                A cobrar
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-navy-900 dark:text-white">
                {formatCRC(Number(String(monto).replace(/\D/g, '')) || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {tipo === 'capital' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-navy-300">
                Saldo pendiente
              </span>
              <span className="text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                {formatCRC(saldo)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-navy-300">
                Liquidar todo (saldo + interés)
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCRC(liquidar)}
              </span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 text-sm font-medium text-navy-700 dark:text-navy-100">
              Monto a abonar <span className="ml-0.5 text-rose-500">*</span>
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-navy-300">
                ₡
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                disabled={capitalBloqueado}
                className={clsx(
                  'w-full rounded-xl border bg-white px-3.5 py-3.5 pl-10 text-2xl font-bold tabular-nums text-navy-900 outline-none transition-colors placeholder:text-slate-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-700 dark:focus:border-gold-400',
                  capitalBloqueado && 'cursor-not-allowed opacity-50',
                  !capitalBloqueado && 'border-slate-200 dark:border-navy-700',
                )}
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </label>

          {!capitalBloqueado && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMonto(String(Math.round(saldo / 2)))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
              >
                Mitad del saldo ({formatCRC(Math.round(saldo / 2))})
              </button>
              <button
                type="button"
                onClick={() => setMonto(String(liquidar))}
                className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1.5 text-xs font-bold text-navy-900 shadow-glow"
              >
                <Check className="h-3.5 w-3.5" />
                Liquidar todo {formatCRC(liquidar)}
              </button>
            </div>
          )}

          <label className={clsx(
            'flex items-start gap-3 rounded-2xl border p-3 transition-colors',
            capitalBloqueado
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-navy-700 dark:bg-navy-800/50'
              : 'cursor-pointer border-slate-200 bg-white hover:border-gold-400 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-gold-400',
          )}>
            <input
              type="checkbox"
              checked={incluirInteres}
              onChange={(e) => setIncluirInteres(e.target.checked)}
              disabled={capitalBloqueado}
              style={{ accentColor: '#D4AF37' }}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-gold-500 focus:ring-gold-400 dark:border-navy-600 dark:bg-navy-700"
            />
            <div>
              <p className="text-sm font-semibold text-navy-900 dark:text-white">
                Incluir interés del período
              </p>
              <p className="text-xs text-slate-500 dark:text-navy-300">
                Suma {cuotaActual ? formatCRC(cuotaActual.monto) : '—'} al cobro y marca la cuota como pagada.
              </p>
            </div>
          </label>
        </div>
      )}

      {tipo === 'interes' && error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <div>
        {!showNota ? (
          <button
            type="button"
            onClick={() => setShowNota(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-700 dark:text-navy-300 dark:hover:text-white"
          >
            <Receipt className="h-3.5 w-3.5" />
            Agregar nota
          </button>
        ) : (
          <label className="block">
            <span className="mb-1.5 text-sm font-medium text-navy-700 dark:text-navy-100">
              Nota (opcional)
            </span>
            <textarea
              rows={2}
              value={nota}
              onChange={(e) => setNota(e.target.value.slice(0, 200))}
              placeholder="Ej: pagó en efectivo"
              maxLength={200}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-colors placeholder:text-slate-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-300 dark:focus:border-gold-400"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400 dark:text-navy-300">
              {nota.length}/200
            </p>
          </label>
        )}
      </div>
    </div>
  );
}

function AtrasadasWarning({ cuotas, incluirInteres, onSwitchToInteres }) {
  const total = cuotas.reduce((s, c) => s + c.monto, 0);
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Intereses atrasados
          </p>
          <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
            No podés abonar a capital hasta pagar {cuotas.length === 1 ? 'el interés atrasado' : `los ${cuotas.length} intereses atrasados`}.
            {incluirInteres
              ? ' Activá "Incluir interés" en la cuota actual o pagá los atrasos abajo.'
              : ''}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {cuotas.map((c) => (
          <li
            key={c.numero}
            className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs dark:bg-navy-900/40"
          >
            <span className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <Calendar className="h-3.5 w-3.5" />
              Cuota #{c.numero} · {formatDate(c.fecha)}
            </span>
            <span className="font-bold tabular-nums text-amber-900 dark:text-amber-200">
              {formatCRC(c.monto)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-amber-300/60 pt-3 dark:border-amber-500/30">
        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
          Total atrasado: <strong className="tabular-nums">{formatCRC(total)}</strong>
        </p>
        <button
          type="button"
          onClick={onSwitchToInteres}
          className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
        >
          Pagar atrasos primero
        </button>
      </div>
    </div>
  );
}

function CuotasAgotadasWarning({ saldo }) {
  return (
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
            <strong className="tabular-nums">{formatCRC(saldo)}</strong>. El préstamo no puede darse por cancelado.
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            Cerrá este formulario y tocá "Extender cuotas" en el detalle del préstamo.
          </p>
        </div>
      </div>
    </div>
  );
}