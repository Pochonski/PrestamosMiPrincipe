import { useMemo, useState } from 'react';
import {
  buildResumenCobro,
  validateMontoCobro,
  formatMontoLive,
  getCuotaActual,
  getCuotasAtrasadas,
  getCuotasQueImpidenCapital,
} from '../selectors';
import * as cobrosService from '../../../services/cobros';
import * as prestamosService from '../../../services/prestamos';
import { useDataChange } from '../../../lib/hooks/useDataChange';

function suggestedMonto(prestamo, cuota, tipo, incluirInteres) {
  if (!prestamo) return 0;
  if (tipo === 'interes') return cuota?.monto || 0;
  if (tipo === 'capital') {
    const saldo = prestamosService.getSaldoCapital(prestamo);
    const interes = cuota?.monto || 0;
    return incluirInteres ? saldo + interes : saldo;
  }
  return 0;
}

export function useCobroForm({ prestamoId }) {
  const [prestamo, setPrestamo] = useState(() => prestamosService.refreshPrestamo(prestamoId));
  const [tipo, setTipo] = useState('interes');
  const [monto, setMontoState] = useState('');
  const [incluirInteres, setIncluirInteres] = useState(true);
  const [nota, setNota] = useState('');
  const [cuotaNumero, setCuotaNumero] = useState(() => getCuotaActual(prestamoId)?.numero || 1);
  const [submitting, setSubmitting] = useState(false);

  useDataChange(() => setPrestamo(prestamosService.refreshPrestamo(prestamoId)));

  const cuotaActual = useMemo(() => {
    if (!prestamo) return null;
    return prestamo.cuotas.find((c) => c.numero === Number(cuotaNumero));
  }, [prestamo, cuotaNumero]);

  const montoSugerido = useMemo(
    () => suggestedMonto(prestamo, cuotaActual, tipo, incluirInteres),
    [prestamo, cuotaActual, tipo, incluirInteres],
  );

  const atrasadas = useMemo(() => getCuotasAtrasadas(prestamo), [prestamo]);

  const cuotasQueImpidenCapital = useMemo(
    () => getCuotasQueImpidenCapital(prestamo, { cuotaNumero, incluirInteres }),
    [prestamo, cuotaNumero, incluirInteres],
  );

  const error = useMemo(() => {
    if (!prestamo) return 'Préstamo no encontrado';
    return validateMontoCobro({
      monto,
      tipo,
      prestamo,
      cuotaNumero,
      incluirInteres,
    });
  }, [monto, tipo, prestamo, cuotaNumero, incluirInteres]);

  const resumen = useMemo(() => {
    if (!prestamo || !cuotaActual) return null;
    const n = Number(String(monto).replace(/\D/g, '')) || 0;
    return buildResumenCobro({
      prestamo,
      cuotaNumero,
      monto: n,
      tipo,
      incluirInteres,
      cliente: null,
    });
  }, [prestamo, cuotaActual, monto, tipo, incluirInteres, cuotaNumero]);

  function setMonto(value) {
    setMontoState(formatMontoLive(value));
  }

  function setTipoValue(t) {
    setTipo(t);
    setMontoState(formatMontoLive(String(suggestedMonto(prestamo, cuotaActual, t, incluirInteres))));
  }

  function setIncluirInteresValue(b) {
    setIncluirInteres(b);
    if (tipo === 'capital') {
      setMontoState(formatMontoLive(String(suggestedMonto(prestamo, cuotaActual, tipo, b))));
    }
  }

  async function submit({ cobradorId, cliente }) {
    if (error) return { ok: false, error };
    if (!prestamo) return { ok: false, error: 'Préstamo no encontrado' };

    setSubmitting(true);
    try {
      const n = Number(String(monto).replace(/\D/g, ''));
      const cobro = await cobrosService.create({
        prestamoId,
        cuotaNumero,
        monto: n,
        tipo,
        incluirInteres: tipo === 'capital' ? incluirInteres : false,
        cobradorId,
        nota: nota || null,
      });
      return { ok: true, cobro, cliente, prestamoId };
    } catch (err) {
      // Mapear errores tipados a mensajes más amigables
      const msg = String(err.message || '').toLowerCase();
      if (msg.includes('monto es menor')) {
        return { ok: false, error: 'El monto no cubre el interés del período' };
      }
      if (msg.includes('not pending')) {
        return { ok: false, error: 'La cuota ya fue cobrada o no existe' };
      }
      if (msg.includes('monto menor')) {
        return { ok: false, error: 'El monto es menor que el interés del período' };
      }
      return { ok: false, error: err.message || 'Error al registrar cobro' };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    prestamo,
    tipo,
    setTipo: setTipoValue,
    monto,
    setMonto,
    incluirInteres,
    setIncluirInteres: setIncluirInteresValue,
    cuotaNumero,
    setCuotaNumero,
    nota,
    setNota,
    cuotaActual,
    montoSugerido,
    atrasadas,
    cuotasQueImpidenCapital,
    error,
    resumen,
    submitting,
    submit,
  };
}