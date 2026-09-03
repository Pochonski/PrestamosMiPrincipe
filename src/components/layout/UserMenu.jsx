import React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../features/auth/useAuth';
import { Avatar } from '../ui/Avatar';

export function UserMenu({ className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const menuId = useId();

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
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={clsx(
          'flex items-center gap-2 rounded-input py-1 pl-1 pr-2 transition-colors',
          'border border-transparent hover:border-slate-200 hover:bg-white',
          'dark:hover:border-navy-700 dark:hover:bg-navy-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        )}
      >
        <Avatar nombre={name} size="sm" />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-xs font-semibold text-navy-900 dark:text-white">{name}</p>
          <p className="max-w-[140px] truncate text-[10px] font-medium text-neutral-500 dark:text-navy-300">
            {email}
          </p>
        </div>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={clsx(
            'absolute right-0 z-40 mt-2 w-60 origin-top-right rounded-card p-1.5',
            'border border-slate-100 bg-white shadow-cardHover',
            'dark:border-navy-700 dark:bg-navy-800',
            'animate-fade-in',
          )}
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-navy-700">
            <p className="flex items-center gap-2 text-xs text-neutral-500 dark:text-navy-300">
              <User className="h-3 w-3" aria-hidden="true" />
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
            className={clsx(
              'mt-1 flex w-full items-center gap-3 rounded-input px-3 py-2 text-sm font-semibold transition-colors',
              'text-danger-600 hover:bg-danger-50',
              'dark:text-danger-500 dark:hover:bg-danger-500/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
