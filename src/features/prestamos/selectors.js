import * as prestamosService from '../../services/prestamos';

export const PERIODOS = [
  { id: 'diario', label: 'Diario', hint: 'Cada día' },
  { id: 'semanal', label: 'Semanal', hint: 'Cada 7 días' },
  { id: 'quincenal', label: 'Quincenal', hint: 'Cada 14 días' },
  { id: 'mensual', label: 'Mensual', hint: 'Cada mes' },
  { id: 'dia_mes', label: 'Día del mes', hint: 'Día fijo mensual' },
];

export function labelPeriodo(periodo) {
  if (!periodo) return '';
  const p = PERIODOS.find((x) => x.id === periodo.tipo);
  if (!p) return periodo.tipo;
  if (periodo.tipo === 'dia_mes' && periodo.diaDelMes) {
    return `${p.label} · día ${periodo.diaDelMes}`;
  }
  return p.label;
}

export function getStatus(prestamo) {
  return prestamosService.getStatus(prestamo);
}

export function cuotaDelPeriodo(prestamo) {
  return prestamosService.cuotaDelPeriodo(prestamo);
}

export function totalIntereses(prestamo) {
  return prestamosService.totalIntereses(prestamo);
}

export function totalAPagar(prestamo) {
  return prestamosService.totalAPagar(prestamo);
}

export function proximoCobro(prestamo) {
  return prestamosService.proximoCobro(prestamo);
}

export { statsCliente } from '../../lib/resumen';

export function rutasUsadas() {
  const set = new Set();
  for (const p of prestamosService.list()) {
    if (p.ruta) set.add(p.ruta);
  }
  return Array.from(set).sort();
}

export function validateRuta(v) {
  const t = String(v || '').trim();
  if (!t) return 'La ruta es obligatoria';
  if (t.length < 2) return 'Ingresa una ruta con al menos 2 caracteres';
  return null;
}

export function validatePeriodo(periodo) {
  if (!periodo) return 'Elegí un período de pago';
  if (!PERIODOS.find((p) => p.id === periodo.tipo)) return 'Período inválido';
  if (periodo.tipo === 'dia_mes') {
    const d = Number(periodo.diaDelMes);
    if (!Number.isInteger(d) || d < 1 || d > 31) return 'Elegí un día entre 1 y 31';
  }
  return null;
}

export function validateMonto(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return 'Ingresa un monto válido';
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return 'Ingresa un monto válido';
  if (n < 1000) return 'El monto mínimo es ₡1.000';
  return null;
}

export function validateNCoutas(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return 'Mínimo 1 cuota';
  if (n > 120) return 'Máximo 120 cuotas';
  return null;
}

export function validateTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 'La tasa no puede ser negativa';
  if (n > 100) return 'La tasa parece muy alta';
  return null;
}

export function validateFechaInicio(v) {
  if (!v) return 'La fecha inicial es obligatoria';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Fecha inválida';
  return null;
}

export { formatMontoLive } from '../../lib/format';

export function buildInitialPrestamo(clienteId) {
  return {
    clienteId,
    ruta: '',
    periodo: null,
    monto: '',
    tasa: '',
    nCuotas: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
  };
}