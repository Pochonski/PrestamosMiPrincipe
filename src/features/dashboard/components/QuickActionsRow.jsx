import {
  FileBarChart,
  Bell,
  CalendarClock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { QuickChip } from '../../../components/ui/QuickChip';

export function QuickActionsRow({ badges, onNavigate }) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:-mx-5 sm:px-5 scrollbar-hide">
      <div className="flex min-w-max gap-2 pb-1">
        <QuickChip
          icon={FileBarChart}
          label="Reportes"
          tone="neutral"
          onClick={() => onNavigate('reportes')}
        />
        <QuickChip
          icon={Bell}
          label="Notificaciones"
          badge={badges.notificaciones}
          tone={badges.notificaciones > 0 ? 'gold' : 'neutral'}
          onClick={() => onNavigate('notificaciones')}
        />
        <QuickChip
          icon={CalendarClock}
          label="Cobrar hoy"
          badge={badges.cobrarHoy}
          tone={badges.cobrarHoy > 0 ? 'info' : 'neutral'}
          onClick={() => onNavigate('cobrar-hoy')}
        />
        <QuickChip
          icon={AlertTriangle}
          label="Atrasados"
          badge={badges.atrasados}
          tone={badges.atrasados > 0 ? 'danger' : 'neutral'}
          onClick={() => onNavigate('atrasados')}
        />
        <QuickChip
          icon={Download}
          label="Exportar Excel"
          tone="neutral"
          onClick={() => onNavigate('exportar')}
        />
      </div>
    </div>
  );
}