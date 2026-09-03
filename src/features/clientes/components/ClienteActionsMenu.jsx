import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function ClienteActionsMenu({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton
        icon={Pencil}
        label="Editar cliente"
        onClick={onEdit}
        className="text-neutral-500 hover:bg-slate-100 hover:text-navy-700 dark:text-navy-300 dark:hover:bg-navy-700 dark:hover:text-navy-100"
      />
      <ActionButton
        icon={Trash2}
        label="Eliminar cliente"
        onClick={onDelete}
        className="text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10"
      />
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={clsx(
        'flex h-11 w-11 items-center justify-center rounded-input transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}