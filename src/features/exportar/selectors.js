import * as clientesService from '../../services/clientes';
import * as prestamosService from '../../services/prestamos';
import * as cobrosService from '../../services/cobros';

const COLUMNS = {
  clientes: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'created_at', label: 'Creado en' },
  ],
  prestamos: [
    { key: 'id', label: 'ID' },
    { key: 'cliente_id', label: 'Cliente ID' },
    { key: 'ruta', label: 'Ruta' },
    { key: 'monto', label: 'Capital original' },
    { key: 'saldo_capital', label: 'Saldo actual' },
    { key: 'tasa', label: 'Tasa %' },
    { key: 'n_cuotas', label: 'N° cuotas' },
    { key: 'fecha_inicio', label: 'Fecha inicio' },
    { key: 'estado', label: 'Estado' },
    { key: 'created_at', label: 'Creado en' },
  ],
  cobros: [
    { key: 'id', label: 'ID' },
    { key: 'prestamo_id', label: 'Préstamo ID' },
    { key: 'cliente_id', label: 'Cliente ID' },
    { key: 'cuota_numero', label: 'Cuota #' },
    { key: 'monto', label: 'Monto' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'incluir_interes', label: 'Incluye interés' },
    { key: 'interes_pagado', label: 'Interés pagado' },
    { key: 'capital_pagado', label: 'Capital pagado' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'cobrador_id', label: 'Cobrador ID' },
    { key: 'nota', label: 'Nota' },
  ],
};

function escapeCSV(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(items, columns) {
  const header = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = items.map((item) =>
    columns.map((c) => escapeCSV(item[c.key])).join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadCSV(filename, content) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getColumns(tipo) {
  return COLUMNS[tipo] || [];
}

async function fetchForTipo(tipo) {
  if (tipo === 'clientes') return clientesService.list();
  if (tipo === 'prestamos') return prestamosService.list();
  if (tipo === 'cobros') return cobrosService.list();
  return [];
}

export async function getDataFor(tipo) {
  return fetchForTipo(tipo);
}

export async function exportCSV(tipo) {
  const items = await fetchForTipo(tipo);
  const columns = getColumns(tipo);
  const csv = generateCSV(items, columns);
  const fecha = new Date().toISOString().slice(0, 10);
  downloadCSV(`pmp-${tipo}-${fecha}.csv`, csv);
  return items.length;
}

export async function getCounts() {
  const [clientes, prestamos, cobros] = await Promise.all([
    clientesService.list(),
    prestamosService.list(),
    cobrosService.list(),
  ]);
  return {
    clientes: clientes.length,
    prestamos: prestamos.length,
    cobros: cobros.length,
  };
}