import { useState } from 'react';
import {
  formatTelefonoLive,
  formatCedulaLive,
  validateAll,
} from '../selectors';
import * as clientesService from '../../../services/clientes';
import { useWizardForm } from '../../../lib/hooks/useWizardForm';

const STEP_FIELDS = {
  1: ['nombre', 'direccion'],
  2: ['telefono', 'cedula'],
  3: [],
};

const FORM_STEPS = [
  { fields: STEP_FIELDS[1], validate: validateAll },
  { fields: STEP_FIELDS[2], validate: validateAll },
  { fields: STEP_FIELDS[3], validate: validateAll },
];

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
  const [submitting, setSubmitting] = useState(false);

  const form = useWizardForm({
    steps: FORM_STEPS,
    formatters: {
      telefono: formatTelefonoLive,
      cedula: formatCedulaLive,
    },
    initialValues: buildInitial(cliente),
    totalSteps: 3,
  });

  const stepErrors = (() => {
    const out = {};
    for (const f of STEP_FIELDS[form.step]) out[f] = form.errors[f];
    return out;
  })();

  const showError = (field) => form.touched.has(field) && form.errors[field];

  function touchStep(stepNum) {
    setValuesTouchedForStep(stepNum, form);
  }

  function nextStep() {
    if (!form.stepIsValid(form.step)) {
      touchStep(form.step);
      return false;
    }
    form.nextStep();
    return true;
  }

  function prevStep() {
    form.prevStep();
  }

  function goToStep(target) {
    if (target < form.step) {
      form.goToStep(target);
      return;
    }
    for (let i = form.step; i < target; i++) {
      if (!form.stepIsValid(i)) {
        touchStep(i);
        return;
      }
    }
    form.goToStep(target);
  }

  async function submit() {
    if (!form.allValid) {
      for (let i = 1; i <= 2; i++) {
        if (!form.stepIsValid(i)) {
          touchStep(i);
          form.goToStep(i);
          return { ok: false, error: 'Datos inválidos', errors: form.errors };
        }
      }
      return { ok: false, error: 'Datos inválidos', errors: form.errors };
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: form.values.nombre,
        direccion: form.values.direccion,
        telefono: form.values.telefono.replace(/\D/g, ''),
        cedula: form.values.cedula,
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
    step: form.step,
    values: form.values,
    errors: form.errors,
    stepErrors,
    stepIsValid: form.stepIsValid(form.step),
    allValid: form.allValid,
    submitting,
    showError,
    set: form.set,
    touch: form.touch,
    nextStep,
    prevStep,
    goToStep,
    submit,
  };
}

function setValuesTouchedForStep(stepNum, form) {
  const fields = STEP_FIELDS[stepNum] || [];
  // setTouched no está expuesto en el contrato del hook por simplicidad;
  // marcamos via touch() cada campo del step. Como touch usa un Set inmutable,
  // necesitamos acceso directo. Para no romper encapsulación, hacemos un hack
  // llamando touch por cada field.
  fields.forEach((f) => form.touch(f));
}