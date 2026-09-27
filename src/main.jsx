import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';
import RouteReporter from './components/RouteReporter.jsx';
import { applyTheme, getTheme } from './services/theme';
import { ToastViewport } from './components/ui/Toast';
import { AuthProvider } from './features/auth/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Solo en dev: exponer el cliente para debug manual en consola.
  window.__pmpQueryClient = queryClient;
}

// Registro interno para emitDataChanged (no depende de window en prod).
// Se guarda en globalThis con clave no enumerable para no exponer PII en consola.
if (typeof globalThis !== 'undefined') {
  try {
    Object.defineProperty(globalThis, '__pmpQueryClientRef', {
      value: { current: queryClient },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  } catch {
    globalThis.__pmpQueryClientRef = { current: queryClient };
  }
}

applyTheme(getTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RouteReporter />
        <AuthProvider>
          <App />
          <ToastViewport />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
