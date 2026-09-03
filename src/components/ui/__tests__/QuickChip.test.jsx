import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickChip } from '../QuickChip';
import { Plus } from 'lucide-react';

describe('QuickChip', () => {
  it('renderiza label', () => {
    render(<QuickChip label="Chip" />);
    expect(screen.getByText('Chip')).toBeInTheDocument();
  });
  it('badge >0 visible', () => {
    render(<QuickChip label="X" badge={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  it('badge 0 no visible', () => {
    render(<QuickChip label="X" badge={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
  it('onClick', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<QuickChip label="C" onClick={fn} icon={Plus} />);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalled();
  });
});
