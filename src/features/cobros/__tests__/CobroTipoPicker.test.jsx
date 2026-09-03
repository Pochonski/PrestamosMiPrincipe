import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CobroTipoPicker } from '../components/CobroTipoPicker';

describe('CobroTipoPicker', () => {
  it('renderiza tipos', () => {
    render(<CobroTipoPicker value="interes" onChange={() => {}} />);
    expect(screen.getByText('Pago de interés')).toBeInTheDocument();
    expect(screen.getByText('Abono a capital')).toBeInTheDocument();
  });
  it('onChange al click', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<CobroTipoPicker value="interes" onChange={fn} />);
    await user.click(screen.getByText('Abono a capital'));
    expect(fn).toHaveBeenCalledWith('capital');
  });
});
