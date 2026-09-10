import React from 'react';
import { Construction } from 'lucide-react';
import { Card } from './Card';
import { IconBox } from './IconBox';

export function PlaceholderPage({ titulo, descripcion }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-4">
          <IconBox icon={Construction} tone="gold" size="lg" ring />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">{titulo}</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-navy-300">{descripcion}</p>
        <p className="label-micro mt-4 text-gold-600 dark:text-gold-400">
          Disponible próximamente
        </p>
      </Card>
    </div>
  );
}
