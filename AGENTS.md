# AgendaYa (agendalisto) - Project Guidelines

## Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v3
- **Icons:** lucide-react, react-icons
- **State:** Redux Toolkit + redux-persist
- **Backend:** Supabase (JS client v2)
- **Deploy:** Netlify (Node 20)

## Supabase

- Cliente en `src/lib/supabase.ts` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Queries tipadas con el JS client. Sin SQL raw.
- ⚠️ **Multi-app coexistence**: AgendaYa comparte instancia Supabase. Ver sección CRITICAL abajo.
- ⚠️ **`handle_new_user()` canónico** en `../supabase-shared/handle_new_user.sql`. NO redefinir aquí.
- ⚠️ **Tablas con prefijo `agendaya_`** (ej: `agendaya_profiles`, `agendaya_businesses`). Nunca nombres genéricos.

## ⚠️ CRITICAL: Multi-app Supabase Coexistence

Este proyecto comparte la instancia de Supabase con otras aplicaciones (`lexigo`, `encuentrosvip`, `guild_portal`).
Todas las apps usan el mismo `VITE_SUPABASE_URL` y la misma `VITE_SUPABASE_ANON_KEY`.

### Arquitectura

El ecosistema usa 4 piezas que trabajan juntas. Entender cada una es crítico para no romper nada.

#### `auth.users` — El núcleo de identidad

- Tabla interna de Supabase Auth. La crea y gestiona Supabase automáticamente.
- Cada fila = un usuario registrado con email + password.
- `raw_user_meta_data` contiene datos que el frontend envió al registrarse (display_name, role, etc.).
- **⚠️ `raw_user_meta_data` NO es confiable.** Viene del cliente. Por eso existe `sanitize_signup_role()` — nunca confiar en `role` o `plan` sin sanitizar.
- El trigger `on_auth_user_created` sobre `auth.users` es **el punto único de fallo** de todo el ecosistema. Si se desactiva o se reescribe mal, ninguna app recibe usuarios nuevos.

#### `apps` — El catálogo de aplicaciones

- Tabla maestra que lista qué apps existen.
- Es **documental/organizacional** — ninguna FK apunta a ella. Si se borra, no rompe nada funcionalmente.

#### `user_apps` — La matriz de membresía

- Una fila por cada {usuario, app}. Cada app puede tener su propio rol para el mismo usuario.
- `role` se sincroniza automáticamente desde `{app}_profiles.role` vía el trigger `sync_profile_role`.
- `status = 'active'` permite desactivar a un usuario en una app sin afectar las demás.
- **Ejemplo:** Un usuario admin en encuentrosvip puede ser visitor en agendaya.

#### `{app}_profiles` — Los datos específicos de cada app

- Cada app tiene su propia tabla con el esquema que necesita.
- **`agendaya_profiles` es la única fuente de verdad para el rol.** El frontend lee el rol exclusivamente de `agendaya_profiles`. Nunca consultar `user_apps` desde el frontend para detectar el rol actual.
- **NUNCA** consultar, modificar o dropear la tabla `{app}_profiles` de otra app.

### `handle_new_user()` — El punto único de fallo

- **Canónica en:** `../supabase-shared/handle_new_user.sql`
- **NUNCA redefinir** en archivos SQL del proyecto.
- La función inserta perfiles para TODAS las apps registradas. Cada app externa va envuelta en `BEGIN/EXCEPTION` para tolerancia a fallos.
- **Caso real (lo que pasó):** EncuentrosVIP ejecutó `cleanup_profiles.sql` que reescribió `handle_new_user()` solo para su app. AgendaYa dejó de recibir perfiles de usuarios nuevos → login roto por semanas.

**Regla:** Toda modificación a `handle_new_user()` o al trigger `on_auth_user_created` debe verificarse contra TODAS las apps registradas. No alcanza con no romper tu app — hay que asegurar que las otras sigan funcionando.

### `sanitize_signup_role()` — Sanitización de roles

- Definida en `../supabase-shared/sanitize_signup_role.sql`.
- AgendaYa la extiende para permitir: `'visitor'`, `'business_owner'`. Cualquier otro rol enviado desde el cliente se degrada a `'visitor'`.
- `admin` y `moderator` solo asignables vía DB/Supabase por un admin existente.

