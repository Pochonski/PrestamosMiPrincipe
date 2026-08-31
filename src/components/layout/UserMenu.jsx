import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import * as usuariosService from '../../services/usuarios';
import { Avatar } from '../ui/Avatar';

export function UserMenu({ className }) {
  const [open, setOpen] = useState(false);
  const [actualId, setActualId] = useState(() => usuariosService.getActual()?.id);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onUserChange() {
      setActualId(usuariosService.getActual()?.id);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('pmp:user-changed', onUserChange);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('pmp:user-changed', onUserChange);
    };
  }, []);

  const usuarios = usuariosService.list();
  const actual = usuarios.find((u) => u.id === actualId) || usuarios[0];

  function pick(id) {
    usuariosService.setActual(id);
    setActualId(id);
    setOpen(false);
    window.dispatchEvent(new CustomEvent('pmp:user-changed'));
  }

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 transition-colors',
          'border border-transparent hover:border-slate-200 hover:bg-white',
          'dark:hover:border-navy-700 dark:hover:bg-navy-800',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar nombre={actual?.nombre} color={actual?.color} size="sm" />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-xs font-semibold text-navy-900 dark:text-white">{actual?.nombre}</p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-navy-300">{actual?.rol}</p>
        </div>
        <ChevronDown
          className={clsx(
            'h-4 w-4 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute right-0 z-40 mt-2 w-64 origin-top-right rounded-2xl p-1.5',
            'bg-white shadow-cardHover border border-slate-100',
            'dark:bg-navy-800 dark:border-navy-700',
            'animate-fade-in',
          )}
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
            Cambiar de usuario
          </p>
          {usuarios.map((u) => {
            const selected = u.id === actualId;
            return (
              <button
                key={u.id}
                type="button"
                role="menuitem"
                onClick={() => pick(u.id)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                  selected
                    ? 'bg-gold-50 dark:bg-gold-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-navy-700/60',
                )}
              >
                <Avatar nombre={u.nombre} color={u.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                    {u.nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-navy-300">{u.rol}</p>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-gold-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}