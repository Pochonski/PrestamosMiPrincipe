import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionTitle } from '../SectionTitle';

describe('SectionTitle', () => {
  it('renderiza title', () => {
    render(<SectionTitle title="Hola" />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
  it('renderiza action', () => {
    render(<SectionTitle title="T" action={<button>act</button>} />);
    expect(screen.getByText('act')).toBeInTheDocument();
  });
});