### `ensureUserApp()` — Late registration (anti-huérfanos)

- RPC definido en `../supabase-shared/ensure_user_app.sql`.
- Cuando un usuario registrado en otra app (ej: EncuentrosVIP) entra a AgendaYa por primera vez, NO existe su `agendaya_profiles` ni `user_apps` para AgendaYa.
- El frontend debe llamar a `ensureUserApp(userId, 'agendaya')` si no encuentra perfil.
- **`obtenerPerfilUsuario()` en `src/lib/api.ts:467` ya implementa fallback inline** vía `ensure_user_app`. Si no encuentra perfil, llama al RPC, espera 500ms y reintenta.

### Flujo de registro para AgendaYa

```
Usuario se registra → supabase.auth.signUp()
  → on_auth_user_created TRIGGER
    → handle_new_user() (en supabase-shared/) ejecuta:
      1. SANITIZA rol via sanitize_signup_role()
      2. INSERT INTO lexigo_profiles / user_apps (lexigo)
      3. INSERT INTO encuentrosvip_profiles / user_apps (encuentrosvip)  → BEGIN/EXCEPTION
      4. INSERT INTO agendaya_profiles (id, role, full_name, email)     → BEGIN/EXCEPTION
      5. INSERT INTO user_apps (..., app_slug='agendaya')               → BEGIN/EXCEPTION
      6. INSERT INTO user_apps (..., app_slug='guild_portal')           → BEGIN/EXCEPTION
```

### ⚠️ Reglas ABSOLUTAS

1. **TODA tabla nueva debe tener prefijo `agendaya_`.** Jamás crear tabla sin prefijo.
2. **NUNCA modificar tablas, funciones, triggers o policies de otras apps.**
3. **NUNCA reescribir `handle_new_user()`** — la canónica está en `../supabase-shared/handle_new_user.sql`. Cualquier cambio debe hacerse ahí y coordinarse con las otras 3 apps.
4. **NUNCA hacer `DROP TABLE`** sin verificar que la tabla pertenece a AgendaYa.
5. **Siempre usar `IF EXISTS` / `IF NOT EXISTS`** en migraciones.
6. **NUNCA confiar en `raw_user_meta_data` sin sanitizar.** Siempre usar `sanitize_signup_role()`.
7. **CADA app externa en `handle_new_user()`** debe ir envuelta en `BEGIN/EXCEPTION`. Una tabla faltante NO debe bloquear el registro global.
8. **NUNCA hacer `DROP TRIGGER on_auth_user_created`** sin coordinación cross-app.
9. **Mantener sincronizados `{app}_profiles.role` y `user_apps.role`.** El trigger `sync_profile_role` en EncuentrosVIP sincroniza automáticamente.

### ⚠️ Reglas RLS (Row Level Security)

1. **Solo `auth.uid() = user_id` en policies.** Nunca usar subconsultas a otras tablas.
2. **`agendaya_profiles` es la única fuente de verdad para el rol.**
3. **Toda migración RLS debe limpiar policies anteriores.** Usar `DO $$ ... DROP ALL`.
4. **`user_apps` NO debe tener RLS.** Es compartida.
5. **Nombres de policy con prefijo `agendaya_`.**

### Mapa de tablas por app

| App | Prefijo | Tablas |
|---|---|---|
| `lexigo` | `lexigo_` | `profiles`, `courses`, `lessons`, `exercises`, `enrollments`, `xp_transactions`, `achievements`, `streaks`, `reviews`, `tutoring_sessions`, `notifications`, `subscriptions` |
| `encuentrosvip` | `encuentrosvip_` | `profiles`, `media`, `reviews`, `favorites`, `verifications` |
| `agendaya` | `agendaya_` | `profiles`, `businesses`, `services`, `business_hours`, `business_config`, `appointments`, `reviews`, `user_likes`, `blog_posts`, `blog_comments`, `blog_likes`, `chat_messages`, `milestones`, `business_categories` |
| `guild_portal` | `guild_portal_` | `config`, `game_rewards_log`, `game_sessions`, `guide_comments`, `guide_votes`, `guides`, `raid_registrations`, `roster_players`, `schedule_votes`, `section_comments`, `redemption_codes`, `blog_comment_likes`, `blog_comments`, `blog_likes`, `blog_posts` |
| Compartidas | — | `apps`, `user_apps`, `auth.users` |

