import React from 'react';
import {
  FileBarChart,
  Bell,
  CalendarClock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { QuickChip } from '../../../components/ui/QuickChip';

const QUICK_ACTIONS = [
  { icon: FileBarChart, label: 'Reportes', to: 'reportes', badgeKey: null },
  { icon: Bell, label: 'Notificaciones', to: 'notificaciones', badgeKey: 'notificaciones' },
  { icon: CalendarClock, label: 'Cobrar hoy', to: 'cobrar-hoy', badgeKey: 'cobrarHoy' },
  { icon: AlertTriangle, label: 'Atrasados', to: 'atrasados', badgeKey: 'atrasados' },
  { icon: Download, label: 'Exportar Excel', to: 'exportar', badgeKey: null },
];

const toneFor = (badgeKey, badges) => {
  if (badgeKey === 'notificaciones' && badges.notificaciones > 0) return 'gold';
  if (badgeKey === 'cobrarHoy' && badges.cobrarHoy > 0) return 'info';
  if (badgeKey === 'atrasados' && badges.atrasados > 0) return 'danger';
  return 'neutral';
};

export function QuickActionsRow({ badges, onNavigate }) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0 scrollbar-hide">
      <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0 sm:-mx-0">
        {QUICK_ACTIONS.map(({ icon, label, to, badgeKey }) => (
          <QuickChip
            key={label}
            icon={icon}
            label={label}
            badge={badgeKey ? badges[badgeKey] : undefined}
            tone={toneFor(badgeKey, badges)}
            onClick={() => onNavigate(to)}
          />
        ))}
      </div>
    </div>
  );
}