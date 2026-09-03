import React from 'react';
import { Phone, IdCard } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';

export function Step2Contacto({ values, errors, showError, set, touch }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={Phone} tone="sky" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Contacto</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Teléfono y cédula del cliente.
          </p>
        </div>
      </header>

      <Input
        type="tel"
        name="telefono"
        size="lg"
        label={
          <>
            Teléfono <span className="text-danger-500">*</span>
          </>
        }
        hint="8 dígitos"
        prefix="+506"
        inputMode="numeric"
        pattern="[0-9]{8}"
        maxLength={9}
        value={values.telefono}
        onChange={(e) => set('telefono', e.target.value)}
        onBlur={() => touch('telefono')}
        placeholder="8888-7777"
        autoComplete="tel"
        error={showError('telefono') && errors.telefono}
        className="!pl-[3.5rem]"
      />

      <Input
        type="text"
        name="cedula"
        size="lg"
        label={
          <>
            Cédula <span className="text-danger-500">*</span>
          </>
        }
        hint="Formato: 1-0823-0445"
        icon={IdCard}
        inputMode="numeric"
        maxLength={12}
        value={values.cedula}
        onChange={(e) => set('cedula', e.target.value)}
        onBlur={() => touch('cedula')}
        placeholder="1-0823-0445"
        error={showError('cedula') && errors.cedula}
      />
    </div>
  );
}