### Checklist de seguridad para migraciones SQL

- [ ] La migración no contiene `DROP TABLE`, `DROP SCHEMA` ni `TRUNCATE` sobre tablas ajenas
- [ ] `handle_new_user()` conserva soporte para todas las apps
- [ ] Las nuevas policies RLS no afectan tablas de otras apps
- [ ] Las nuevas funciones/triggers usan prefijo `agendaya_`
- [ ] Los `REFERENCES` en FK apuntan a tablas con el prefijo correcto
- [ ] `raw_user_meta_data` sanitizado
- [ ] Las funciones `SECURITY DEFINER` no exponen datos de otras apps

### Cómo agregar una nueva app al ecosistema

1. Registrar en `public.apps`: `INSERT INTO apps (slug, name) VALUES ('miapp', 'Mi App')`
2. Crear tablas con prefijo `miapp_`
3. Agregar inserción en `handle_new_user()` (en `../supabase-shared/handle_new_user.sql`)
4. Crear RLS policies

### Referencia

- `handle_new_user()` canónico: `../supabase-shared/handle_new_user.sql`
- `sanitize_signup_role()` canónico: `../supabase-shared/sanitize_signup_role.sql`
- `ensureUserApp()` RPC: `../supabase-shared/ensure_user_app.sql`

## Roles, Planes y Flujo de Usuario

### Roles (5 niveles)

Definidos en `src/lib/roles.ts:3`. El frontend compara por índice (`ROLES.indexOf`) para permisos.

| Role | Índice | Auto-asignable | Acceso principal |
|---|---|---|---|
| `visitor` | 0 | ✅ | Solo páginas públicas (Home, Explorar, Blog, perfil público de negocio) |
| `client` | 1 | ✅ | `/dashboard` (perfil, historial), reservar servicios en `/:slug/book/:serviceId`, escribir reseñas |
| `business_owner` | 2 | ✅ | `/business/dashboard` (CRUD servicios, horarios, citas, clientes, config), gestionar negocio |
| `moderator` | 3 | ❌ (solo admin) | Dashboard sin gestionar negocios |
| `admin` | 4 | ❌ (solo admin) | Acceso total |

**Helper functions** en `src/lib/roles.ts:104-115`:
- `canAccessDashboard()` → `business_owner`, `admin`, `moderator`
- `canManageBusiness()` → `business_owner`, `admin`
- `canBook()` → `client`, `business_owner`, `moderator`, `admin`

**Protección DB:** Trigger `trg_protect_agendaya_profile` (mig `006_roles_plans.sql:53`) evita auto-asignación de `admin`/`moderator`. Sincronización a `user_apps` vía `trg_sync_agendaya_profile_role`.

### Planes (3 niveles)

Definidos en `src/lib/roles.ts:16-92`. Pricing en COP mensual.

| Plan | Precio | Score búsq. | Negocios | Servicios | Features clave |
|---|---|---|---|---|---|
| `starter` | Gratis | 0 | 1 | 5 | Perfil público, gestión manual de citas, notificaciones email |
| `pro` | $49.900 | 2 | 1 | ∞ | WhatsApp, analytics básicos, badge "Pro", posición prioritaria |
| `premium` | $99.900 | 3 | 3 | ∞ | Todo Pro + analytics avanzados, branding personalizado, badge "Premium", posición destacada |

**`plan_score`** se replica de `agendaya_profiles.plan` → `agendaya_businesses.plan_score` vía triggers (`trg_compute_agendaya_plan_score`, `trg_recompute_agendaya_business_plan_score`). Búsquedas ordenan por `plan_score DESC`.

**Pago:** PayPal vía Netlify Functions (`create-paypal-order.ts`, `capture-paypal-order.ts`). Persiste en `agendaya_subscriptions` (mig `008_agendaya_subscriptions.sql`).

### Flujo de usuario

