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
  UserPlus,
  Settings,
} from 'lucide-react';

/**
 * Single source of truth para navegación.
 * - id: identificador interno (compatibilidad con handlers existentes)
 * - path: ruta URL para deep-linking y refresh
 * - parent: id del item padre (para resaltar el item activo en Sidebar cuando
 *   la sub-página está abierta)
 * - mobile: si aparece en la BottomNav móvil
 * - section: 'principal' | 'acciones' para agrupar en Sidebar
 */
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', mobile: true, section: 'principal' },
  { id: 'reportes', label: 'Reportes', icon: FileBarChart, path: '/reportes', mobile: true, section: 'principal' },
  { id: 'cobrar-hoy', label: 'Cobrar hoy', icon: CalendarClock, path: '/cobrar-hoy', mobile: true, section: 'principal' },
  { id: 'atrasados', label: 'Atrasados', icon: AlertTriangle, path: '/atrasados', mobile: true, section: 'principal' },
  { id: 'resumen', label: 'Resumen', icon: ClipboardList, path: '/resumen', mobile: true, section: 'principal' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes', mobile: false, section: 'acciones' },
  { id: 'registrar-prestamo', label: 'Registrar préstamo', icon: PlusCircle, path: '/prestamos/nuevo', mobile: false, section: 'acciones', parent: 'clientes' },
  { id: 'cobro', label: 'Realizar cobro', icon: HandCoins, path: '/cobros/nuevo', mobile: false, section: 'acciones', parent: 'clientes' },
  { id: 'respaldar', label: 'Respaldar datos', icon: Database, path: '/respaldar', mobile: false, section: 'acciones' },
  { id: 'exportar', label: 'Exportar Excel', icon: Download, path: '/exportar', mobile: false, section: 'acciones' },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, path: '/notificaciones', mobile: false, section: 'acciones' },
  { id: 'settings', label: 'Organización', icon: Settings, path: '/settings', mobile: false, section: 'acciones' },
];

const BY_ID = new Map(NAV_ITEMS.map((n) => [n.id, n]));
const BY_PATH = new Map(NAV_ITEMS.map((n) => [n.path, n]));

export const RESERVED_SLUGS = new Set(['login', 'signup', 'forgot', 'onboarding', 'invite', 'api', 'assets']);

const NAV_TOP_SEGMENTS = new Set(
  NAV_ITEMS.map((n) => n.path.split('/').filter(Boolean)[0]).filter(Boolean),
);

export function parseOrgSlug(path) {
  const parts = String(path || '/').split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const seg = parts[0] || null;
  if (!seg || RESERVED_SLUGS.has(seg) || NAV_TOP_SEGMENTS.has(seg)) return null;
  return seg;
}

export function stripOrgPrefix(path) {
  const slug = parseOrgSlug(path);
  if (!slug) return path;
  const stripped = path.replace(new RegExp(`^/${slug}`), '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export function withOrgPrefix(slug, path) {
  if (!slug) return path;
  if (path === '/') return `/${slug}`;
  return `/${slug}${path}`;
}

export function findItemById(id) {
  return BY_ID.get(id) || null;
}

export function findItemByPath(path) {
  const stripped = stripOrgPrefix(path);
  if (BY_PATH.has(stripped)) return BY_PATH.get(stripped);
  for (const item of NAV_ITEMS) {
    if (item.path !== '/' && stripped.startsWith(item.path)) return item;
  }
  return null;
}

export function resolveActiveId(currentPath) {
  const item = findItemByPath(currentPath);
  return item?.id ?? 'dashboard';
}

/**
 * Items exclusivos de BottomNav (no son páginas top-level).
 * Usa `page` para apuntar al item real al que navega.
 */
export const MOBILE_EXTRA_ITEMS = [
  { id: 'registrar-pago', label: 'Registrar pago', icon: HandCoins, page: 'cobro' },
  { id: 'registrar-cliente', label: 'Registrar cliente', icon: UserPlus, page: 'clientes', params: { autoCreate: true } },
];
