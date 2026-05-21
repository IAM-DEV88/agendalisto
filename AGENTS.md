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

## ⚠️ CRITICAL: Multi-app Supabase Coexistence

Este proyecto comparte la instancia de Supabase con otras aplicaciones (`encuentrosvip`, `GUILD-PORTAL`).
Todas las apps usan el mismo `VITE_SUPABASE_URL` y la misma `VITE_SUPABASE_ANON_KEY`.

### Arquitectura del sistema de registro/login

El ecosistema usa 4 piezas que trabajan juntas. Entender cada una es crítico para no romper nada.

#### `auth.users` — El núcleo de identidad

- Tabla interna de Supabase Auth. La crea y gestiona Supabase automáticamente.
- Cada fila = un usuario registrado con email + password.
- `raw_user_meta_data` contiene datos que el frontend envió al registrarse (display_name, role, etc.).
- **⚠️ `raw_user_meta_data` NO es confiable.** Viene del cliente. Por eso existe `sanitize_signup_role()` — nunca confiar en `role` o `plan` sin sanitizar.
- El trigger `on_auth_user_created` sobre `auth.users` es **el punto único de fallo** de todo el ecosistema. Si se desactiva o se reescribe mal, ninguna app recibe usuarios nuevos.

#### `apps` — El catálogo de aplicaciones

- Tabla maestra que lista qué apps existen: `encuentrosvip`, `agendaya`, `guild_portal`.
- Es **documental/organizacional** — ninguna FK apunta a ella. Si se borra, no rompe nada funcionalmente.
- Sirve para saber qué apps están registradas y hacer reporting.

#### `user_apps` — La matriz de membresía

- Una fila por cada {usuario, app}. Cada app puede tener su propio rol para el mismo usuario.
- `status = 'active'` permite desactivar a un usuario en una app sin afectar las demás.
- Es la base para RLS policies sin recursión (consultas con `SECURITY DEFINER`).
- **Ejemplo:** Un usuario admin en encuentrosvip puede ser visitor en agendaya.

#### `{app}_profiles` — Los datos específicos de cada app

- Cada app tiene su propia tabla con el esquema que necesita.
- `encuentrosvip_profiles` usa `id` propio + `user_id` (permite múltiples perfiles por usuario si hiciera falta).
- `agendaya_profiles` usa `id = auth.users.id` (relación 1:1, más simple).
- **NUNCA** consultar, modificar o dropear la tabla `{app}_profiles` de otra app.

#### El flujo completo de registro

```
Usuario llena formulario → supabase.auth.signUp()
  → Supabase crea fila en auth.users
    → on_auth_user_created TRIGGER se dispara
      → handle_new_user() se ejecuta:
          1. INSERT INTO encuentrosvip_profiles (...)
          2. INSERT INTO user_apps (..., app_slug='encuentrosvip')
          3. INSERT INTO agendaya_profiles (...)
          4. INSERT INTO user_apps (..., app_slug='agendaya')
          5. INSERT INTO user_apps (..., app_slug='guild_portal')  -- si aplica
```

#### ⚠️ ADVERTENCIA: handle_new_user() es el cuello de botella

Todas las apps dependen de UNA SOLA función `handle_new_user()`. Si se reescribe sin incluir todas las apps:

**Caso real que pasó:** EncuentrosVIP ejecutó `cleanup_profiles.sql` que:
1. Borró la tabla `public.profiles` (que AgendaYa usaba) con `DROP TABLE ... CASCADE`
2. Reescribió `handle_new_user()` para que solo insertara en `encuentrosvip_profiles`
3. AgendaYa dejó de recibir perfiles de usuarios nuevos → login roto por semanas

**Lección:** Toda modificación a `handle_new_user()` o al trigger `on_auth_user_created` debe verificarse contra TODAS las apps registradas. No alcanza con no romper tu app — hay que asegurar que las otras sigan funcionando.

### Principios de arquitectura

1. **Cada app tiene su propio prefijo de tabla.** Ej: `app_perfiles`, `app_servicios`. Nunca nombres genéricos como `profiles`, `reviews`.

2. **Nunca modificar objetos que no te pertenecen.** Si una tabla, función, trigger o policy no tiene tu prefijo, no tocarla.

3. **Las tablas compartidas (bajo acuerdo) llevan nombres semánticos sin prefijo.** Actualmente: `apps`, `user_apps`, `auth.users`.

4. **El trigger `on_auth_user_created` es compartido.** La función `handle_new_user()` debe insertar registros iniciales para TODAS las apps registradas. Nunca reescribirla sin mantener soporte para las demás.

