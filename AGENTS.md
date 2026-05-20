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

Este proyecto comparte la instancia de Supabase con **EncuentrosVIP** (`encuentrosvip`).
Ambos proyectos usan el mismo `VITE_SUPABASE_URL` y la misma `VITE_SUPABASE_ANON_KEY`.

### Tabla de ownership

| Tabla | Dueño | Prefijo |
|---|---|---|
| `agendaya_profiles` | AgendaYa | `agendaya_` |
| `agendaya_businesses` | AgendaYa | `agendaya_` |
| `agendaya_services` | AgendaYa | `agendaya_` |
| `agendaya_business_hours` | AgendaYa | `agendaya_` |
| `agendaya_business_config` | AgendaYa | `agendaya_` |
| `agendaya_appointments` | AgendaYa | `agendaya_` |
| `agendaya_reviews` | AgendaYa | `agendaya_` |
| `agendaya_user_likes` | AgendaYa | `agendaya_` |
| `agendaya_blog_posts` | AgendaYa | `agendaya_` |
| `agendaya_blog_comments` | AgendaYa | `agendaya_` |
| `agendaya_blog_likes` | AgendaYa | `agendaya_` |
| `agendaya_chat_messages` | AgendaYa | `agendaya_` |
| `agendaya_milestones` | AgendaYa | `agendaya_` |
| `agendaya_business_categories` | AgendaYa | `agendaya_` |
| `user_apps` | Compartida | — |
| `apps` | Compartida | — |
| `encuentrosvip_profiles` | EncuentrosVIP | `encuentrosvip_` |
| `encuentrosvip_media` | EncuentrosVIP | `encuentrosvip_` |
| `encuentrosvip_reviews` | EncuentrosVIP | `encuentrosvip_` |
| `encuentrosvip_favorites` | EncuentrosVIP | `encuentrosvip_` |
| `encuentrosvip_verifications` | EncuentrosVIP | `encuentrosvip_` |

### Reglas ABSOLUTAS

1. **NUNCA usar nombres de tabla sin prefijo.** Todas las tablas de AgendaYa usan `agendaya_`. Si ves una tabla sin prefijo en `public` que no sea `user_apps` o `apps`, probablemente fue un error.

2. **NUNCA hacer `DROP TABLE`** sin verificar que la tabla no pertenece a EncuentrosVIP. Si empieza con `encuentrosvip_` NO TOCAR.

3. **NUNCA reescribir `handle_new_user()`** sin mantener las inserciones para AMBAS apps. Esta función vive en el proyecto encuentrosvip (en `supabase/coexistence.sql`) y crea perfiles para ambas apps.

4. **TODAS las tablas nuevas deben usar prefijo `agendaya_`** para evitar conflictos futuros. Nunca nombres genéricos.

5. **Antes de ejecutar cualquier SQL en producción**, verificar:
   - La migración no contiene `DROP TABLE` ni `DROP SCHEMA` que afecten tablas ajenas
   - `handle_new_user()` (definida en encuentrosvip) no se pierde
   - Las policies RLS nuevas no bloquean tablas de EncuentrosVIP

### Referencia

- Migración de coexistencia: `supabase/coexistence.sql` (en proyecto encuentrosvip)
- `handle_new_user()` actual: crea perfiles en `encuentrosvip_profiles` + `agendaya_profiles` + `user_apps` para ambas apps
- `user_apps.app_slug` = `'encuentrosvip'` | `'agendaya'`

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
