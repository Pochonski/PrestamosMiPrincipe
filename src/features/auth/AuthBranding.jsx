import { Link } from 'react-router-dom';
import { Crown, ShieldCheck, Bell, BarChart3 } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { MeshGradient } from './components/MeshGradient';

const FEATURES = [
  { icon: ShieldCheck, label: 'Datos cifrados y aislados por organización' },
  { icon: Bell, label: 'Notificaciones automáticas de atrasos' },
  { icon: BarChart3, label: 'Reportes visuales en tiempo real' },
  { icon: Crown, label: 'Multi-usuario con roles y permisos' },
];

export function AuthBranding() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-12 text-white lg:flex">
      <MeshGradient />

      <div className="relative z-10">
        <Link to="/login" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow">
            <Logo withText={false} className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold">Préstamos</p>
            <p className="text-xs font-medium uppercase tracking-wider text-gold-400">Mi Príncipe</p>
          </div>
        </Link>
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Gestioná tu cartera
            <br />
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              con elegancia
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base text-navy-200">
            Plataforma premium para cobros de préstamos. Sincronizada en la nube,
            multi-usuario y diseñada para tu negocio.
          </p>
        </div>

        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f.label} className="flex items-center gap-3 text-sm text-navy-100">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <f.icon className="h-4 w-4 text-gold-400" />
              </span>
              {f.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-xs text-navy-300">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        Tus datos están cifrados y protegidos con RLS a nivel de fila.
      </div>
    </div>
  );
}