5. **Toda función/trigger compartida debe revisarse antes de modificarla.** Si afecta `auth.users` o usa `SECURITY DEFINER`, verificar que no rompe otras apps.

6. **Los RPC (Remote Procedure Calls) deben ir con prefijo de app.** Ej: `encuentrosvip_update_role()`, `agendaya_do_thing()`.

### Mapa actual de tablas por app

| App | Prefijo | Tablas |
|---|---|---|
| `encuentrosvip` | `encuentrosvip_` | `profiles`, `media`, `reviews`, `favorites`, `verifications` |
| `agendaya` | `agendaya_` | `profiles`, `businesses`, `services`, `business_hours`, `business_config`, `appointments`, `reviews`, `user_likes`, `blog_posts`, `blog_comments`, `blog_likes`, `chat_messages`, `milestones`, `business_categories` |
| `guild_portal` | `guild_portal_` | `config`, `game_rewards_log`, `game_sessions`, `guide_comments`, `guide_votes`, `guides`, `raid_registrations`, `roster_players`, `schedule_votes`, `section_comments`, `redemption_codes`, `blog_comment_likes`, `blog_comments`, `blog_likes`, `blog_posts` |
| Compartidas | — | `apps`, `user_apps`, `auth.users` |

### Reglas ABSOLUTAS

1. **TODA tabla nueva debe tener prefijo de app.** Jamás crear `CREATE TABLE public.something` sin prefijo. Si ves una tabla sin prefijo en `public` que no sea `apps` o `user_apps`, reportarla.

2. **NUNCA hacer `DROP TABLE`** en producción sin verificar la tabla de ownership. Si la tabla no tiene tu prefijo, NO TOCAR.

3. **NUNCA reescribir `handle_new_user()`** sin mantener las inserciones para TODAS las apps. La función debe crear perfiles en cada `{app}_profiles` y registrar cada app en `user_apps`.

4. **NUNCA modificar RLS policies** de tablas que no te pertenecen. Si la policy opera sobre `public.otra_app_*`, dejarla intacta.

5. **NUNCA asumir que una tabla existe o no existe.** Siempre usar `IF EXISTS` / `IF NOT EXISTS` en migraciones.

### Checklist de seguridad para migraciones SQL

Antes de ejecutar cualquier SQL en producción, verificar TODO esto:

- [ ] La migración no contiene `DROP TABLE`, `DROP SCHEMA` ni `TRUNCATE` sobre tablas ajenas
- [ ] `handle_new_user()` conserva soporte para todas las apps (buscar `{app}_profiles` y `user_apps` en el cuerpo)
- [ ] Las nuevas policies RLS no afectan tablas de otras apps
- [ ] Las nuevas funciones/triggers usan prefijo de app
- [ ] Los `REFERENCES` en FK apuntan a tablas con el prefijo correcto
- [ ] Los trigger names incluyen prefijo de app para evitar colisiones
- [ ] `raw_user_meta_data` sanitizado si se introduce un nuevo campo de registro
- [ ] Las funciones `SECURITY DEFINER` no exponen datos de otras apps

### Cómo agregar una nueva app al ecosistema

1. Registrar en `public.apps`: `INSERT INTO apps (slug, name) VALUES ('miapp', 'Mi App')`
2. Crear tablas con prefijo `miapp_`: `CREATE TABLE public.miapp_profiles (...)`
3. Agregar inserción en `handle_new_user()`: insertar perfil en `miapp_profiles` + registro en `user_apps` con `app_slug = 'miapp'`
4. Crear RLS policies para las tablas nuevas
5. Migración de coexistencia: crear `supabase/coexistence.sql` que incluya los pasos 1-4

### Referencia

- Migración de coexistencia: `supabase/coexistence.sql` (en proyecto encuentrosvip)
- `handle_new_user()` actual definida en: `supabase/coexistence.sql`, `supabase-setup.sql`, `security_hardening.sql`
- `user_apps.app_slug` valores activos: `'encuentrosvip'`, `'agendaya'`, `'guild_portal'`

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
npm run dev           # Development server (port 3000)
npm run type-check    # tsc --noEmit
npm run build         # vite build
npm run preview       # Preview production build
npx vite build        # Force build
```

- Netlify SPA redirect: `/*` → `/index.html` with `200`.
- Node version: 18+ (set in `netlify.toml`).
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Developing with an Agent (opencode)

- Read files before editing. Understand conventions before writing code.
- Prefer editing existing files over creating new ones unless clearly warranted.
- After edits, run `npx tsc --noEmit` then `npx vite build` to verify.
- **Remember: tables are `agendaya_profiles` NOT `profiles`.**