```
Visitante anónimo → navega páginas públicas
       │
       ├─ Registro → auth.users → handle_new_user() → agendaya_profiles (role=visitor, plan=starter)
       │
       └─ Login → obtenerPerfilUsuario()
                      ├─ Si existe perfil → backfill business_id si es null → Redux store
                      └─ Si NO existe (PGRST116) → ensure_user_app RPC → espera 500ms → reintenta

VISITOR
  ├─ Botón "Activar cuenta de cliente" en /dashboard → updateProfileRole('client')
  │
  └─ Botón "Registrar mi negocio" → /business/register → createBusiness()
       └─ updateProfileRole('business_owner') + is_business=true + business_id seteado

CLIENT
  ├─ /dashboard (perfil, historial de citas)
  ├─ /business/register → se convierte en BUSINESS_OWNER
  └─ /:slug/book/:serviceId (reservar cita)

BUSINESS_OWNER
  ├─ /business/dashboard (tabs: Citas, Servicios, Clientes, Configuración)
  ├─ /plans → PayPalSubscribeButton para upgrade a Pro/Premium
  └─ Plan define: max negocios, max servicios, analytics, badge, posición búsqueda
```

### Rutas protegidas

Definidas en `src/App.tsx:217-263` con `ProtectedRoute` (compara índices de `ROLES`).

| Ruta | Componente | `requiredRole` | Acceso |
|---|---|---|---|
| `/` | Home | — | Público |
| `/login`, `/register`, `/forgot-password` | Login, Register, ForgotPassword | — | Público |
| `/explore` | ExploreBusinesses | — | Público |
| `/plans` | Plans | — | Público |
| `/blog`, `/blog/:id` | Blog, BlogPostView | — | Público |
| `/:slug` | BusinessPublicPage | — | Público |
| `/:slug/book/:serviceId` | BookingPage | `client` | client+ |
| `/dashboard` | ProfileDashboard | `client` | client+ |
| `/business/register` | BusinessRegister | `client` | client+ |
| `/business/dashboard` | BusinessDashboard | `business_owner` | business_owner+ |

## Code Organization

```
src/
├── components/     # Reusable UI (Nav, Footer, ChatGuia, etc.)
├── contexts/       # React context providers (ThemeContext)
├── hooks/          # Custom hooks (useAuth, useBusiness, etc.)
├── lib/            # Utilities (supabase client, api, config, toast)
├── pages/          # Route pages (Home, Login, Blog, etc.)
├── store/          # Redux store (userSlice, uiSlice)
├── types/          # TypeScript interfaces
└── utils/          # Utility functions
```

## Naming

- **Database tables:** `agendaya_` prefix (e.g., `agendaya_profiles`, never `profiles`)
- **Database columns:** `snake_case` (Supabase convention)
- **Files:** `PascalCase` for components, `camelCase` for utilities

## Styling

- **Mobile-first:** Build `sm:` up. Default is mobile.
- Use Tailwind exclusively. No CSS modules.
- Dark mode via `dark:` variants on `<html>`.

## Build & Deploy

```bash
pnpm dev              # Development server (port 3000)
pnpm type-check       # tsc --noEmit
pnpm build            # vite build
pnpm preview          # Preview production build
pnpm netlify-build    # Build para Netlify (instala + build + sitemap + prerender)
```

- Netlify SPA redirect: `/*` → `/index.html` with `200`.
- Node version: 18+ (set in `netlify.toml`).
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **`vite.config.ts` tiene `server.watch.usePolling: true`** — necesario porque el proyecto reside en `/mnt/d/` (DrvFs en WSL2). `inotify` no funciona confiablemente sobre el filesystem montado de Windows; con polling se asegura que HMR detecte cambios incluso cuando se edita desde un editor en Windows.

## Developing with an Agent (opencode)

- **Commits al finalizar la sesión:** Antes de cerrar la sesión de trabajo, hacer commit de todos los cambios funcionales completados. Usar `git add -A` y commits atómicos (un cambio lógico por commit). Mensajes descriptivos en español.
- **Verificación pre-commit:** Ejecutar `pnpm type-check` luego `pnpm build` antes de cada commit para verificar que no hay errores. Si el build falla por errores preexistentes (no causados por tus cambios), documentarlo en el commit.
- Read files before editing. Understand conventions before writing code.
- Prefer editing existing files over creating new ones unless clearly warranted.
- After edits, run `pnpm type-check` then `pnpm build` to verify.
- **Remember: tables are `agendaya_profiles` NOT `profiles`.**
- **SQL compartido:** Si modificas `handle_new_user()`, hacerlo en `../supabase-shared/handle_new_user.sql`. Nunca redefinirlo en archivos SQL del proyecto.
