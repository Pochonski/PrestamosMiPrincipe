import React from 'react';
import {
  FileBarChart,
  Bell,
  CalendarClock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { QuickActionCard } from '../../../components/ui/QuickActionCard';

const QUICK_ACTIONS = [
  { icon: FileBarChart, label: 'Reportes', to: 'reportes', tone: 'info', badgeKey: null },
  { icon: Bell, label: 'Notificaciones', to: 'notificaciones', tone: 'gold', badgeKey: 'notificaciones' },
  { icon: CalendarClock, label: 'Cobrar hoy', to: 'cobrar-hoy', tone: 'emerald', badgeKey: 'cobrarHoy' },
  { icon: AlertTriangle, label: 'Atrasados', to: 'atrasados', tone: 'rose', badgeKey: 'atrasados' },
  { icon: Download, label: 'Exportar', to: 'exportar', tone: 'navy', badgeKey: null },
];

export function QuickActionsRow({ badges, onNavigate }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
      {QUICK_ACTIONS.map(({ icon, label, to, tone, badgeKey }) => (
        <QuickActionCard
          key={label}
          icon={icon}
          label={label}
          tone={tone}
          badge={badgeKey ? badges[badgeKey] : undefined}
          onClick={() => onNavigate(to)}
        />
      ))}
    </div>
  );
}