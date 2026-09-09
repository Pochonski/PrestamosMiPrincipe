import React from 'react';
import clsx from 'clsx';

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function GrainOverlay({ className }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay dark:opacity-[0.06]',
        className,
      )}
      style={{ backgroundImage: NOISE_SVG }}
    />
  );
}
