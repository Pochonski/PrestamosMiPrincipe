import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function ClienteActionsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
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
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-input text-neutral-500 transition-colors',
          'hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        )}
        aria-label="Acciones del cliente"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-input p-1 shadow-cardHover animate-fade-in',
            'border border-slate-100 bg-white',
            'dark:border-navy-700 dark:bg-navy-800',
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
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
        tone === 'danger'
          ? 'text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10'
          : 'text-navy-700 hover:bg-slate-100 dark:text-navy-100 dark:hover:bg-navy-700',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
