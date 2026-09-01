import { useCallback, useMemo, useState } from 'react';
import {
  formatTelefonoLive,
  formatCedulaLive,
  validateAll,
  hasErrors,
  validateNombre,
  validateDireccion,
  validateTelefono,
  validateCedula,
} from '../selectors';
import * as clientesService from '../../../services/clientes';

const STEP_FIELDS = {
  1: ['nombre', 'direccion'],
  2: ['telefono', 'cedula'],
  3: [],
};

function buildInitial(cliente) {
  if (cliente) {
    return {
      nombre: cliente.nombre || '',
      direccion: cliente.direccion || '',
      telefono: formatTelefonoLive(cliente.telefono || ''),
      cedula: cliente.cedula || '',
    };
  }
  return { nombre: '', direccion: '', telefono: '', cedula: '' };
}

export function useClienteForm({ cliente = null } = {}) {
  const isEdit = Boolean(cliente);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => buildInitial(cliente));
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validateAll(values), [values]);
  const stepErrors = useMemo(() => {
    const out = {};
    for (const f of STEP_FIELDS[step]) out[f] = errors[f];
    return out;
  }, [errors, step]);

  const stepIsValid = !hasErrors(stepErrors);
  const allValid = !hasErrors(errors);

  const showError = (field) => touched[field] && errors[field];

  function set(field, value) {
    setValues((v) => {
      let next = value;
      if (field === 'telefono') next = formatTelefonoLive(value);
      else if (field === 'cedula') next = formatCedulaLive(value);
      else next = value;
      return { ...v, [field]: next };
    });
  }

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
    setStep((s) => Math.min(3, s + 1));
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

  function validateStep(stepNum) {
    const out = {};
    for (const f of STEP_FIELDS[stepNum]) {
      if (f === 'nombre') out.nombre = validateNombre(values.nombre);
      if (f === 'direccion') out.direccion = validateDireccion(values.direccion);
      if (f === 'telefono') out.telefono = validateTelefono(values.telefono);
      if (f === 'cedula') out.cedula = validateCedula(values.cedula);
    }
    return out;
  }

  async function submit(userId) {
    if (!allValid) {
      setTouched({ nombre: true, direccion: true, telefono: true, cedula: true });
      for (let i = 1; i <= 2; i++) {
        const e = validateStep(i);
        if (e.nombre || e.direccion || e.telefono || e.cedula) {
          setStep(i);
          return { ok: false, error: 'Datos inválidos', errors };
        }
      }
      return { ok: false, error: 'Datos inválidos', errors };
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: values.nombre,
        direccion: values.direccion,
        telefono: values.telefono.replace(/\D/g, ''),
        cedula: values.cedula,
      };
      const result = isEdit
        ? await clientesService.update(cliente.id, payload)
        : await clientesService.create(payload);
      return { ok: true, cliente: result, clienteId: result.id };
    } catch (err) {
      return { ok: false, error: err.message || 'Error al guardar' };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    isEdit,
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