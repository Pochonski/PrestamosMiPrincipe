import React from 'react';
import clsx from 'clsx';

export function GlassCard({ className, children, ...rest }) {
  return (
    <div
      className={clsx('glass rounded-modal', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
