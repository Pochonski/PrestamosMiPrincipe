const COLUMNS = {
  clientes: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'creadoEn', label: 'Creado en' },
  ],
  prestamos: [
    { key: 'id', label: 'ID' },
    { key: 'clienteId', label: 'Cliente ID' },
    { key: 'ruta', label: 'Ruta' },
    { key: 'monto', label: 'Capital original' },
    { key: 'saldoCapital', label: 'Saldo actual' },
    { key: 'tasa', label: 'Tasa %' },
    { key: 'nCuotas', label: 'N° cuotas' },
    { key: 'fechaInicio', label: 'Fecha inicio' },
    { key: 'estado', label: 'Estado' },
    { key: 'creadoEn', label: 'Creado en' },
  ],
  cobros: [
    { key: 'id', label: 'ID' },
    { key: 'prestamoId', label: 'Préstamo ID' },
    { key: 'clienteId', label: 'Cliente ID' },
    { key: 'cuotaNumero', label: 'Cuota #' },
    { key: 'monto', label: 'Monto' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'incluirInteres', label: 'Incluye interés' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'cobradorId', label: 'Cobrador ID' },
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

export function getDataFor(tipo) {
  const raw = localStorage.getItem(`pmp:v1:${tipo}`);
  return raw ? JSON.parse(raw) : [];
}

export function exportCSV(tipo) {
  const items = getDataFor(tipo);
  const columns = getColumns(tipo);
  const csv = generateCSV(items, columns);
  const fecha = new Date().toISOString().slice(0, 10);
  downloadCSV(`pmp-${tipo}-${fecha}.csv`, csv);
  return items.length;
}

export function getCounts() {
  return {
    clientes: getDataFor('clientes').length,
    prestamos: getDataFor('prestamos').length,
    cobros: getDataFor('cobros').length,
  };
}