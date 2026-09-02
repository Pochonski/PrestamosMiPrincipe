import { lazy, Suspense, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useNotificacionesAuto } from './features/notificaciones/hooks/useNotificacionesAuto';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from './features/auth/AuthGuard';

const LoginPage = lazy(() => import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./features/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const OnboardingPage = lazy(() => import('./features/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

const DashboardPage = lazy(() => import('./features/dashboard').then((m) => ({ default: m.DashboardPage })));
const ClientesPage = lazy(() => import('./features/clientes').then((m) => ({ default: m.ClientesPage })));
const ClienteDetalle = lazy(() => import('./features/clientes/components/ClienteDetalle').then((m) => ({ default: m.ClienteDetalle })));
const PrestamoCreatePage = lazy(() => import('./features/prestamos').then((m) => ({ default: m.PrestamoCreatePage })));
const PrestamoDetalle = lazy(() => import('./features/prestamos/components/PrestamoDetalle').then((m) => ({ default: m.PrestamoDetalle })));
const CobroPage = lazy(() => import('./features/cobros').then((m) => ({ default: m.CobroPage })));
const CobrarHoyPage = lazy(() => import('./features/cobrar-hoy').then((m) => ({ default: m.CobrarHoyPage })));
const AtrasadosPage = lazy(() => import('./features/atrasados').then((m) => ({ default: m.AtrasadosPage })));
const NotificacionesPage = lazy(() => import('./features/notificaciones').then((m) => ({ default: m.NotificacionesPage })));
const ExportarPage = lazy(() => import('./features/exportar').then((m) => ({ default: m.ExportarPage })));
const RespaldoPage = lazy(() => import('./features/respaldo').then((m) => ({ default: m.RespaldoPage })));
const ResumenPage = lazy(() => import('./features/resumen').then((m) => ({ default: m.ResumenPage })));
const ReportesPage = lazy(() => import('./features/reportes').then((m) => ({ default: m.ReportesPage })));

const pages = {
  dashboard: DashboardPage,
  clientes: ClientesPage,
  'cliente-detalle': ClienteDetalle,
  'registrar-prestamo': PrestamoCreatePage,
  'prestamo-detalle': PrestamoDetalle,
  cobro: CobroPage,
  'cobrar-hoy': CobrarHoyPage,
  atrasados: AtrasadosPage,
  notificaciones: NotificacionesPage,
  exportar: ExportarPage,
  respaldar: RespaldoPage,
  resumen: ResumenPage,
  reportes: ReportesPage,
};

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
    </div>
  );
}

function AppShellRoute() {
  useNotificacionesAuto();
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});

  function handleNavigate(id, newParams = {}) {
    setPage(id);
    setParams(newParams);
  }

  return (
    <AppShell pages={pages} page={page} params={params} onNavigate={handleNavigate} />
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<PageFallback />}>
            <SignupPage />
          </Suspense>
        }
      />
      <Route
        path="/forgot"
        element={
          <Suspense fallback={<PageFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />
      <Route
        path="/onboarding"
        element={
          <AuthGuard requireOrg={false}>
            <Suspense fallback={<PageFallback />}>
              <OnboardingPage />
            </Suspense>
          </AuthGuard>
        }
      />
      <Route
        path="*"
        element={
          <AuthGuard>
            <Suspense fallback={<PageFallback />}>
              <AppShellRoute />
            </Suspense>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;