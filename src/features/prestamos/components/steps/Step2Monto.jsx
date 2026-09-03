import React from 'react';
import { useRef } from 'react';
import { Wallet } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { IconBox } from '../../../../components/ui/IconBox';
import { formatCRC, formatMontoLive } from '../../../../lib/format';

function getNextCaret(formatted, digitsBeforeCursor) {
  if (digitsBeforeCursor === 0) return 0;
  if (!formatted) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count += 1;
    if (count === digitsBeforeCursor) return i + 1;
  }
  return formatted.length;
}

export function Step2Monto({ values, errors, showError, set, touch }) {
  const inputRef = useRef(null);
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <IconBox icon={Wallet} tone="gold" size="md" />
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Monto prestado</h2>
          <p className="text-xs text-neutral-500 dark:text-navy-300">
            Capital que el cliente recibe.
          </p>
        </div>
      </header>

      <Input
        ref={inputRef}
        type="text"
        name="monto"
        size="lg"
        label={
          <>
            Capital <span className="text-danger-500">*</span>
          </>
        }
        hint="en colones (₡)"
        prefix="₡"
        inputMode="numeric"
        value={values.monto}
        onChange={(e) => {
          const el = e.target;
          const raw = el.value;
          const cursor = el.selectionStart ?? raw.length;
          const digitsBeforeCursor = raw.slice(0, cursor).replace(/\D/g, '').length;
          const nextFormatted = formatMontoLive(raw);
          const nextCaret = getNextCaret(nextFormatted, digitsBeforeCursor);
          set('monto', raw);
          requestAnimationFrame(() => {
            const input = inputRef.current;
            if (input && document.activeElement === input) {
              try {
                input.setSelectionRange(nextCaret, nextCaret);
              } catch {
                // ignore if not selectable
              }
            }
          });
        }}
        onBlur={() => touch('monto')}
        placeholder="0"
        error={showError('monto') && errors.monto}
        className="!text-2xl !font-bold !tabular-nums"
      />

      <div className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-700/40">
        <p className="text-xs text-neutral-600 dark:text-navy-300">
          El cliente recibe este monto al iniciar el préstamo. Los cobros periódicos son solo por
          intereses (los definís en el siguiente paso).
        </p>
        {values.monto && !errors.monto && (
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 dark:text-white">
            {formatCRC(Number(String(values.monto).replace(/\D/g, '')))}
          </p>
        )}
      </div>
    </div>
  );
}
