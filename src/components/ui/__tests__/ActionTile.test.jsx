import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionTile } from '../ActionTile';
import { Wallet } from 'lucide-react';

describe('ActionTile', () => {
  it('renderiza title y description', () => {
    render(<ActionTile icon={Wallet} title="Tit" description="desc" />);
    expect(screen.getByText('Tit')).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
  });
  it('onClick', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<ActionTile icon={Wallet} title="T" onClick={fn} />);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalled();
  });
});
