import { describe, it, expect, vi } from 'vitest';
import {
  labelPeriodo,
  validateRuta,
  validatePeriodo,
  validateMonto,
  validateNCoutas,
  validateTasa,
  validateFechaInicio,
  buildInitialPrestamo,
  getStatus,
  cuotaDelPeriodo,
  totalIntereses,
  totalAPagar,
  proximoCobro,
  rutasUsadas,
} from '../selectors';
import * as prestamosService from '../../../services/prestamos';

describe('labelPeriodo', () => {
  it('null -> ""', () => expect(labelPeriodo(null)).toBe(''));
  it('tipo conocido', () => expect(labelPeriodo({ tipo: 'semanal' })).toBe('Semanal'));
  it('tipo desconocido -> tipo', () => expect(labelPeriodo({ tipo: 'xxx' })).toBe('xxx'));
  it('dia_mes con día', () => expect(labelPeriodo({ tipo: 'dia_mes', diaDelMes: 15 })).toContain('día 15'));
  it('dia_mes sin día -> solo label', () => expect(labelPeriodo({ tipo: 'dia_mes' })).toBe('Día del mes'));
});

describe('validateRuta', () => {
  it('vacío', () => expect(validateRuta('')).toBe('La ruta es obligatoria'));
  it('<2', () => expect(validateRuta('A')).toBe('Ingresa una ruta con al menos 2 caracteres'));
  it('ok', () => expect(validateRuta('Ruta 1')).toBeNull());
});

describe('validatePeriodo', () => {
  it('null -> error', () => expect(validatePeriodo(null)).toBeTruthy());
  it('tipo inválido', () => expect(validatePeriodo({ tipo: 'xxx' })).toBe('Período inválido'));
  it('dia_mes sin día válido', () => {
    expect(validatePeriodo({ tipo: 'dia_mes', diaDelMes: 0 })).toBe('Elegí un día entre 1 y 31');
    expect(validatePeriodo({ tipo: 'dia_mes', diaDelMes: 32 })).toBe('Elegí un día entre 1 y 31');
    expect(validatePeriodo({ tipo: 'dia_mes', diaDelMes: 'abc' })).toBe('Elegí un día entre 1 y 31');
  });
  it('dia_mes ok', () => expect(validatePeriodo({ tipo: 'dia_mes', diaDelMes: 15 })).toBeNull());
  it('otros tipos ok', () => expect(validatePeriodo({ tipo: 'quincenal' })).toBeNull());
});

describe('validateMonto', () => {
  it('vacío', () => expect(validateMonto('')).toBe('Ingresa un monto válido'));
  it('mín 1000', () => expect(validateMonto('500')).toBe('El monto mínimo es ₡1.000'));
  it('0 falla', () => expect(validateMonto('0')).toBe('Ingresa un monto válido'));
  it('ok', () => expect(validateMonto('10000')).toBeNull());
  it('con formato', () => expect(validateMonto('₡ 10.000')).toBeNull());
});

describe('validateNCoutas', () => {
  it('0 falla', () => expect(validateNCoutas(0)).toBe('Mínimo 1 cuota'));
  it('>120 falla', () => expect(validateNCoutas(121)).toBe('Máximo 120 cuotas'));
  it('ok', () => expect(validateNCoutas(12)).toBeNull());
  it('no entero falla', () => expect(validateNCoutas(1.5)).toBe('Mínimo 1 cuota'));
});

describe('validateTasa', () => {
  it('negativa falla', () => expect(validateTasa(-1)).toBe('La tasa no puede ser negativa'));
  it('>100 falla', () => expect(validateTasa(101)).toBe('La tasa parece muy alta'));
  it('0 ok', () => expect(validateTasa(0)).toBeNull());
  it('10 ok', () => expect(validateTasa(10)).toBeNull());
});

describe('validateFechaInicio', () => {
  it('vacío', () => expect(validateFechaInicio('')).toBe('La fecha inicial es obligatoria'));
  it('inválida', () => expect(validateFechaInicio('not-a-date')).toBe('Fecha inválida'));
  it('ok', () => expect(validateFechaInicio('2024-01-15')).toBeNull());
});

describe('buildInitialPrestamo', () => {
  it('estructura y fecha hoy', () => {
    const p = buildInitialPrestamo('cli-1');
    expect(p.clienteId).toBe('cli-1');
    expect(p.fechaInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('delegates a prestamosService', () => {
  it('getStatus', () => {
    const spy = vi.spyOn(prestamosService, 'getStatus').mockReturnValue('vigente');
    expect(getStatus({})).toBe('vigente');
    spy.mockRestore();
  });
  it('cuotaDelPeriodo', () => {
    const spy = vi.spyOn(prestamosService, 'cuotaDelPeriodo').mockReturnValue(100);
    expect(cuotaDelPeriodo({})).toBe(100);
    spy.mockRestore();
  });
  it('totalIntereses', () => {
    const spy = vi.spyOn(prestamosService, 'totalIntereses').mockReturnValue(500);
    expect(totalIntereses({})).toBe(500);
    spy.mockRestore();
  });
  it('totalAPagar', () => {
    const spy = vi.spyOn(prestamosService, 'totalAPagar').mockReturnValue(1500);
    expect(totalAPagar({})).toBe(1500);
    spy.mockRestore();
  });
  it('proximoCobro', () => {
    const spy = vi.spyOn(prestamosService, 'proximoCobro').mockReturnValue({ numero: 2 });
    expect(proximoCobro({})).toEqual({ numero: 2 });
    spy.mockRestore();
  });
  it('rutasUsadas dedup y sort', async () => {
    const spy = vi.spyOn(prestamosService, 'list').mockResolvedValue([{ ruta: 'B' }, { ruta: 'A' }, { ruta: 'B' }, { ruta: '' }]);
    const r = await rutasUsadas();
    expect(r).toEqual(['A', 'B']);
    spy.mockRestore();
  });
});
