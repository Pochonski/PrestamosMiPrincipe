import clsx from 'clsx';

export function Logo({ className, withText = true }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gold-gradient shadow-glow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-navy-900"
          aria-hidden="true"
        >
          <path
            d="M3 17l1.5-2.2a8 8 0 0 1 1.2-1.4l1-.9V9.5a3 3 0 0 1 1.4-2.5L12 5l4 2a3 3 0 0 1 1.4 2.5v3l1 .9c.45.4.85.87 1.2 1.4L21 17H3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="11.5" r="0.9" fill="currentColor" />
          <circle cx="15" cy="11.5" r="0.9" fill="currentColor" />
          <path
            d="M3 18.5h18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M5 19.5l1 1.5M19 19.5l-1 1.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withText && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-navy-900 dark:text-white">Mi Príncipe</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gold-600 dark:text-gold-400">
            Préstamos
          </p>
        </div>
      )}
    </div>
  );
}