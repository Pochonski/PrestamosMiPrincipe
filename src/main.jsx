import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { applyTheme, getTheme } from './services/theme';
import { ToastViewport } from './components/ui/Toast';
import { AuthProvider } from './features/auth/AuthContext';

applyTheme(getTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastViewport />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);