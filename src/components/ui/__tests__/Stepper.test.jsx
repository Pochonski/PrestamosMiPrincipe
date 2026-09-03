import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '../Stepper';

const steps = [{ num: 1, label: 'Uno' }, { num: 2, label: 'Dos' }, { num: 3, label: 'Tres' }];

describe('Stepper', () => {
  it('renderiza labels', () => {
    render(<Stepper steps={steps} current={2} />);
    expect(screen.getByText('Uno')).toBeInTheDocument();
    expect(screen.getByText('Tres')).toBeInTheDocument();
  });
  it('onJump', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<Stepper steps={steps} current={1} onJump={fn} />);
    await user.click(screen.getByLabelText(/Paso 2/));
    expect(fn).toHaveBeenCalledWith(2);
  });
  it('sin onJump disabled', () => {
    render(<Stepper steps={steps} current={1} />);
    expect(screen.getByLabelText(/Paso 1/).disabled).toBe(true);
  });
});
