# Campaña 2026-07-21 — 3 rondas por división

## quality (3/3 completadas)
- Ronda 1: eliminados `: any` en storage.ts, 7 exports muertos en roles.ts, código muerto en appointmentUtils/icsUtils/appointment
- Ronda 2: eliminado `src/types/payment.ts` completo, 5 funciones/tipos muertos en api.ts (slugify, getBusinessesMapData, createGiftCode, AvailableSlot, getAvailableSlots, triggerAutoComplete)
- Ronda 3: reemplazados 10 `catch (err: any)` → `unknown` en hooks, eliminadas 4 funciones muertas en api.ts (getWaitlist, getMilestones, updateBusinessPlan, contributeToMilestone)

## architecture (3/3 completadas)
- Ronda 1: creados `api/auth.ts` (6 funciones), `api/businesses.ts` (18 funciones), `api/index.ts`. api.ts de 2436→1909 líneas
- Ronda 2: creados `api/appointments.ts` (6 funciones), `api/services.ts` (5 funciones). api.ts de 1909→1651 líneas
- Ronda 3: creados `api/reviews.ts` (6 funciones), `api/blog.ts` (11 funciones), `api/admin.ts` (11 funciones). api.ts de 1651→984 líneas

## reliability (3/3 completadas)
- Ronda 1: creado `ErrorBoundary.tsx` + envuelto App.tsx. Agregados try/catch en Blog.tsx, BlogHomeSection, CityLandingPage
- Ronda 2: creado `sanitize.ts`. Agregados try/catch en BusinessDashboard, AppointmentsSection, BlogPostView, ServiceFormPage
- Ronda 3: reemplazadas fallback images Wikimedia → SVG local. Creada validación runtime en api-helpers. Agregados try/catch en BusinessConfigSection, BookingPage

## performance (3/3 completadas)
- Ronda 1: React.memo en Pagination, StarRating, TabNav, BusinessCard, ServiceCard + useCallback en handleToggleLike
- Ronda 2: API calls paralelizadas en BusinessDashboard, ExploreBusinesses, BusinessPublicPage. useMemo en BlogPostView. loading="lazy" en 7 imágenes
- Ronda 3: Lazy-load Leaflet (BusinessLocation, LocationPicker) y Swiper (CategorySwiper). Dimensiones explícitas en imágenes (ExploreBusinesses, FavoritesSection, Blog). React.memo en Nav y Footer

## ux (3/3 completadas)
- Ronda 1: Creado hook `useFocusTrap`. role="dialog"/aria-modal/focus trap/Escape key en 11 componentes modales. aria-current="page" en Nav
- Ronda 2: aria-pressed en 9 botones toggle. aria-expanded/haspopup en dropdowns. Keyboard nav (ArrowLeft/Right) en TabNav y Pagination. focus-visible:ring en 20+ elementos
- Ronda 3: 16 issues de contraste `text-slate-400`→`text-slate-500/600` resueltos. aria-invalid/aria-describedby en FormInput/FormTextarea. aria-hidden en iconos decorativos

## product (3/3 completadas)
- Ronda 1: Sección beneficios en Home. Banner upgrade visitor→client mejorado. Welcome onboarding card en ProfileDashboard. Beneficios pre-formulario en BusinessRegister
- Ronda 2: Banner comparativo en Plans.tsx. Banner upgrade Starter en BusinessDashboard. Badge plan dinámico en BusinessPublicPage
- Ronda 3: Sticky CTA "Registra gratis" en ExploreBusinesses. Acceso rápido favoritos + resumen historial en ProfileDashboard. Upgrade cards contextuales en BusinessDashboard
