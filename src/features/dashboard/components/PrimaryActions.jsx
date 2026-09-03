import React from 'react';
import { PlusCircle, HandCoins, Database, ClipboardList } from 'lucide-react';
import { ActionTile } from '../../../components/ui/ActionTile';

const PRIMARY_ACTIONS = [
  {
    icon: PlusCircle,
    title: 'Registrar préstamo',
    description: 'Crear nuevo préstamo',
    tone: 'gold',
    to: 'registrar-prestamo',
  },
  {
    icon: HandCoins,
    title: 'Realizar cobro',
    description: 'Registrar pago de cuota',
    tone: 'emerald',
    to: 'cobro',
  },
  {
    icon: Database,
    title: 'Respaldar datos',
    description: 'Generar respaldo',
    tone: 'navy',
    to: 'respaldar',
  },
  {
    icon: ClipboardList,
    title: 'Resumen general',
    description: 'Estado del negocio',
    tone: 'sky',
    to: 'resumen',
  },
];

export function PrimaryActions({ onNavigate }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {PRIMARY_ACTIONS.map(({ icon, title, description, tone, to }) => (
        <ActionTile
          key={title}
          icon={icon}
          title={title}
          description={description}
          tone={tone}
          onClick={() => onNavigate(to)}
        />
      ))}
    </div>
  );
}