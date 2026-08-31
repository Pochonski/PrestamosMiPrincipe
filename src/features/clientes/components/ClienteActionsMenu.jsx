import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function ClienteActionsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function fire(fn) {
    setOpen(false);
    fn?.();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors',
          'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
        )}
        aria-label="Acciones del cliente"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-xl p-1 shadow-cardHover animate-fade-in',
            'bg-white border border-slate-100',
            'dark:bg-navy-800 dark:border-navy-700',
          )}
        >
          <MenuItem icon={Pencil} label="Editar" onClick={() => fire(onEdit)} />
          <MenuItem icon={Trash2} label="Eliminar" tone="danger" onClick={() => fire(onDelete)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, tone = 'neutral' }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        tone === 'danger'
          ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
          : 'text-navy-700 hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700',
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}