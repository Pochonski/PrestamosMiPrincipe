import React from 'react';
import { formatCRCCompact, formatDate, greeting } from '../../../lib/format';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';

export function WelcomeHeader({ user, kpis }) {
  const u = user;
  if (!u) return null;

  const saludo = greeting();

  const cantidad = Number(kpis.cantidadCobrarHoy ?? 0);
  const totalHoy = Number(kpis.totalCobrarHoy ?? 0);

  const microMsg =
    cantidad > 0
      ? `Tienes ${cantidad} ${cantidad === 1 ? 'cuota por cobrar' : 'cuotas por cobrar'} hoy.`
      : 'No hay cobros programados para hoy.';

  return (
    <Card className="relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-hero-surface" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar nombre={u.nombre} color={u.color} size="lg" />
          <div className="min-w-0">
            <p className="section-label text-gold-600 dark:text-gold-400">{saludo}</p>
            <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              {(u.nombre || '').split(' ')[0] || u.email?.split('@')[0] || 'Hola'}
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-navy-300">{microMsg}</p>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-navy-400">{formatDate(new Date())}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-input border border-slate-100 bg-white/60 px-3 py-2 shadow-card sm:self-auto dark:border-navy-700/60 dark:bg-navy-700/50">
          <span className="section-label">Hoy</span>
          <span className="text-sm font-bold text-navy-900 tabular-nums dark:text-white">
            {formatCRCCompact(totalHoy)}
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-navy-300">por cobrar</span>
        </div>
      </div>
    </Card>
  );
}

