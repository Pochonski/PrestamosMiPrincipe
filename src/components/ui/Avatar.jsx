import clsx from 'clsx';

export function Avatar({ nombre, color, size = 'md', className }) {
  const iniciales = String(nombre || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color || '#475569' }}
      aria-hidden="true"
    >
      {iniciales}
    </div>
  );
}