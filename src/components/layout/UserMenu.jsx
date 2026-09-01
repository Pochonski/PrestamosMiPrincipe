import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../features/auth/useAuth';
import { Avatar } from '../ui/Avatar';

export function UserMenu({ className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

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

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const email = user?.email || '';

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
        <Avatar nombre={name} size="sm" />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-xs font-semibold text-navy-900 dark:text-white">{name}</p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-navy-300 truncate max-w-[140px]">
            {email}
          </p>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-2xl p-1.5',
            'bg-white shadow-cardHover border border-slate-100',
            'dark:bg-navy-800 dark:border-navy-700',
            'animate-fade-in',
          )}
        >
          <div className="px-3 py-2">
            <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-navy-300">
              <User className="h-3 w-3" />
              Sesión activa
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-navy-900 dark:text-white">
              {email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}