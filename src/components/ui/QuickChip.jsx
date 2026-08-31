import clsx from 'clsx';

export function QuickChip({ icon: Icon, label, badge, tone = 'neutral', onClick }) {
  const tones = {
    neutral: 'bg-white text-navy-700 border-slate-200 hover:border-gold-400 hover:text-gold-600 dark:bg-navy-800 dark:text-navy-100 dark:border-navy-700 dark:hover:border-gold-400 dark:hover:text-gold-300',
    gold: 'bg-gold-50 text-gold-700 border-gold-200 hover:bg-gold-100 dark:bg-gold-500/10 dark:text-gold-300 dark:border-gold-500/30',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    info: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
        tones[tone],
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}