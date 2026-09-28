<div align="center">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Vitest-3-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest"/>
  <img src="https://img.shields.io/badge/Playwright-1-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/>
</div>

<br/>

<div align="center">

# Préstamos Mi Príncipe 👑

**La plataforma premium para gestionar cobros de préstamos en Costa Rica.**

*Tus cobradores en la calle. Tu cartera bajo control. Tus datos a salvo.*

Multi-tenant · Solo-intereses · Mobile-first · En la nube

[Cómo funciona](#-modelo-solo-intereses--abonos-a-capital) · [Features](#-features) · [Quickstart](#-quickstart-dev)

</div>

<br/>

## 💼 Propuesta de valor

Si prestás dinero con cobro por rutas, sabés que el negocio se gana **en la calle**: cobrar a tiempo, no perder un solo pago y saber cada día cuánto entró, cuánto falta y quién está atrasado.

Préstamos Mi Príncipe pone esa operación completa en el bolsillo de cada cobrador:

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  COBRAR HOY │ ──▶ │ ABONAR/INTERÉS│ ──▶ │  LIQUIDADO 🎉 │
│  lista del  │     │ recalcula las │     │  saldo en 0,  │
│  día + mora │     │ cuotas solas  │     │  cierre auto  │
└─────────────┘     └──────────────┘     └───────────────┘
```

- **Para el cobrador**: lista de cobros del día, atrasados con días de mora, registro de pagos en segundos desde el celular — incluso con fecha retroactiva si cobró ayer y lo registra hoy.
- **Para el dueño**: dashboard con cartera total, morosidad, cobrado hoy vs ayer, top clientes y morosos, reportes por mes y por ruta, exportación a Excel y respaldo completo en JSON.
- **Para el equipo**: organizaciones con roles (owner, admin, cobrador, viewer), invitaciones por link y cada quien ve solo los datos de su organización.

<br/>

## 🧮 Modelo: solo-intereses + abonos a capital

El corazón del producto. Tus clientes pagan **intereses periódicamente** y **abonan capital cuando pueden**. Cuando el saldo llega a cero, el préstamo se liquida solo.

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

Cliente abona 50.000 → saldo = 0 → préstamo LIQUIDADO 🎉
```

**Reglas clave:**
- Cada cuota vale `saldoCapital × tasa%` — se **recalcula sola** después de cada abono
- El abono a capital con intereses atrasados muestra un **aviso + confirmación explícita** (decisión de producto: no bloquea, informa)
- Si las cuotas se agotan pero queda saldo, se **extienden** con un tap
- Los cobros aceptan **fecha de pago retroactiva** (lo cobrado ayer se reporta ayer)
- Solo se puede editar/eliminar el **último cobro** — el libro es inmutable por diseño

<br/>

## ✨ Features

| Módulo | Qué hace |
|---|---|
| **Clientes** | CRUD con validación de cédula y teléfono costarricenses (auto-formato en vivo). Formulario multi-paso optimizado para mobile. |
| **Préstamos** | Wizard de 5 pasos: ruta, período (diario → mensual / día del mes), monto, cuotas, fechas. Calendario visual y detalle con cronograma. |
| **Cobros** | Pago de interés o abono a capital, con o sin interés incluido. Vista previa del nuevo saldo antes de confirmar. |
| **Cobrar hoy** | La pantalla del cobrador: lo que vence hoy + atrasos, con totales del día y conciliación del mes. |
| **Atrasados** | Mora ordenada por días de atraso, con totales para accionar. |
| **Dashboard** | Cartera, morosidad, cobrado hoy vs ayer, actividad reciente y accesos rápidos. |
| **Resumen** | KPIs con filtros por fecha y ruta, top clientes, top morosos, saldos por ruta y sparklines. |
| **Reportes** | Charts SVG puros (cero librerías): cobros 6 meses, dona por estado, series diarias. |
| **Comisiones** | Proyección de ganancia del acreedor separada del interés base. |
| **Exportar** | CSV compatible con Excel (con BOM y protección anti-fórmulas) de clientes, préstamos y cobros — siempre completo, sin truncar. |
| **Respaldo** | Backup JSON con validación de integridad y restauración guiada por fusión. |
| **Notificaciones** | Avisos automáticos de atrasos y cobros del día. Lectura con un tap. |
| **Organizaciones** | Multi-tenant real: invitaciones por link con expiración, roles owner/admin/cobrador/viewer y RLS a nivel de fila. |
| **Auth premium** | Login con glass morphism + mesh gradient. Email + contraseña. Onboarding con creación de organización. |

<br/>

## 🔒 Seguridad y confianza

- **Tus datos son solo tuyos**: cada organización vive aislada con políticas de acceso a nivel de fila en Postgres.
- **Roles con mínimo privilegio**: el viewer solo mira; el cobrador cobra pero no administra.
- **Respaldo descargable**: tu información sale en JSON cuando quieras — sin vendor lock-in.
- **Defensa en profundidad**: validación en UI + reglas en base de datos + auditoría de seguridad P0 aplicada.

<br/>

## 🚀 Quickstart dev

**Requisitos:** Node 22+ · cuenta de Supabase (o CLI local para e2e).

```bash
# 1. Instalar
npm install

# 2. Configurar entorno
cp .env.example .env
# Completar con tu proyecto: Supabase Dashboard → Settings → API
#   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# 3. Aplicar esquema en Supabase
#    Dashboard → SQL Editor → pegar y correr, en orden:
#    supabase/migrations/*.sql  (o src/features/auth/sql/migrations/*)
#    ⚠️ IMPORTANTE en prod: aplicar también
#    supabase/migrations/20260928000000_prod_hardening_p0.sql

# 4. Desarrollo
npm run dev        # app en http://localhost:5173

# 5. Calidad
npm run lint           # oxlint
npm test               # vitest (708 tests)
npm run test:coverage  # exige 95/83/92/95 (líneas/ramas/funcs/stmts)
npm run test:e2e       # playwright (requiere `supabase start` local)

# 6. Producción
npm run build      # → dist/ (desplegado en Vercel)
```

**Estructura:**

```
src/
├── main.jsx                 ← BrowserRouter + React Query + AuthProvider
├── App.jsx                  ← rutas lazy (code-splitting por feature)
├── lib/                     ← utils puros (fechas CR, formato ₡, eventos)
├── services/                ← acceso a datos (Supabase + RPCs transaccionales)
├── components/ui|layout/    ← primitivas + AppShell/Sidebar/BottomNav
└── features/                ← 14 features autocontenidas
    ├── auth/ clientes/ prestamos/ cobros/ cobrar-hoy/ atrasados/
    ├── dashboard/ resumen/ reportes/ comisiones/
    ├── notificaciones/ exportar/ respaldo/ organizations/ prestamos-lista/
supabase/migrations/         ← esquema + RLS + RPCs (aplicar en orden)
```

<br/>

## 🛠 Stack

| Capa | Tecnología |
|---|---|
| Build | Vite 8 (chunks por vendor: react, supabase, router, query) |
| UI | React 19 + Tailwind CSS 3 (paleta gold/navy) + Lucide |
| Routing | React Router 7 (SPA con rewrites en Vercel) |
| Auth + DB | Supabase (Auth, RLS, Postgres, RPCs `security definer`) |
| Data | TanStack Query (stale 5 min, invalidación por eventos) |
| Testing | Vitest + Testing Library + MSW · Playwright e2e |

**Bundle:** JS ~868 KB raw / ~269 KB gzip · CSS ~69 KB raw / ~12 KB gzip · 10 tablas · 30+ políticas RLS.

<br/>

## 🎨 Visual

- **Gold** `#D4AF37` · **Navy** `#0F172A` · **Emerald** `#10b981` · **Rose** `#f43f5e` · **Sky** `#0ea5e9`
- Login premium split-screen con mesh gradient animado + glass morphism
- Dashboard con KPIs, charts SVG responsive y bottom-nav mobile de 5 items

<br/>

## 📄 Licencia

MIT — Hecho con cariño en Costa Rica 🇨🇷
