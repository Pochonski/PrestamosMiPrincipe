export function parseMontoNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits);
}

export function parseMontoLive(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-CR') : '';
}