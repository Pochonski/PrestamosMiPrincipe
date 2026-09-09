import React from 'react';
import clsx from 'clsx';

export function MeshGradient({ className, variant = 'default' }) {
  const isApp = variant === 'app';
  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className={
          isApp
            ? 'absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold-400/40 opacity-40 blur-3xl animate-mesh-1 dark:bg-gold-500/55 dark:opacity-40'
            : 'absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold-400/60 opacity-60 blur-3xl animate-mesh-1'
        }
      />
      <div
        className={
          isApp
            ? 'absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-navy-400/30 opacity-30 blur-3xl animate-mesh-2 dark:bg-info-500/40 dark:opacity-35'
            : 'absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-navy-800 opacity-50 blur-3xl animate-mesh-2'
        }
      />
      <div
        className={
          isApp
            ? 'absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/25 opacity-25 blur-3xl animate-mesh-3 dark:bg-glow-violet/35 dark:opacity-30'
            : 'absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/40 opacity-30 blur-3xl animate-mesh-3'
        }
      />
    </div>
  );
}
