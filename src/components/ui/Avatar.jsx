import React from 'react';
import { memo, useMemo } from 'react';
import clsx from 'clsx';

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isLightColor(hex) {
  if (!hex) return true;
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export const Avatar = memo(function Avatar({ nombre, color, size = 'md', className, ring = false }) {
  const initials = useMemo(() => getInitials(nombre), [nombre]);
  const textColor = isLightColor(color) ? 'text-navy-900' : 'text-white';
  return (
    <span
      role="img"
      aria-label={nombre ? `Avatar de ${nombre}` : 'Avatar'}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none',
        SIZES[size],
        ring && 'ring-2 ring-white dark:ring-navy-900',
        className,
      )}
      style={{ backgroundColor: color || '#475569', color: undefined }}
    >
      <span className={textColor}>{initials}</span>
    </span>
  );
});
