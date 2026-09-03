import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '../Logo';

describe('Logo', () => {
  it('con texto', () => {
    render(<Logo />);
    expect(screen.getByText('Príncipe')).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes('Mi'))).toBeInTheDocument();
  });
  it('sin texto', () => {
    render(<Logo withText={false} />);
    expect(screen.queryByText('Príncipe')).not.toBeInTheDocument();
  });
});
