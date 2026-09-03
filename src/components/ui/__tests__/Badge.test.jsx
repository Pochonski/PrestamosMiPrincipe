import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renderiza children', () => {
    render(<Badge>hola</Badge>);
    expect(screen.getByText('hola')).toBeInTheDocument();
  });
  it('tone danger', () => {
    const { container } = render(<Badge tone="danger">x</Badge>);
    expect(container.firstChild.className).toContain('danger');
  });
});
