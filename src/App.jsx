import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './features/dashboard';
import { ClientesPage } from './features/clientes';
import { ClienteDetalle } from './features/clientes/components/ClienteDetalle';
import { PrestamoCreatePage } from './features/prestamos';
import { PrestamoDetalle } from './features/prestamos/components/PrestamoDetalle';
import { CobroPage } from './features/cobros';
import { CobrarHoyPage } from './features/cobrar-hoy';
import { AtrasadosPage } from './features/atrasados';
import { NotificacionesPage } from './features/notificaciones';
import { ExportarPage } from './features/exportar';
import { RespaldoPage } from './features/respaldo';
import { ResumenPage } from './features/resumen';
import { ReportesPage } from './features/reportes';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { OnboardingPage } from './features/auth/OnboardingPage';
import { AuthGuard } from './features/auth/AuthGuard';
import { useNotificacionesAuto } from './features/notificaciones/hooks/useNotificacionesAuto';

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route
        path="/onboarding"
        element={
          <AuthGuard requireOrg={false}>
            <OnboardingPage />
          </AuthGuard>
        }
      />
      <Route
        path="*"
        element={
          <AuthGuard>
            <AppShellRoute />
          </AuthGuard>
        }
      />
    </Routes>
  );
}