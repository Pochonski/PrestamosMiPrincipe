import { describe, it, expect } from 'vitest';
import {
  validateNombre,
  validateDireccion,
  validateTelefono,
  validateCedula,
  formatTelefonoLive,
  formatCedulaLive,
  validateCliente,
  hasClienteErrors,
} from '../cr';

describe('validateNombre', () => {
  it('retorna error si vacío', () => {
    expect(validateNombre('')).toBe('El nombre es obligatorio');
    expect(validateNombre(null)).toBe('El nombre es obligatorio');
    expect(validateNombre('   ')).toBe('El nombre es obligatorio');
  });
  it('retorna error si <3', () => {
    expect(validateNombre('ab')).toBe('El nombre debe tener al menos 3 caracteres');
  });
  it('ok si >=3', () => {
    expect(validateNombre('Ana')).toBeNull();
    expect(validateNombre(' Juan Pérez ')).toBeNull();
  });
});

describe('validateDireccion', () => {
  it('obligatoria', () => expect(validateDireccion('')).toBe('La dirección es obligatoria'));
  it('mín 5', () => expect(validateDireccion('abcd')).toBe('Ingresa una dirección más completa'));
  it('ok', () => expect(validateDireccion('San José')).toBeNull());
});

describe('validateTelefono', () => {
  it('obligatorio', () => expect(validateTelefono('')).toBe('El teléfono es obligatorio'));
  it('debe tener 8 dígitos', () => {
    expect(validateTelefono('8888')).toBe('El teléfono debe tener 8 dígitos');
    expect(validateTelefono('888888888')).toBe('El teléfono debe tener 8 dígitos');
  });
  it('solo letras -> obligatorio (sin dígitos)', () => {
    expect(validateTelefono('abc')).toBe('El teléfono es obligatorio');
  });
  it('acepta con guión/espacios', () => {
    expect(validateTelefono('8888-8888')).toBeNull();
    expect(validateTelefono('8888 8888')).toBeNull();
  });
  it('7 y 9 dígitos fallan', () => {
    expect(validateTelefono('8888888')).toBe('El teléfono debe tener 8 dígitos');
    expect(validateTelefono('888888888')).toBe('El teléfono debe tener 8 dígitos');
  });
});

describe('validateCedula', () => {
  it('obligatoria', () => expect(validateCedula('')).toBe('La cédula es obligatoria'));
  it('formato inválido', () => {
    expect(validateCedula('1-0823-044')).toBe('Formato de cédula: 1-0823-0445');
    expect(validateCedula('108230445')).toBe('Formato de cédula: 1-0823-0445');
    expect(validateCedula('1-0823-04455')).toBe('Formato de cédula: 1-0823-0445');
  });
  it('ok', () => expect(validateCedula('1-0823-0445')).toBeNull());
});

describe('formatTelefonoLive', () => {
  it('<=4 dígitos sin guión', () => {
    expect(formatTelefonoLive('888')).toBe('888');
    expect(formatTelefonoLive('8888')).toBe('8888');
  });
  it('>4 con guión', () => {
    expect(formatTelefonoLive('88888888')).toBe('8888-8888');
    expect(formatTelefonoLive('88888')).toBe('8888-8');
  });
  it('trunca a 8', () => expect(formatTelefonoLive('8888888899')).toBe('8888-8888'));
  it('limpia no dígitos', () => expect(formatTelefonoLive('8888-8888')).toBe('8888-8888'));
});

describe('formatCedulaLive', () => {
  it('1 dígito sin guión', () => expect(formatCedulaLive('1')).toBe('1'));
  it('2-5 dígitos 1-XXXX', () => {
    expect(formatCedulaLive('10')).toBe('1-0');
    expect(formatCedulaLive('10823')).toBe('1-0823');
  });
  it('>5 1-XXXX-XXXX', () => {
    expect(formatCedulaLive('108230445')).toBe('1-0823-0445');
    expect(formatCedulaLive('1082304459')).toBe('1-0823-0445'); // trunca 9
  });
});

describe('validateCliente / hasClienteErrors', () => {
  it('todos errores si vacío', () => {
    const e = validateCliente({});
    expect(e.nombre).toBeTruthy();
    expect(e.direccion).toBeTruthy();
    expect(e.telefono).toBeTruthy();
    expect(e.cedula).toBeTruthy();
    expect(hasClienteErrors(e)).toBe(true);
  });
  it('sin errores si válido', () => {
    const e = validateCliente({
      nombre: 'Juan Pérez',
      direccion: 'San José centro',
      telefono: '88888888',
      cedula: '1-0823-0445',
    });
    expect(hasClienteErrors(e)).toBe(false);
  });
  it('hasClienteErrors false si todo null', () => {
    expect(hasClienteErrors({ nombre: null, direccion: null, telefono: null, cedula: null })).toBe(false);
  });
});
