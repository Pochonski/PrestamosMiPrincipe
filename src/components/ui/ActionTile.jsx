import clsx from 'clsx';
import { Card } from './Card';

export function ActionTile({ icon: Icon, title, description, tone = 'gold', onClick, className }) {
  const tones = {
    gold: 'from-gold-400 to-gold-600 text-navy-900',
    navy: 'from-navy-700 to-navy-800 text-white',
    emerald: 'from-emerald-500 to-emerald-700 text-white',
    sky: 'from-sky-500 to-sky-700 text-white',
    rose: 'from-rose-500 to-rose-700 text-white',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative overflow-hidden rounded-2xl text-left transition-all duration-200',
        'shadow-card hover:shadow-cardHover hover:-translate-y-0.5',
        'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy-900',
        className,
      )}
    >
      <div className={clsx('absolute inset-0 bg-gradient-to-br', tones[tone])} />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all group-hover:scale-125" />
      <Card className="relative border-0 bg-transparent shadow-none">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold sm:text-lg">{title}</p>
            {description && (
              <p className="mt-0.5 text-xs opacity-90 sm:text-sm">{description}</p>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}