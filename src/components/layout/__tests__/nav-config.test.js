import { describe, it, expect } from 'vitest';
import { findItemById, findItemByPath, resolveActiveId } from '../nav-config';

describe('nav-config', () => {
  it('findItemById existe', () => expect(findItemById('dashboard')).not.toBeNull());
  it('findItemById no existe -> null', () => expect(findItemById('nope')).toBeNull());
  it('findItemByPath exact', () => expect(findItemByPath('/')).not.toBeNull());
  it('findItemByPath prefix', () => expect(findItemByPath('/prestamos/nuevo/detalle')?.id).toBe('registrar-prestamo'));
  it('findItemByPath / no hace prefix', () => expect(findItemByPath('/other')).toBeNull());
  it('resolveActiveId fallback dashboard', () => expect(resolveActiveId('/desconocida')).toBe('dashboard'));
  it('resolveActiveId /', () => expect(resolveActiveId('/')).toBe('dashboard'));
  it('resolveActiveId clientes', () => expect(resolveActiveId('/clientes')).toBe('clientes'));
  it('resolveActiveId subruta clientes', () => expect(resolveActiveId('/cobrar-hoy/123')).toBe('cobrar-hoy'));
});
