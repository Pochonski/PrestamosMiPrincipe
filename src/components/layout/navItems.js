import {
  LayoutDashboard,
  FileBarChart,
  Bell,
  CalendarClock,
  AlertTriangle,
  Download,
  PlusCircle,
  HandCoins,
  Database,
  ClipboardList,
  Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, mobile: true },
  { id: 'reportes', label: 'Reportes', icon: FileBarChart, mobile: true },
  { id: 'cobrar-hoy', label: 'Cobrar hoy', icon: CalendarClock, mobile: true },
  { id: 'atrasados', label: 'Atrasados', icon: AlertTriangle, mobile: true },
  { id: 'resumen', label: 'Resumen', icon: ClipboardList, mobile: true },
  { id: 'clientes', label: 'Clientes', icon: Users, mobile: false },
  { id: 'registrar-prestamo', label: 'Registrar préstamo', icon: PlusCircle, mobile: false },
  { id: 'cobro', label: 'Realizar cobro', icon: HandCoins, mobile: false },
  { id: 'respaldar', label: 'Respaldar datos', icon: Database, mobile: false },
  { id: 'exportar', label: 'Exportar Excel', icon: Download, mobile: false },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, mobile: false },
];