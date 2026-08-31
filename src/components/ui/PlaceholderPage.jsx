import { useEffect, useState } from 'react';
import { Construction } from 'lucide-react';
import { Card } from './Card';

export function PlaceholderPage({ titulo, descripcion }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-500 dark:bg-gold-500/10">
          <Construction className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">{titulo}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-navy-300">{descripcion}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold-600 dark:text-gold-400">
          Disponible próximamente
        </p>
      </Card>
    </div>
  );
}