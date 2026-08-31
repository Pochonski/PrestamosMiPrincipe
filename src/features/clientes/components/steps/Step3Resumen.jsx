import { User, MapPin, Phone, IdCard } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-navy-900 dark:text-white">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export function Step3Resumen({ values }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">Resumen</h2>
          <p className="text-xs text-slate-500 dark:text-navy-300">
            Revisá los datos antes de guardar.
          </p>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-navy-700/60">
          <Avatar nombre={values.nombre} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-navy-900 dark:text-white">
              {values.nombre || '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-navy-300">Nuevo cliente</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
          <Row icon={MapPin} label="Dirección" value={values.direccion} />
          <Row icon={Phone} label="Teléfono" value={values.telefono ? `+506 ${values.telefono}` : '—'} />
          <Row icon={IdCard} label="Cédula" value={values.cedula} />
        </div>
      </Card>
    </div>
  );
}