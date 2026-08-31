import { Plus } from 'lucide-react';
import clsx from 'clsx';

export function ClienteFAB({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow sm:bottom-8 lg:right-8',
        'bg-gold-gradient text-navy-900 transition-transform hover:scale-105 active:scale-95',
        'lg:bottom-10',
        className,
      )}
      aria-label="Nuevo cliente"
      title="Nuevo cliente"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}