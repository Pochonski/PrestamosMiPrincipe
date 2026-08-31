import { useCallback, useMemo, useState } from 'react';
import {
  validateRuta,
  validatePeriodo,
  validateMonto,
  validateNCoutas,
  validateTasa,
  validateFechaInicio,
  buildInitialPrestamo,
} from '../selectors';
import { formatMontoLive } from '../../../lib/format';
import * as prestamosService from '../../../services/prestamos';

const STEP_FIELDS = {
  1: ['ruta', 'periodo'],
  2: ['monto'],
  3: ['nCuotas', 'tasa'],
  4: ['fechaInicio'],
  5: [],
};

export function usePrestamoForm({ clienteId } = {}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => buildInitialPrestamo(clienteId));
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const ruta = validateRuta(values.ruta);
    const periodo = validatePeriodo(values.periodo);
    const monto = validateMonto(values.monto);
    const nCuotas = validateNCoutas(values.nCuotas);
    const tasa = validateTasa(values.tasa);
    const fechaInicio = validateFechaInicio(values.fechaInicio);
    return { ruta, periodo, monto, nCuotas, tasa, fechaInicio };
  }, [values]);

  const stepErrors = useMemo(() => {
    const out = {};
    for (const f of STEP_FIELDS[step]) out[f] = errors[f];
    return out;
  }, [errors, step]);

  const stepIsValid = !Object.values(stepErrors).some(Boolean);
  const allValid = !Object.values(errors).some(Boolean);

  const showError = (field) => Boolean(touched[field] && errors[field]);

  const set = useCallback((field, value) => {
    setValues((v) => {
      if (field === 'monto') return { ...v, monto: formatMontoLive(value) };
      if (field === 'periodo') return { ...v, periodo: value };
      if (field === 'nCuotas') {
        const digits = String(value).replace(/\D/g, '').slice(0, 3);
        return { ...v, nCuotas: digits };
      }
      if (field === 'tasa') {
        let t = String(value).replace(/[^0-9.]/g, '');
        const parts = t.split('.');
        if (parts.length > 1) t = parts[0] + '.' + parts.slice(1).join('').slice(0, 2);
        return { ...v, tasa: t };
      }
      return { ...v, [field]: value };
    });
  }, []);

  const touch = useCallback((field) => {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }, []);

  function touchStep(stepNum) {
    setTouched((t) => {
      const next = { ...t };
      for (const f of STEP_FIELDS[stepNum]) next[f] = true;
      return next;
    });
  }

  function nextStep() {
    if (!stepIsValid) {
      touchStep(step);
      return false;
    }
    setStep((s) => Math.min(5, s + 1));
    return true;
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  function goToStep(target) {
    if (target < step) {
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      const fields = STEP_FIELDS[i];
      const hasAny = fields.some((f) => errors[f]);
      if (hasAny) {
        touchStep(i);
        setStep(i);
        return;
      }
    }
    setStep(target);
  }

  function submit(creadoPor) {
    if (!allValid) {
      setTouched({
        ruta: true,
        periodo: true,
        monto: true,
        nCuotas: true,
        tasa: true,
        fechaInicio: true,
      });
      return { ok: false, error: 'Datos inválidos', errors };
    }
    setSubmitting(true);
    try {
      const prestamo = prestamosService.create({
        clienteId,
        ruta: values.ruta,
        periodo: values.periodo,
        monto: Number(String(values.monto).replace(/\D/g, '')),
        tasa: Number(values.tasa),
        nCuotas: Number(values.nCuotas),
        fechaInicio: values.fechaInicio,
        creadoPor,
      });
      return { ok: true, prestamo };
    } catch (err) {
      return { ok: false, error: err.message || 'Error al guardar' };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    step,
    values,
    errors,
    stepErrors,
    stepIsValid,
    allValid,
    submitting,
    showError,
    set,
    touch,
    nextStep,
    prevStep,
    goToStep,
    submit,
  };
}