import { useCallback, useMemo, useState } from 'react';

/**
 * Hook genérico para wizards multi-step.
 *
 * @param {object} opts
 * @param {Array<{ fields: string[], validate: (values) => Record<string,string> }>} opts.steps
 *        - fields: nombres de campos que pertenecen al step
 *        - validate: función que retorna mapa { campo: mensaje } (solo errores)
 * @param {Record<string, (value: string) => string>} [opts.formatters]
 *        - funciones que transforman el input en `set` (ej: formatTelefonoLive)
 * @param {object} [opts.initialValues] - valores iniciales del formulario
 * @param {number} [opts.totalSteps] - si se omite, se calcula como opts.steps.length
 *
 * @returns {{
 *   step: number,
 *   values: object,
 *   errors: object,
 *   touched: Set<string>,
 *   stepIsValid: (n: number) => boolean,
 *   allValid: boolean,
 *   set: (field: string, value: string) => void,
 *   touch: (field: string) => void,
 *   nextStep: () => boolean,
 *   prevStep: () => void,
 *   goToStep: (n: number) => boolean,
 *   setValues: (updater: (prev: object) => object) => void,
 *   reset: () => void,
 * }}
 */
export function useWizardForm({ steps, formatters = {}, initialValues = {}, totalSteps }) {
  const init = initialValues;
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(init);
  const [touched, setTouched] = useState(() => new Set());
  const total = totalSteps ?? steps.length;

  const errors = useMemo(() => {
    const all = {};
    for (const s of steps) {
      const partial = s.validate(values) || {};
      for (const [k, v] of Object.entries(partial)) {
        if (v) all[k] = v;
      }
    }
    return all;
  }, [values, steps]);

  const stepIsValid = useCallback(
    (n) => {
      const fields = steps[n - 1]?.fields || [];
      return fields.every((f) => !errors[f]);
    },
    [steps, errors],
  );

  const allValid = useMemo(
    () => Object.values(errors).every((v) => !v),
    [errors],
  );

  const set = useCallback(
    (field, value) => {
      const formatter = formatters[field];
      const next = formatter ? formatter(value) : value;
      setValues((prev) => ({ ...prev, [field]: next }));
    },
    [formatters],
  );

  const touch = useCallback((field) => {
    setTouched((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const goToStep = useCallback(
    (n) => {
      if (n < 1 || n > total) return false;
      if (n > step) {
        for (let i = step; i < n; i++) {
          if (!stepIsValid(i)) return false;
        }
      }
      setStep(n);
      return true;
    },
    [step, total, stepIsValid],
  );

  const nextStep = useCallback(() => goToStep(step + 1), [goToStep, step]);
  const prevStep = useCallback(() => goToStep(step - 1), [goToStep, step]);

  const reset = useCallback(() => {
    setValues(init);
    setTouched(new Set());
    setStep(1);
  }, [init]);

  return {
    step,
    values,
    errors,
    touched,
    stepIsValid,
    allValid,
    set,
    touch,
    nextStep,
    prevStep,
    goToStep,
    setValues,
    reset,
  };
}
