import { PlusCircle, HandCoins, Database, ClipboardList } from 'lucide-react';
import { ActionTile } from '../../../components/ui/ActionTile';

export function PrimaryActions({ onNavigate }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <ActionTile
        icon={PlusCircle}
        title="Registrar préstamo"
        description="Crear nuevo préstamo"
        tone="gold"
        onClick={() => onNavigate('registrar-prestamo')}
      />
      <ActionTile
        icon={HandCoins}
        title="Realizar cobro"
        description="Registrar pago de cuota"
        tone="emerald"
        onClick={() => onNavigate('cobro')}
      />
      <ActionTile
        icon={Database}
        title="Respaldar datos"
        description="Generar respaldo"
        tone="navy"
        onClick={() => onNavigate('respaldar')}
      />
      <ActionTile
        icon={ClipboardList}
        title="Resumen general"
        description="Estado del negocio"
        tone="sky"
        onClick={() => onNavigate('resumen')}
      />
    </div>
  );
}