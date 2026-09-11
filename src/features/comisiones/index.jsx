import React from 'react';
import { useEffect, useState } from 'react';
import { BadgePercent, Check, Percent, Banknote, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBox } from '../../components/ui/IconBox';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { formatCRC, formatDate } from '../../lib/format';
import { useDataChange } from '../../lib/hooks/useDataChange';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';
import * as clientesService from '../../services/clientes';
import { resumenComisiones, resumenAtrasadosComision, tasaBase, tasaComision, validateTasaComision, tuyoDesdePct, pctDesdeTuyo } from './selectors';

export function ComisionesPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [prestamos, setPrestamos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [clientes, setClientes] = useState(new Map());

  async function load() {
    try {
      const [ps, cobros, cls] = await Promise.all([
        prestamosService.listAll(),
        cobrosService.listAll(),
        clientesService.list({ limit: 500, offset: 0 }).catch(() => []),
      ]);
      setPrestamos(ps || []);
      setResumen(resumenComisiones({ prestamos: ps || [], cobros: cobros || [] }));
      setClientes(new Map((cls || []).map((c) => [c.id, c.nombre])));
    } catch {
      // Se mantiene lo último cargado.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useDataChange(() => {
    load();
  });

  if (loading && !resumen) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const r = resumen || { cobrada: 0, acreedorCobrada: 0, porCobrar: 0, total: 0, porPrestamo: [], conComision: 0, sinComision: 0 };
  const porPrestamo = new Map((r.porPrestamo || []).map((row) => [row.prestamoId, row]));
  const atras = resumenAtrasadosComision(prestamos);
  const ordenados = [...prestamos].sort((a, b) => {
    const na = clientes.get(a.cliente_id ?? a.clienteId) || a.ruta || '';
    const nb = clientes.get(b.cliente_id ?? b.clienteId) || b.ruta || '';
    return String(na).localeCompare(String(nb), 'es');
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
          Mis comisiones
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">
          Poné tu porcentaje en cada préstamo. Se acredita al completar cada cuota.
        </p>
      </div>

      <section className="space-y-2">
        <SectionTitle title={`Préstamos (${ordenados.length})`} />
        {ordenados.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title="Sin préstamos"
            description="Cuando crees un préstamo va a aparecer acá para ponerle tu comisión."
          />
        ) : (
          <Card padding="none" className="divide-y divide-slate-100 overflow-hidden dark:divide-white/10">
            {ordenados.map((p) => (
              <PrestamoRow
                key={p.id}
                prestamo={p}
                nombre={clientes.get(p.cliente_id ?? p.clienteId) || p.ruta || 'Préstamo'}
                row={porPrestamo.get(p.id)}
                onNavigate={onNavigate}
                onSaved={load}
              />
            ))}
          </Card>
        )}
        {r.sinComision > 0 && (
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            {r.sinComision} préstamo(s) sin comisión.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <SectionTitle title={`Atrasados (${atras.cantidad})`} />
        {atras.cantidad === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            variant="success"
            title="Sin atrasos"
            description="Ninguna cuota vencida por cobrar."
          />
        ) : (
          <>
            <Card padding="sm" className="glass-glare relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400/80 to-transparent"
              />
              <div className="flex items-center gap-3">
                <IconBox icon={AlertTriangle} tone="gold" size="md" />
                <div className="min-w-0 flex-1">
                  <p className="section-label">Total atrasado con tu suma</p>
                  <p className="mt-0.5 font-display text-xl font-bold tabular-nums tracking-tight text-navy-900 sm:text-2xl dark:text-white">
                    {formatCRC(atras.total)}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-neutral-500 dark:text-navy-300">
                    Base {formatCRC(atras.base)} +{' '}
                    <strong className="font-semibold text-gold-600 dark:text-gold-300">
                      {formatCRC(atras.tuyo)} tuyo
                    </strong>
                  </p>
                </div>
                <Badge tone="danger" icon={AlertTriangle}>
                  {atras.cantidad} {atras.cantidad === 1 ? 'cuota' : 'cuotas'}
                </Badge>
              </div>
            </Card>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {atras.items.map((item) => {
                const pid = item.prestamo.cliente_id ?? item.prestamo.clienteId;
                return (
                  <li key={`${item.prestamo.id}-${item.cuota.numero}`} className="animate-fade-in">
                    <AtrasadoCard
                      item={item}
                      nombre={clientes.get(pid) || item.prestamo.ruta || 'Préstamo'}
                      onCobrar={() => onNavigate?.('cobro', { prestamoId: item.prestamo.id, clienteId: pid })}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function cuotaReferencia(prestamo) {
  const pendientes = (prestamo.cuotas || []).filter((c) => c.estado === 'pendiente');
  if (pendientes.length > 0) {
    return pendientes.sort((a, b) => Number(a.numero) - Number(b.numero))[0];
  }
  const todas = [...(prestamo.cuotas || [])].sort((a, b) => Number(b.numero) - Number(a.numero));
  return todas[0] || null;
}

function PrestamoRow({ prestamo, nombre, row, onNavigate, onSaved }) {
  const base = tasaBase(prestamo);
  const actual = prestamo.tasa_comision;
  const cuota = cuotaReferencia(prestamo);
  const refMonto = cuota ? Number(cuota.monto || 0) : 0;

  const [pct, setPct] = useState(actual != null ? String(actual) : '');
  const [monto, setMonto] = useState(() =>
    actual != null && refMonto > 0 ? String(tuyoDesdePct(refMonto, base, actual)) : '',
  );
  const [ultimo, setUltimo] = useState('pct');
  const [saving, setSaving] = useState(false);
  const [errorPct, setErrorPct] = useState(null);
  const [errorMonto, setErrorMonto] = useState(null);

  useEffect(() => {
    setPct(actual != null ? String(actual) : '');
    setMonto(actual != null && refMonto > 0 ? String(tuyoDesdePct(refMonto, base, actual)) : '');
    setErrorPct(null);
    setErrorMonto(null);
    setUltimo('pct');
  }, [actual, refMonto, base]);

  // Valores efectivos: el último campo editado manda, el otro se deriva.
  const pctDerivado = ultimo === 'monto' && monto !== '' ? pctDesdeTuyo(refMonto, base, monto) : null;
  const pctEfectivo = pctDerivado != null ? pctDerivado : pct === '' ? 0 : Number(pct);
  const tuyoEfectivo =
    ultimo === 'pct' || pctDerivado != null || monto === ''
      ? tuyoDesdePct(refMonto, base, pct === '' ? 0 : Number(pct))
      : Number(monto);
  const pctValido = Number.isFinite(pctEfectivo) && pctEfectivo >= 0;
  const proyectada = refMonto + (Number.isFinite(tuyoEfectivo) ? tuyoEfectivo : 0);

  const normActual = actual == null || actual === '' ? null : Number(actual);
  const normNuevo = pct === '' && monto === '' ? null : pctValido ? pctEfectivo : NaN;
  const dirty = normNuevo !== normActual;

  const montoEditable = refMonto > 0 && base > 0;

  function sanitizePct(v) {
    let t = String(v ?? '').replace(/[^0-9.]/g, '');
    const parts = t.split('.');
    if (parts.length > 1) t = parts[0] + '.' + parts.slice(1).join('').slice(0, 2);
    return t;
  }

  function sanitizeMonto(v) {
    return String(v ?? '').replace(/\D/g, '').slice(0, 9);
  }

  function validar() {
    setErrorPct(null);
    setErrorMonto(null);
    if (ultimo === 'monto' && monto !== '') {
      if (Number(monto) >= refMonto) {
        setErrorMonto('No puede superar la cuota');
        return null;
      }
      if (pctDerivado == null) {
        setErrorMonto('Monto inválido');
        return null;
      }
    }
    const err = validateTasaComision(pct === '' && monto === '' ? '' : (pctValido ? pctEfectivo : NaN), base);
    if (err) {
      setErrorPct(err);
      return null;
    }
    return pct === '' && monto === '' ? null : pctEfectivo;
  }

  async function guardar() {
    const aGuardar = validar();
    if (aGuardar === null && (pct !== '' || monto !== '')) return;
    if (!dirty) return;
    setSaving(true);
    try {
      await prestamosService.update(prestamo.id, {
        tasa_comision: aGuardar,
      });
      showToast('Comisión guardada', 'success');
      onSaved?.();
    } catch (e) {
      setErrorPct(e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onNavigate?.('prestamo-detalle', { prestamoId: prestamo.id, clienteId: prestamo.cliente_id ?? prestamo.clienteId })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        <IconBox icon={BadgePercent} tone={tasaComision(prestamo) > 0 ? 'gold' : 'mono'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{nombre}</p>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Base {base}%{tasaComision(prestamo) > 0 ? ` + comisión ${tasaComision(prestamo)}%` : ' · sin comisión'} · {prestamo.ruta || ''}
          </p>
          {row && (row.cobrada > 0 || row.porCobrar > 0) && (
            <p className="mt-0.5 text-[11px] tabular-nums text-neutral-500 dark:text-navy-300">
              {formatCRC(row.cobrada)} cobrada · +{formatCRC(row.porCobrar)} por cobrar
            </p>
          )}
        </div>
      </button>

      <div className="flex items-start gap-2">
        <Input
          type="text"
          name={`comision-${prestamo.id}`}
          label="Tu %"
          icon={Percent}
          inputMode="decimal"
          value={ultimo === 'monto' && pctDerivado != null ? String(pctDerivado) : pct}
          onChange={(e) => {
            setPct(sanitizePct(e.target.value));
            setUltimo('pct');
            setErrorPct(null);
          }}
          onBlur={() => {
            if (dirty) guardar();
          }}
          placeholder="0"
          error={errorPct}
          wrapperClassName="w-24"
        />
        <Input
          type="text"
          name={`comision-monto-${prestamo.id}`}
          label="Monto ₡"
          icon={Banknote}
          inputMode="numeric"
          value={ultimo === 'pct' && pct !== '' ? String(tuyoDesdePct(refMonto, base, Number(pct))) : monto}
          onChange={(e) => {
            setMonto(sanitizeMonto(e.target.value));
            setUltimo('monto');
            setErrorMonto(null);
          }}
          onBlur={() => {
            if (dirty) guardar();
          }}
          placeholder="₡0"
          error={errorMonto}
          hint={!montoEditable ? 'Sin cuota base' : undefined}
          disabled={!montoEditable}
          wrapperClassName="w-28"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={!dirty || saving}
          aria-label={`Guardar comisión de ${nombre}`}
          className="glass-subtle mt-5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-navy-700 transition-all hover:bg-white/80 disabled:opacity-40 dark:text-glow-gold dark:hover:bg-white/10"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="shrink-0 sm:w-36 sm:text-right">
        <p className="section-label">Cuota proyectada</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
          {cuota ? formatCRC(proyectada) : '—'}
        </p>
        {cuota && pctValido && pctEfectivo > 0 && (
          <p className="text-[11px] tabular-nums text-neutral-500 dark:text-navy-300">
            {formatCRC(refMonto)} + {formatCRC(tuyoEfectivo)} tuyo
          </p>
        )}
      </div>
    </div>
  );
}

function AtrasadoCard({ item, nombre, onCobrar }) {
  const { prestamo, cuota, diasAtraso, base, tuyo, total } = item;
  return (
    <Card interactive onClick={onCobrar} className="glass-glare">
      <div className="flex items-start gap-3">
        <IconBox icon={AlertTriangle} tone="rose" size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">{nombre}</p>
            <Badge tone="danger" icon={AlertTriangle}>
              {diasAtraso}d
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-navy-300">
            Cuota #{cuota.numero} · {prestamo.ruta || 'Sin ruta'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/10 [&>div]:min-w-0">
        <div>
          <p className="section-label">Base</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(base)}
          </p>
        </div>
        <div>
          <p className="section-label">Tuyo</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-gold-600 dark:text-gold-300">
            {formatCRC(tuyo)}
          </p>
        </div>
        <div>
          <p className="section-label">Con tu suma</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(total)}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] tabular-nums text-danger-600 dark:text-danger-500">
        Venció {formatDate(cuota.fecha)}
      </p>
    </Card>
  );
}

export default ComisionesPage;
