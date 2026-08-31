import { Bell } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function EmptyNotificaciones({ filter }) {
  const isFiltered = filter === 'no-leidas';
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-navy-700 dark:text-navy-300">
        <Bell className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-base font-bold text-navy-900 dark:text-white">
          {isFiltered ? '¡Todo al día!' : 'Sin notificaciones'}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
          {isFiltered
            ? 'No tenés notificaciones sin leer.'
            : 'Cuando haya cobros pendientes o atrasos, aparecerán acá.'}
        </p>
      </div>
    </Card>
  );
}