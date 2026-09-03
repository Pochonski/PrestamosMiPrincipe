import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../Alert';
import { Input } from '../Input';
import { ModalShell } from '../ModalShell';
import { Skeleton, SkeletonText } from '../Skeleton';
import { Spinner } from '../Spinner';
import { ErrorBoundary } from '../ErrorBoundary';
import { Avatar } from '../Avatar';

describe('coverage boost ui', () => {
  it('Alert todos tones', () => {
    render(<><Alert tone="danger" title="T">danger</Alert><Alert tone="warning">w</Alert><Alert tone="success">s</Alert><Alert tone="info">i</Alert></>);
    expect(screen.getByText('danger')).toBeInTheDocument();
  });
  it('Alert action', () => {
    render(<Alert tone="info" action={<button>act</button>}>x</Alert>);
    expect(screen.getByText('act')).toBeInTheDocument();
  });
  it('Input label hint error icon prefix trailing', () => {
    const Icon = () => <svg />;
    render(<Input label="Nombre" hint="opt" error="req" icon={Icon} prefix="$" trailing={<span>trail</span>} name="nombre" placeholder="hola" />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('req')).toBeInTheDocument();
  });
  it('Input textarea lg', () => {
    render(<Input as="textarea" label="Bio" size="lg" name="bio" />);
    expect(screen.getByText('Bio')).toBeInTheDocument();
  });
  it('ModalShell', () => {
    render(<ModalShell open={true} onClose={() => {}} title="T"><div>body</div></ModalShell>);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });
  it('Skeleton', () => {
    const { container } = render(<><Skeleton /><SkeletonText lines={2} /><Skeleton>child</Skeleton></>);
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });
  it('Spinner', () => {
    const { container } = render(<><Spinner /><Spinner size="lg" tone="navy" /><Spinner size="sm" tone="white" /></>);
    expect(container.firstChild).toBeInTheDocument();
  });
  it('Avatar isLightColor', () => {
    render(<Avatar nombre="Test User" color="#ffffff" />);
    expect(screen.getByText('TU')).toBeInTheDocument();
  });
  it('Avatar dark color', () => {
    render(<Avatar nombre="Ana" color="#000000" />);
    expect(screen.getByText('AN')).toBeInTheDocument();
  });
});
