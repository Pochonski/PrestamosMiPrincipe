const now = new Date();

function daysFromNow(n) {
  const d = new Date(now);
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function monthStart() {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1, 9, 0, 0, 0).toISOString();
}

export const SEED_VERSION = 1;

export const seedUsuarios = [
  {
    id: 'u-1',
    nombre: 'Carlos Rodríguez',
    rol: 'Administrador',
    iniciales: 'CR',
    color: '#D4AF37',
  },
  {
    id: 'u-2',
    nombre: 'María Solís',
    rol: 'Cobradora',
    iniciales: 'MS',
    color: '#3B0764',
  },
];

export const seedClientes = [
  {
    id: 'c-1',
    nombre: 'José Andrés Méndez Vargas',
    cedula: '1-0823-0445',
    telefono: '88887777',
    direccion: 'San José, Carmen, 200m norte de la iglesia',
    creadoEn: monthStart(),
    creadoPor: 'u-1',
  },
  {
    id: 'c-2',
    nombre: 'Laura Patricia Gómez Solís',
    cedula: '1-1145-0987',
    telefono: '86543210',
    direccion: 'Heredia, San Francisco, residencial Las Palmas',
    creadoEn: monthStart(),
    creadoPor: 'u-2',
  },
  {
    id: 'c-3',
    nombre: 'Marco Antonio Picado León',
    cedula: '2-0456-0123',
    telefono: '89991122',
    direccion: 'Alajuela, centro, frente al parque',
    creadoEn: monthStart(),
    creadoPor: 'u-1',
  },
  {
    id: 'c-4',
    nombre: 'Ana Lucía Hernández Brenes',
    cedula: '1-1567-0234',
    telefono: '83334455',
    direccion: 'Cartago, Guadalupe, barrio Las Américas',
    creadoEn: monthStart(),
    creadoPor: 'u-2',
  },
  {
    id: 'c-5',
    nombre: 'Roberto Carlos Jiménez Núñez',
    cedula: '2-0789-0567',
    telefono: '87776666',
    direccion: 'San José, Pavas, residencial Santa Fe',
    creadoEn: monthStart(),
    creadoPor: 'u-1',
  },
  {
    id: 'c-6',
    nombre: 'Sofía María Castillo Ruiz',
    cedula: '1-1890-0789',
    telefono: '85552233',
    direccion: 'San José, Tibás, 300m este de la escuela',
    creadoEn: monthStart(),
    creadoPor: 'u-2',
  },
];

