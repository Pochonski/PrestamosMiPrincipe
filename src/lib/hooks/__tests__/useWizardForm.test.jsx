import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardForm } from '../useWizardForm';

function makeSteps() {
  return [
    {
      fields: ['nombre'],
      validate: (v) => (!v.nombre || v.nombre.trim().length < 3 ? { nombre: 'error' } : {}),
    },
    {
      fields: ['telefono'],
      validate: (v) => (!v.telefono || String(v.telefono).replace(/\D/g, '').length !== 8 ? { telefono: 'error' } : {}),
    },
  ];
}

describe('useWizardForm', () => {
  it('inicia en paso 1', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: {} }));
    expect(result.current.step).toBe(1);
  });
  it('nextStep bloquea si inválido', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: 'ab' } }));
    let ok;
    act(() => { ok = result.current.nextStep(); });
    expect(ok).toBe(false);
    expect(result.current.step).toBe(1);
  });
  it('nextStep avanza si válido', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: 'Juan' } }));
    act(() => { result.current.set('telefono', '88888888'); });
    let ok;
    act(() => { ok = result.current.nextStep(); });
    expect(ok).toBe(true);
    expect(result.current.step).toBe(2);
  });
  it('set aplica formatter', () => {
    const formatters = { telefono: (v) => v.replace(/\D/g, '').slice(0, 4) };
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), formatters, initialValues: {} }));
    act(() => result.current.set('telefono', '8888-8888'));
    expect(result.current.values.telefono).toBe('8888');
  });
  it('touch agrega a Set', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: {} }));
    act(() => result.current.touch('nombre'));
    expect(result.current.touched.has('nombre')).toBe(true);
  });
  it('goToStep bloquea si intermedio inválido', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: '' } }));
    let ok;
    act(() => { ok = result.current.goToStep(2); });
    expect(ok).toBe(false);
  });
  it('prevStep vuelve', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: 'Juan', telefono: '88888888' } }));
    act(() => result.current.nextStep());
    expect(result.current.step).toBe(2);
    act(() => result.current.prevStep());
    expect(result.current.step).toBe(1);
  });
  it('reset vuelve a inicial', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: 'Juan' } }));
    act(() => result.current.set('nombre', 'Pedro'));
    act(() => result.current.reset());
    expect(result.current.values.nombre).toBe('Juan');
    expect(result.current.step).toBe(1);
  });
  it('allValid refleja errores', () => {
    const { result } = renderHook(() => useWizardForm({ steps: makeSteps(), initialValues: { nombre: 'Juan', telefono: '88888888' } }));
    expect(result.current.allValid).toBe(true);
    act(() => result.current.set('nombre', 'ab'));
    expect(result.current.allValid).toBe(false);
  });
});
