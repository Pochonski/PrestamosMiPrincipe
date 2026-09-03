import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Inbox } from 'lucide-react';

describe('EmptyState', () => {
  it('renderiza title y description', () => {
    render(<EmptyState title="Vacío" description="desc" />);
    expect(screen.getByText('Vacío')).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
  });
  it('renderiza icon y action', () => {
    render(<EmptyState icon={Inbox} title="T" action={<button>Go</button>} />);
    expect(screen.getByText('Go')).toBeInTheDocument();
  });
});
