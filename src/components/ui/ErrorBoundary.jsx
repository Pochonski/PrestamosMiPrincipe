import React, { Component } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Card } from './Card';
import { IconBox } from './IconBox';
import { Button } from './Button';

function isChunkLoadError(err) {
  if (!err) return false;
  const msg = String(err.message || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  );
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary]', error, info?.componentStack);
    }
    if (isChunkLoadError(error) && typeof window !== 'undefined') {
      const key = `pmp:chunk-retry-${Date.now()}`;
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // ignore storage errors (private mode, quota, etc.)
      }
      window.location.reload();
    }
  }

  handleReload = () => {
    this.setState({ error: null });
    if (this.props.onReset) this.props.onReset();
  };

  handleReloadPage = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { fallbackTitle = 'Algo salió mal', fallbackMessage } = this.props;
    const chunk = isChunkLoadError(this.state.error);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center">
          <div className="mx-auto mb-4">
            <IconBox icon={AlertTriangle} tone="rose" size="lg" ring />
          </div>
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">
            {chunk ? 'Nueva versión disponible' : fallbackTitle}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-navy-300">
            {chunk
              ? 'Hay una actualización de la app. Estamos recargando automáticamente…'
              : fallbackMessage || 'Ocurrió un error inesperado al mostrar esta sección.'}
          </p>
          {this.state.error?.message && (
            <pre className="mt-3 max-h-32 overflow-auto rounded-input bg-neutral-100 p-3 text-left text-xs text-navy-700 dark:bg-navy-900 dark:text-navy-200">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="primary" icon={RotateCw} onClick={this.handleReload}>
              Reintentar
            </Button>
            <Button variant="secondary" onClick={this.handleReloadPage}>
              Recargar página
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
