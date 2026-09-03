export function makePrestamo(overrides = {}) {
  const base = {
    id: 'prest-1',
    clienteId: 'cli-1',
    cliente_id: 'cli-1',
    org_id: 'org-1',
    ruta: 'Ruta 1',
    monto: 100000,
    saldo_capital: 100000,
    tasa: 10,
    n_cuotas: 10,
    nCuotas: 10,
    periodo: { tipo: 'quincenal' },
    fecha_inicio: '2024-01-15',
    estado: 'vigente',
    cuotas: [],
    ...overrides,
  };
  // alias n_cuotas <-> nCuotas coherente
  if (overrides.nCuotas !== undefined && overrides.n_cuotas === undefined) base.n_cuotas = overrides.nCuotas;
  if (overrides.n_cuotas !== undefined && overrides.nCuotas === undefined) base.nCuotas = overrides.n_cuotas;
  return base;
}

export function makeCuota(overrides = {}) {
  return {
    id: `cuota-${overrides.numero ?? 1}`,
    prestamo_id: 'prest-1',
    numero: 1,
    fecha: '2024-02-01',
    monto: 10000,
    estado: 'pendiente',
    ...overrides,
  };
}

export function makeCliente(overrides = {}) {
  return {
    id: 'cli-1',
    org_id: 'org-1',
    nombre: 'Juan Pérez',
    cedula: '1-0823-0445',
    telefono: '8888-8888',
    direccion: 'San José, Costa Rica',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeCobro(overrides = {}) {
  return {
    id: 'cob-1',
    org_id: 'org-1',
    prestamo_id: 'prest-1',
    cliente_id: 'cli-1',
    cuota_numero: 1,
    monto: 10000,
    tipo: 'interes',
    incluir_interes: false,
    fecha: new Date().toISOString(),
    ...overrides,
  };
}
