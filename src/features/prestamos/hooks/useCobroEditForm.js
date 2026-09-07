import { useMemo, useState } from 'react';
import {
  buildResumenCobro,
  validateMontoCobro,
  formatMontoLive,
  getCuotasAtrasadas,
  getCuotasQueImpidenCapital,
} from '../../cobros/selectors';
import * as cobrosService from '../../../services/cobros';

/**
 * Form para EDITAR el último cobro.
 * Trabaja sobre el préstamo REVERTIDO (como si el cobro a editar nunca
 * hubiera existido) para que validaciones y montos sugeridos sean correctos:
 * el `prestamo` que llega del detalle ya trae saldo disminuido y cuota pagada.
 */
export function useCobroEditForm({ cobro, prestamo }) {
  const [tipo, setTipo] = useState(cobro?.tipo || 'interes');
  const [cuotaNumero, setCuotaNumero] = useState(cobro?.cuota_numero ?? cobro?.cuotaNumero ?? 1);
  const [monto, setMontoState] = useState(() => formatMontoLive(String(cobro?.monto ?? '')));
  const [incluirInteres, setIncluirInteres] = useState(
    cobro?.incluir_interes ?? cobro?.incluirInteres ?? true,
  );
  const [nota, setNota] = useState(cobro?.nota || '');
  const [submitting, setSubmitting] = useState(false);

  // Préstamo en estado base: revierte los efectos del cobro que se edita.
  const basePrestamo = useMemo(() => {
    if (!prestamo || !cobro) return prestamo;
    const cuotaNum = cobro.cuota_numero ?? cobro.cuotaNumero;
    const capitalRevertido =
      cobro.tipo === 'capital' ? Number(cobro.capital_pagado ?? 0) : 0;
    const saldoBase = Number(prestamo.saldo_capital ?? 0) + capitalRevertido;
    return {
      ...prestamo,
      saldo_capital: saldoBase,
      estado: prestamo.estado === 'cancelado' && saldoBase > 0 ? 'vigente' : prestamo.estado,
      cuotas: (prestamo.cuotas || []).map((c) =>
        Number(c.numero) === Number(cuotaNum)
          ? { ...c, estado: 'pendiente', pagada_en: null }
          : c,
      ),
    };
  }, [prestamo, cobro]);

  const cuotaActual = useMemo(() => {
    if (!basePrestamo) return null;
    return (basePrestamo.cuotas || []).find((c) => c.numero === Number(cuotaNumero));
  }, [basePrestamo, cuotaNumero]);

  const atrasadas = useMemo(
    () => (basePrestamo ? getCuotasAtrasadas(basePrestamo) : []),
    [basePrestamo],
  );

  const cuotasQueImpidenCapital = useMemo(
    () =>
      basePrestamo
        ? getCuotasQueImpidenCapital(basePrestamo, { cuotaNumero, incluirInteres })
        : [],
    [basePrestamo, cuotaNumero, incluirInteres],
  );

  const error = useMemo(() => {
    if (!basePrestamo) return 'Préstamo no disponible';
    return validateMontoCobro({
      monto,
      tipo,
      prestamo: basePrestamo,
      cuotaNumero,
      incluirInteres,
    });
  }, [monto, tipo, basePrestamo, cuotaNumero, incluirInteres]);

  const resumen = useMemo(() => {
    if (!basePrestamo || !cuotaActual) return null;
    const n = Number(String(monto).replace(/\D/g, '')) || 0;
    return buildResumenCobro({
      prestamo: basePrestamo,
      cuotaNumero,
      monto: n,
      tipo,
      incluirInteres,
      cliente: null,
    });
  }, [basePrestamo, cuotaActual, monto, tipo, incluirInteres, cuotaNumero]);

  function setMonto(value) {
    setMontoState(formatMontoLive(value));
  }

  async function submit() {
    if (error) return { ok: false, error };
    if (!cobro) return { ok: false, error: 'Cobro no encontrado' };
    setSubmitting(true);
    try {
      const n = Number(String(monto).replace(/\D/g, ''));
      const updated = await cobrosService.updateLast(cobro.id, {
        cuotaNumero,
        monto: n,
        tipo,
        incluirInteres: tipo === 'capital' ? incluirInteres : false,
        nota: nota || null,
      });
      return { ok: true, cobro: updated };
    } catch (err) {
      const msg = String(err.message || '').toLowerCase();
      if (msg.includes('monto es menor')) {
        return { ok: false, error: 'El monto no cubre el interés del período' };
      }
      if (msg.includes('not pending')) {
        return { ok: false, error: 'La cuota ya fue cobrada o no existe' };
      }
      if (msg.includes('último cobro') || msg.includes('ultimo cobro')) {
        return { ok: false, error: 'Ya hay un cobro más reciente. Solo se puede editar el último.' };
      }
      return { ok: false, error: err.message || 'Error al actualizar cobro' };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    prestamo: basePrestamo,
    cuotaNumero,
    setCuotaNumero,
    tipo,
    setTipo,
    monto,
    setMonto,
    incluirInteres,
    setIncluirInteres,
    nota,
    setNota,
    cuotaActual,
    atrasadas,
    cuotasQueImpidenCapital,
    error,
    resumen,
    submitting,
    submit,
  };
}
