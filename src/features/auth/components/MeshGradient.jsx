import React from 'react';
import clsx from 'clsx';

export function MeshGradient({ className }) {
  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold-400/60 opacity-60 blur-3xl animate-mesh-1" />
      <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-navy-800 opacity-50 blur-3xl animate-mesh-2" />
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/40 opacity-30 blur-3xl animate-mesh-3" />
    </div>
  );
}
