import { formatDate, greeting } from '../../../lib/format';
import { Avatar } from '../../../components/ui/Avatar';

export function WelcomeHeader({ user, kpis }) {
  const u = user;
  if (!u) return null;

  const saludo = greeting();

  const microMsg =
    kpis.cantidadCobrarHoy > 0
      ? `Tienes ${kpis.cantidadCobrarHoy} ${kpis.cantidadCobrarHoy === 1 ? 'cuota por cobrar' : 'cuotas por cobrar'} hoy.`
      : 'No hay cobros programados para hoy.';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-navy-700/60 dark:bg-navy-800">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl dark:bg-gold-500/10" />
      <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-navy-200/40 blur-3xl dark:bg-navy-700/40" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar nombre={u.nombre} color={u.color} size="lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              {saludo}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              {u.nombre.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
              {microMsg} {formatDate(new Date())}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-navy-700/50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300">
            Hoy
          </span>
          <span className="text-sm font-bold text-navy-900 tabular-nums dark:text-white">
            ₡{kpis.totalCobrarHoy.toLocaleString('es-CR')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-navy-300">por cobrar</span>
        </div>
      </div>
    </section>
  );
}