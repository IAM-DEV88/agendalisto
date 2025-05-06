# AppAgenda - Plataforma de Gestión de Reservas

AppAgenda es una aplicación web full-stack para **usuarios** y **negocios**:
- **Usuarios**: registrarse, explorar negocios, reservar y gestionar citas (ver, reagendar, cancelar).
- **Negocios**: crear y configurar su perfil, servicios y disponibilidad horaria; gestionar citas recibidas y notificaciones.

---

## 📂 Estructura del Proyecto

```
.
├── README.md
├── SETUP.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .gitignore
├── .env
├── .env.local
├── index.html
└── src
    ├── main.tsx               # Punto de entrada: ReactDOM.render
    ├── App.tsx                # Rutas y layout principal (Router + Toaster)
    ├── vite-env.d.ts          # Tipos Vite
    ├── index.css              # Estilos globales (Tailwind)
    ├── contexts/              # Contextos de React (vacío actualmente)
    │   └── (vacío)
    ├── hooks/                 # Custom hooks
    │   ├── useAuthSession.ts  # Manejo de sesión de usuario
    │   ├── useBusiness.ts     # Hook para negocio
    │   └── useAppointments.ts # Suscripción y estado de citas
    ├── lib/                   # Utilidades y configuración
    │   ├── config.ts          # Variables de entorno y settings
    │   ├── supabase.ts        # Cliente Supabase inicializado
    │   ├── api.ts             # Funciones CRUD y queries a PostgreSQL
    │   └── events.ts          # Eventos personalizados (e.g. userProfileUpdated)
    ├── components/            # UI components reutilizables
    │   ├── common/            # Componentes genéricos (botones, inputs, etc.)
    │   ├── Nav.tsx            # Barra de navegación principal
    │   ├── ProtectedRoute.tsx # Componente guard para rutas privadas
    │   ├── Footer.tsx         # Pie de página global
    │   ├── business/          # Componentes para Dashboard de negocio
    │   │   ├── AppointmentsSection.tsx    # Lista y gestión de citas del negocio
    │   │   ├── BusinessProfileSection.tsx# Formulario edición de datos del negocio
    │   │   ├── BusinessHoursSection.tsx  # Configuración de horarios laborales
    │   │   ├── BusinessConfigSection.tsx # Preferencias (notificaciones, precios)
    │   │   ├── ServicesSection.tsx       # CRUD de servicios ofrecidos
    │   │   ├── ClientsSection.tsx        # Listado de clientes
    │   │   └── public/                   # Vistas públicas de negocio
    │   │       ├── index.ts              # Exporta todos los subcomponentes
    │   │       ├── BusinessHeader.tsx    # Encabezado (nombre, rating)
    │   │       ├── BusinessLocation.tsx  # Muestra ubicación en mapa
    │   │       ├── BusinessHoursList.tsx # Horarios disponibles (lista)
    │   │       ├── BookingForm.tsx       # Formulario de reserva de cita
    │   │       ├── ReviewsSection.tsx    # Reseñas de clientes
    │   │       └── ServicesList.tsx      # Listado de servicios públicos
    │   └── profile/           # Componentes para Dashboard de usuario
    │       ├── PastAppointments.tsx      # Historial de citas
    │       ├── UpcomingAppointments.tsx  # Próximas citas
    │       └── UserProfileSection.tsx    # Edición de perfil de usuario
    └── pages/                # Vistas y rutas asociadas
        ├── Home.tsx                 # Página de inicio y búsqueda de negocios
        ├── ExploreBusinesses.tsx    # Filtros y listado de negocios
        ├── Login.tsx                # Formularios de autenticación
        ├── Register.tsx             # Registro de usuarios
        ├── ForgotPassword.tsx       # Recuperación de contraseña
        ├── ProfileDashboard.tsx     # Panel de control de usuario
        ├── BusinessRegister.tsx     # Formulario para registrar nuevo negocio
        ├── BusinessDashboard.tsx    # Panel de gestión de negocio
        └── BusinessPublicPage.tsx   # Página pública completa de negocio

supabase/
└── migrations/
    ├── 001_create_business_config_table.sql
    └── 002_add_fk_appointments_userid_profiles.sql
└── schema.sql                    # Esquema completo de PostgreSQL
```

---

## 🔄 Flujo de Datos (Frontend → Backend)

1. **Autenticación**: Supabase Auth gestiona sesiones. En `App.tsx` capturamos la sesión y disparamos events.
2. **Carga de Perfil**: Hook `useAuthSession` / `loadProfile` obtiene datos de `profiles` y los almacena en Redux (userSlice).
3. **Negocio y Servicios**: En Dashboard de negocio, `getBusinessConfig`, `getBusinessHours`, `getBusinessServices` cargan datos desde la API (lib/api.ts).
4. **Reservas**:
   - **Usuario**: usa `BookingForm.tsx` que invoca `createAppointment` (API) y notifica con `react-hot-toast`.
   - **Negocio**: suscribe a eventos de Supabase (INSERT/UPDATE en tabla `appointments`) para notificar nuevas reservas y cambios.
5. **Realtime Updates**: Supabase channels (`.channel('public:appointments')`) emitidos en `App.tsx` para ambos roles.

---

## 🗄️ Esquema de Base de Datos (PostgreSQL via Supabase)

### profiles
- `id` (UUID, PK, FK → auth.users)
- `full_name`, `phone`, `avatar_url`, `is_business`, `business_id`, `created_at`, `updated_at`

### businesses
- `id` (UUID, PK)
- `owner_id` (UUID, FK → profiles)
- `name`, `description`, `address`, `logo_url`, `phone`, `email`, redes sociales, `lat`, `lng`, `created_at`, `updated_at`

### services
- `id` (UUID, PK)
- `business_id` (UUID, FK → businesses)
- `name`, `description`, `duration` (min), `price`, `provider`, `is_active`, timestamps

### business_hours
- `id` (UUID, PK)
- `business_id` (UUID, FK → businesses)
- `day_of_week` (0=Lunes…6=Domingo), `start_time`, `end_time`, `is_closed`

### appointments
- `id` (UUID, PK)
- `business_id`, `service_id`, `user_id` (UUID FKs)
- `start_time`, `end_time` (timestamptz)
- `status` (enum: pending, confirmed, completed, cancelled)
- `notes`, timestamps

### business_config
- `business_id` (UUID, PK)
- `permitir_reservas_online`, `mostrar_precios`, `requiere_confirmacion`, `tiempo_minimo_cancelacion`, notificaciones, timestamps

### reviews
- `id` (UUID, PK)
- `appointment_id`, `user_id`, `business_id` (UUID FKs)
- `rating` (smallint), `comment`, `created_at`

**Relaciones principales:**
- `profiles` (1:1) ↔ `users` (Supabase Auth)
- `profiles` (1:N) ↔ `businesses`
- `businesses` (1:N) ↔ `services`, `business_hours`, `appointments`, `business_config`
- `appointments` (1:1) ↔ `reviews`

---

**Licencia MIT**