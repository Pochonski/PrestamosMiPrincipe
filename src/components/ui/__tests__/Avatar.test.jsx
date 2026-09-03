import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('iniciales', () => {
    render(<Avatar nombre="Juan Pérez" />);
    expect(screen.getByText('JP')).toBeInTheDocument();
  });
  it('fallback ?', () => {
    render(<Avatar nombre="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
  it('una palabra', () => {
    render(<Avatar nombre="Ana" />);
    expect(screen.getByText('AN')).toBeInTheDocument();
  });
});
