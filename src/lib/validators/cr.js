/**
 * Validadores y formatters compartidos para datos de Costa Rica.
 * Usar desde cualquier feature (clientes, prestamos, etc.) sin
 * importar el feature completo.
 */

export function validateNombre(v) {
  const t = String(v || '').trim();
  if (!t) return 'El nombre es obligatorio';
  if (t.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  return null;
}

export function validateDireccion(v) {
  const t = String(v || '').trim();
  if (!t) return 'La dirección es obligatoria';
  if (t.length < 5) return 'Ingresa una dirección más completa';
  return null;
}

export function validateTelefono(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return 'El teléfono es obligatorio';
  if (digits.length !== 8) return 'El teléfono debe tener 8 dígitos';
  return null;
}

export function validateCedula(v) {
  const t = String(v || '').trim();
  if (!t) return 'La cédula es obligatoria';
  if (!/^\d-\d{4}-\d{4}$/.test(t)) return 'Formato de cédula: 1-0823-0445';
  return null;
}

export function formatTelefonoLive(v) {
  const digits = String(v || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function formatCedulaLive(v) {
  const digits = String(v || '').replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
}

export function validateCliente({ nombre, direccion, telefono, cedula }) {
  return {
    nombre: validateNombre(nombre),
    direccion: validateDireccion(direccion),
    telefono: validateTelefono(telefono),
    cedula: validateCedula(cedula),
  };
}

export function hasClienteErrors(errors) {
  return Boolean(errors.nombre || errors.direccion || errors.telefono || errors.cedula);
}