export const seedPrestamos = [
  {
    id: 'p-1',
    clienteId: 'c-1',
    monto: 250000,
    tasa: 8,
    plazoMeses: 6,
    fechaInicio: daysFromNow(-45),
    creadoPor: 'u-1',
    estado: 'vigente',
    cuotas: [
      { numero: 1, fecha: daysFromNow(-30), monto: 47500, estado: 'pagada', pagadaEn: daysFromNow(-30) },
      { numero: 2, fecha: daysFromNow(-15), monto: 47500, estado: 'pagada', pagadaEn: daysFromNow(-14) },
      { numero: 3, fecha: daysFromNow(0), monto: 47500, estado: 'pendiente' },
      { numero: 4, fecha: daysFromNow(15), monto: 47500, estado: 'pendiente' },
      { numero: 5, fecha: daysFromNow(30), monto: 47500, estado: 'pendiente' },
      { numero: 6, fecha: daysFromNow(45), monto: 47500, estado: 'pendiente' },
    ],
  },
  {
    id: 'p-2',
    clienteId: 'c-2',
    monto: 150000,
    tasa: 10,
    plazoMeses: 4,
    fechaInicio: daysFromNow(-60),
    creadoPor: 'u-2',
    estado: 'vigente',
    cuotas: [
      { numero: 1, fecha: daysFromNow(-45), monto: 41250, estado: 'pagada', pagadaEn: daysFromNow(-45) },
      { numero: 2, fecha: daysFromNow(-30), monto: 41250, estado: 'pagada', pagadaEn: daysFromNow(-30) },
      { numero: 3, fecha: daysFromNow(-5), monto: 41250, estado: 'pendiente', pagadaEn: null },
      { numero: 4, fecha: daysFromNow(10), monto: 41250, estado: 'pendiente' },
    ],
  },
  {
    id: 'p-3',
    clienteId: 'c-3',
    monto: 50000,
    tasa: 12,
    plazoMeses: 3,
    fechaInicio: daysFromNow(-20),
    creadoPor: 'u-1',
    estado: 'vigente',
    cuotas: [
      { numero: 1, fecha: daysFromNow(0), monto: 18670, estado: 'pendiente' },
      { numero: 2, fecha: daysFromNow(15), monto: 18670, estado: 'pendiente' },
      { numero: 3, fecha: daysFromNow(30), monto: 18670, estado: 'pendiente' },
    ],
  },
  {
    id: 'p-4',
    clienteId: 'c-4',
    monto: 350000,
    tasa: 7,
    plazoMeses: 8,
    fechaInicio: daysFromNow(-90),
    creadoPor: 'u-2',
    estado: 'vigente',
    cuotas: [
      { numero: 1, fecha: daysFromNow(-75), monto: 48310, estado: 'pagada', pagadaEn: daysFromNow(-75) },
      { numero: 2, fecha: daysFromNow(-60), monto: 48310, estado: 'pagada', pagadaEn: daysFromNow(-60) },
      { numero: 3, fecha: daysFromNow(-45), monto: 48310, estado: 'pagada', pagadaEn: daysFromNow(-45) },
      { numero: 4, fecha: daysFromNow(-30), monto: 48310, estado: 'pagada', pagadaEn: daysFromNow(-30) },
      { numero: 5, fecha: daysFromNow(-15), monto: 48310, estado: 'pagada', pagadaEn: daysFromNow(-15) },
      { numero: 6, fecha: daysFromNow(0), monto: 48310, estado: 'pendiente' },
      { numero: 7, fecha: daysFromNow(15), monto: 48310, estado: 'pendiente' },
      { numero: 8, fecha: daysFromNow(30), monto: 48310, estado: 'pendiente' },
    ],
  },
  {
    id: 'p-5',
    clienteId: 'c-5',
    monto: 80000,
    tasa: 10,
    plazoMeses: 3,
    fechaInicio: daysFromNow(-25),
    creadoPor: 'u-1',
    estado: 'atrasado',
    cuotas: [
      { numero: 1, fecha: daysFromNow(-10), monto: 29330, estado: 'pendiente', pagadaEn: null },
      { numero: 2, fecha: daysFromNow(5), monto: 29330, estado: 'pendiente' },
      { numero: 3, fecha: daysFromNow(20), monto: 29330, estado: 'pendiente' },
    ],
  },
  {
    id: 'p-6',
    clienteId: 'c-6',
    monto: 120000,
    tasa: 9,
    plazoMeses: 5,
    fechaInicio: daysFromNow(-15),
    creadoPor: 'u-2',
    estado: 'vigente',
    cuotas: [
      { numero: 1, fecha: daysFromNow(0), monto: 27000, estado: 'pendiente' },
      { numero: 2, fecha: daysFromNow(15), monto: 27000, estado: 'pendiente' },
      { numero: 3, fecha: daysFromNow(30), monto: 27000, estado: 'pendiente' },
      { numero: 4, fecha: daysFromNow(45), monto: 27000, estado: 'pendiente' },
      { numero: 5, fecha: daysFromNow(60), monto: 27000, estado: 'pendiente' },
    ],
  },
];

export const seedCobros = [
  {
    id: 'cob-1',
    prestamoId: 'p-1',
    clienteId: 'c-1',
    cuotaNumero: 2,
    monto: 47500,
    fecha: daysFromNow(-14),
    cobradorId: 'u-2',
    nota: 'Pago completo en efectivo',
  },
  {
    id: 'cob-2',
    prestamoId: 'p-4',
    clienteId: 'c-4',
    cuotaNumero: 5,
    monto: 48310,
    fecha: daysFromNow(-15),
    cobradorId: 'u-1',
    nota: null,
  },
  {
    id: 'cob-3',
    prestamoId: 'p-2',
    clienteId: 'c-2',
    cuotaNumero: 1,
    monto: 41250,
    fecha: daysFromNow(-45),
    cobradorId: 'u-2',
    nota: 'Cliente pagó puntualmente',
  },
  {
    id: 'cob-4',
    prestamoId: 'p-1',
    clienteId: 'c-1',
    cuotaNumero: 1,
    monto: 47500,
    fecha: daysFromNow(-30),
    cobradorId: 'u-1',
    nota: null,
  },
];

export const seedNotificaciones = [
  {
    id: 'n-1',
    tipo: 'mora',
    titulo: 'Préstamo atrasado',
    mensaje: 'Roberto Carlos Jiménez tiene una cuota atrasada desde hace 10 días.',
    fecha: daysFromNow(-1),
    leida: false,
  },
  {
    id: 'n-2',
    tipo: 'cobro',
    titulo: '3 cobros programados para hoy',
    mensaje: 'Hay 3 cuotas con vencimiento el día de hoy.',
    fecha: daysFromNow(0),
    leida: false,
  },
  {
    id: 'n-3',
    tipo: 'info',
    titulo: 'Respaldo automático completado',
    mensaje: 'Tu información está al día y respaldada.',
    fecha: daysFromNow(-2),
    leida: true,
  },
];