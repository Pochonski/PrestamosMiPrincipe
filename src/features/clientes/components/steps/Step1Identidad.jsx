import React from 'react';
import { User } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">
        <span>
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </span>
        {hint && (
          <span className="text-[10px] font-normal normal-case tracking-normal text-neutral-400 dark:text-navy-300">
            {hint}
          </span>
        )}
      </span>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-500">{error}</p>
      )}
    </label>
  );
}

export function Step1Identidad({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={User} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Identidad</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Nombre completo y dirección del cliente.
          </p>
        </div>
      </header>

      <Input
        type="text"
        name="nombre"
        size="lg"
        label={
          <>
            Nombre completo <span className="text-danger-500">*</span>
          </>
        }
        value={values.nombre}
        onChange={(e) => set('nombre', e.target.value)}
        onBlur={() => touch('nombre')}
        placeholder="Ej: María Solís Rodríguez"
        autoComplete="name"
        error={showError('nombre') && errors.nombre}
      />

      <Input
        as="textarea"
        name="direccion"
        size="lg"
        label={
          <>
            Dirección <span className="text-danger-500">*</span>
          </>
        }
        value={values.direccion}
        onChange={(e) => set('direccion', e.target.value)}
        onBlur={() => touch('direccion')}
        placeholder="Provincia, cantón, distrito y dirección exacta"
        className="!h-auto !py-3"
        rows={3}
        error={showError('direccion') && errors.direccion}
      />
    </div>
  );
}
