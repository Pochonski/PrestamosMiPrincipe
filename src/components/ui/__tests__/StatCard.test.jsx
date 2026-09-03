import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';
import { Wallet } from 'lucide-react';

describe('StatCard', () => {
  it('renderiza label y value', () => {
    render(<StatCard label="Total" value="₡1000" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('₡1000')).toBeInTheDocument();
  });
  it('sub y delta', () => {
    render(<StatCard label="L" value="1" sub="sub" delta={5.5} icon={Wallet} />);
    expect(screen.getByText('sub')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();
  });
  it('delta negativo', () => {
    render(<StatCard label="L" value="1" delta={-2} />);
    expect(screen.getByText('2.0%')).toBeInTheDocument();
  });
});
