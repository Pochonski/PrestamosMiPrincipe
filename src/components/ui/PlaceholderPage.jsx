import React from 'react';
import { Construction } from 'lucide-react';
import { Card } from './Card';
import { IconBox } from './IconBox';

export function PlaceholderPage({ titulo, descripcion }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4">
          <IconBox icon={Construction} tone="gold" size="lg" ring />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">{titulo}</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-navy-300">{descripcion}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gold-600 dark:text-gold-400">
          Disponible próximamente
        </p>
      </Card>
    </div>
  );
}
