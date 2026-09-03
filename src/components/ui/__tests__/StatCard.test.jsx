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
  it('renderiza sparkline cuando hay data', () => {
    const { container } = render(
      <StatCard label="L" value="1" spark={[10, 20, 15, 30]} />,
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
  it('sparkline con tone coloreado y valores no numéricos', () => {
    const { container } = render(
      <StatCard label="L" value="1" tone="gold" icon={Wallet} spark={[10, 'x', null, 30]} />,
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
  it('no renderiza sparkline con data insuficiente', () => {
    const { container } = render(<StatCard label="L" value="1" spark={[10]} />);
    expect(container.querySelector('.recharts-responsive-container')).not.toBeInTheDocument();
  });
});
