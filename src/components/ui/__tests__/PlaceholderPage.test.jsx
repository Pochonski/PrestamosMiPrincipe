import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaceholderPage } from '../PlaceholderPage';

describe('PlaceholderPage', () => {
  it('renderiza titulo y descripcion', () => {
    render(<PlaceholderPage titulo="Tit" descripcion="Desc" />);
    expect(screen.getByText('Tit')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});
