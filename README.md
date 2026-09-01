<div align="center">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router"/>
</div>

<br/>

# Préstamos Mi Príncipe

> **La app premium para gestión de cobros de préstamos en Costa Rica.**
> Multi-tenant · Solo-intereses · En la nube · Mobile-first

<br/>

Una plataforma de cobros diseñada para el mercado costarricense, con un modelo de negocio de **"solo intereses" + abonos a capital**. Tus clientes pagan intereses periódicamente y abonan capital cuando pueden. Cuando el saldo llega a cero, el préstamo se liquida automáticamente.

<br/>

## Features

| | |
|---|---|
| **Clientes** | CRUD completo con validaciones de cédula y teléfono costarricenses. Multi-step form optimizado para mobile. |
| **Préstamos** | Wizard de 5 pasos: ruta, período, monto, cuotas, fechas. Calendario visual de pagos. |
| **Cobros** | Registrar pagos de interés o capital. Validación "intereses al día". Extensión automática de cuotas. |
| **Multi-tenant** | Cada organización ve solo sus datos. RLS a nivel de fila en Supabase. |
| **Reportes** | Charts SVG: cobros por mes, estado de préstamos, top rutas. |
| **Notificaciones** | Auto-generadas al haber atrasos o cobros del día. Marcar como leídas con un tap. |
| **Exportar / Respaldar** | CSV por dataset. Backup JSON con schema validation y restore. |
| **Auth Premium** | Login con glass morphism + mesh gradient. Email + Google. Multi-organización. |

<br/>

## Modelo de negocio

El corazón de la app es el modelo de **"solo intereses + abonos a capital"**:

```
Cliente: Juan Pérez
Capital: 100.000  ·  Tasa: 8%  ·  Cuotas: 2
─────────────────────────────────────────
                  │
   ┌──────────────┴──────────────┐
   │                             │
   ▼                             ▼
Cuota #1: 8.000 interés       Cliente abona 50.000
(saldo sigue 100.000)         → saldo = 50.000
                               → próximas cuotas: 4.000
   │
   ▼
Cuota #2: 4.000 interés (recalculado)
(saldo sigue 50.000)

Cliente abona 50.000 → saldo = 0 → préstamo LIQUIDADO
```

**Reglas clave:**
- Cada cuota tiene un monto = `saldoCapital × tasa%`
- Al pagar capital, se recalculan las cuotas restantes
- Si el saldo llega a 0, el préstamo se marca como `cancelado` automáticamente
- Si las cuotas se agotan pero queda saldo, hay que **extender** manualmente
- No se puede abonar capital sin tener las cuotas de interés al día

<br/>

## Stack técnico

| Capa | Tecnología | Rol |
|---|---|---|
| Build | Vite 8 | Bundler y dev server |
| UI | React 19 | Componentes, hooks, context |
| Styling | Tailwind CSS 3 | Utility-first con paleta gold/navy |
| Routing | React Router 7 | Client-side SPA |
| Auth + DB | Supabase | Auth, RLS, Postgres, Realtime-ready |
| State | localStorage (theme) | Persistencia liviana de UI |

<br/>

## Arquitectura

```
src/
├── main.jsx                    ← BrowserRouter + AuthProvider
├── App.jsx                     ← React Router (rutas)
│
├── lib/                        ← utils compartidos
│   ├── supabase.js             ← cliente singleton
│   ├── format.js               ← CRC, fechas, parseLocalDate
│   ├── dates.js                ← addDays, addMonths, firstCuotaDate
│   ├── events.js               ← emitDataChanged
│   ├── color.js                ← colorFor(id)
│   ├── number.js               ← parseMontoNumber
│   ├── id.js                   ← uid
│   └── resumen.js              ← statsCliente, getResumenPrestamo
│
├── services/                   ← infraestructura + dominio
│
├── components/
│   ├── ui/                     ← primitivas: Card, Badge, StatCard
│   └── layout/                 ← AppShell, TopBar, Sidebar, BottomNav
│
└── features/                   ← cada feature autocontenida
    ├── auth/                   ← AuthContext, Login, Signup, Onboarding
    ├── dashboard/              ← KPIs, acciones rápidas, actividad
    ├── clientes/               ← CRUD + multi-step form + detalle
    ├── prestamos/              ← wizard 5 pasos + detalle + calendario
    ├── cobros/                 ← form de pago (interés/capital)
    ├── cobrar-hoy/             ← lista filtrada por fecha
    ├── atrasados/              ← lista filtrada por atrasos
    ├── notificaciones/         ← bandeja con auto-gen
    ├── resumen/                ← KPIs + top clientes + últimos cobros
    ├── reportes/               ← charts SVG puros
    ├── exportar/               ← CSV download
    └── respaldo/               ← JSON backup/restore
```

**Reglas de import** (resumen):

| Capa | Puede importar |
|---|---|
| `lib/` | nada del proyecto |
| `services/` | `lib/` |
| `components/ui` | `lib/` |
| `components/layout` | `components/ui`, `lib/`, `services/` |
| `features/X/selectors` | `services/`, `lib/` |
| `features/X/hooks` | `features/X/selectors`, `services/`, `lib/` |
| `features/X/components` | `components/`, `features/X/hooks`, `lib/` |

<br/>

## Métricas del proyecto

| | |
|---|---|
| Tablas en Supabase | **8** (organizations, org_members, profiles, clientes, prestamos, cuotas, cobros, notificaciones) |
| Features completas | **11** (auth, dashboard, clientes, prestamos, cobros, cobrar-hoy, atrasados, notificaciones, resumen, reportes, exportar, respaldo) |
| RLS policies | **30+** con `to authenticated` y `security definer` para casos edge |
| Bundle JS | ~700 kB (gzip 180 kB) |
| Bundle CSS | ~47 kB (gzip 8 kB) |
| Componentes UI | ~15 primitivas reutilizables |
| Hooks custom | ~10 |
| Lint warnings | solo pre-existentes del scaffold original |

<br/>

## Visual

La UI usa una paleta consistente:
- **Gold** `#D4AF37` como acento principal
- **Navy** `#0F172A` como color de texto y fondos oscuros
- **Emerald** `#10b981` para éxito
- **Rose** `#f43f5e` para alertas
- **Sky** `#0ea5e9` para información

Componentes destacados:
- **Login premium**: split screen con mesh gradient animado + glass morphism
- **Dashboard**: KPIs en grid, acciones rápidas, actividad reciente
- **Charts**: SVG puros (sin librerías), responsive en mobile
- **Bottom nav mobile**: 6 items, swipe-friendly

<br/>

## Licencia

MIT — Hecho con cariño en Costa Rica
</content>
