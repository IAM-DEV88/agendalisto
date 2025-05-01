# AppAgenda - Plataforma de Reservas

AppAgenda es una plataforma web para la gestión de reservas y citas, diseñada tanto para usuarios finales que buscan reservar servicios, como para negocios que quieren organizar y gestionar sus propias citas.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Detalle de Archivos](#detalle-de-archivos)
- [Flujo de Usuario](#flujo-de-usuario)
- [Flujo de Negocio](#flujo-de-negocio)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Esquema de la Base de Datos](#esquema-de-la-base-de-datos)
- [Licencia](#licencia)

## Descripción

AppAgenda permite a los usuarios:
- Registrarse e iniciar sesión.
- Explorar y reservar servicios ofrecidos por negocios.
- Ver, reagendar y cancelar sus reservas desde un panel personal.

Y a los negocios:
- Crear y configurar su perfil de servicios.
- Establecer precios, duración de servicios y disponibilidad horaria.
- Gestionar citas recibidas y notificar a los clientes.

## Estructura del Proyecto

```bash
.
├── README.md                        # Documentación principal del proyecto
├── SETUP.md                         # Guía detallada de configuración inicial
├── package.json                     # Dependencias y scripts NPM
├── package-lock.json                # Versiones específicas de npm
├── tsconfig.json                    # Configuración de TypeScript para la app
├── tsconfig.node.json               # Configuración de TypeScript para Node
├── vite.config.ts                   # Configuración de Vite
├── tailwind.config.js               # Configuración de Tailwind CSS
├── postcss.config.js                # Plugin de PostCSS para Tailwind
├── .eslintrc.cjs                    # Reglas y ajustes de ESLint
├── .gitignore                       # Archivos ignorados por Git
├── .env                             # Variables de entorno de desarrollo
├── .env.local                       # Variables locales (no versionadas)
├── index.html                       # Plantilla HTML principal de Vite
├── src/                             # Código fuente de la aplicación
│   ├── main.tsx                     # Punto de entrada: renderiza App en el DOM
│   ├── App.tsx                      # Configuración de rutas y layout principal
│   ├── vite-env.d.ts                # Tipos de Vite para TypeScript
│   ├── index.css                    # Estilos globales (Tailwind)
│   ├── contexts/                    # Contextos de React para estado global
│   │   └── (vacío)
│   ├── hooks/                       # Custom hooks reutilizables
│   │   ├── useAuthSession.ts
│   │   ├── useBusiness.ts
│   │   └── useAppointments.ts
│   ├── lib/                         # Utilidades y configuración compartida
│   │   ├── config.ts                # Definición de variables de entorno y settings
│   │   ├── supabase.ts              # Inicialización del cliente Supabase
│   │   ├── api.ts                   # Funciones CRUD y llamadas a la base de datos
│   │   └── events.ts                # Manejadores de eventos globales
│   ├── components/                  # Componentes reutilizables de UI
│   │   ├── common/                  # Componentes genéricos
│   │   │   └── (vacío)
│   │   ├── business/                # Componentes relacionados a negocios
│   │   │   ├── AppointmentsSection.tsx
│   │   │   ├── BusinessConfigSection.tsx
│   │   │   ├── BusinessHoursSection.tsx
│   │   │   ├── BusinessProfileSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   └── public/              # Componentes públicos del negocio
│   │   │       ├── BusinessHeader.tsx    # Encabezado público del negocio
│   │   │       ├── BusinessLocation.tsx  # Muestra la ubicación en mapa
│   │   │       ├── BusinessHoursList.tsx # Listado de horarios disponibles
│   │   │       ├── BookingForm.tsx       # Formulario para reservar cita
│   │   │       ├── ReviewsSection.tsx    # Sección de reseñas de clientes
│   │   │       ├── ServicesList.tsx      # Listado de servicios ofrecidos
│   │   │       └── index.ts              # Punto de exportación de componentes
│   │   ├── profile/                 # Componentes de perfil de usuario
│   │   │   ├── PastAppointments.tsx
│   │   │   ├── UpcomingAppointments.tsx
│   │   │   └── UserProfileSection.tsx
│   │   ├── Nav.tsx                  # Barra de navegación principal
│   │   ├── ProtectedRoute.tsx       # Ruta protegida por autenticación
│   │   └── Footer.tsx               # Pie de página común
│   └── pages/                       # Vistas principales asociadas a rutas
│       ├── Home.tsx                 # Página de inicio y exploración
│       ├── ExploreBusinesses.tsx    # Listado y filtros de negocios
│       ├── Login.tsx                # Formulario de inicio de sesión
│       ├── Register.tsx             # Formulario de registro de usuario
│       ├── ForgotPassword.tsx       # Recuperación de contraseña
│       ├── ProfileDashboard.tsx     # Panel de control de usuario
│       ├── BusinessRegister.tsx     # Formulario para registrar negocio
│       ├── BusinessDashboard.tsx    # Panel de gestión de negocio
│       └── BusinessPublicPage.tsx   # Página pública de cada negocio
└── supabase/                        # Migraciones y esquema de la base de datos
    ├── migrations/                  # Scripts de migración SQL
    │   ├── 001_create_business_config_table.sql
    │   └── 002_add_fk_appointments_userid_profiles.sql
    └── schema.sql                   # Definición completa del esquema PostgreSQL
```

## Detalle de Archivos

### README.md
Explica el propósito del proyecto, su estructura y guía de uso.

### SETUP.md
Guía detallada de configuración inicial.

### package.json
Contiene dependencias, versiones y scripts de desarrollo/producción.

### package-lock.json
Contiene versiones específicas de npm.

### tsconfig.json
Define opciones de compilación de TypeScript para mayor rigurosidad de tipos.

### tsconfig.node.json
Configura TypeScript para Node.

### vite.config.ts
Configura Vite como bundler y servidor de desarrollo.

### tailwind.config.js
Ajusta los estilos de Tailwind CSS.

### postcss.config.js
Plugin de PostCSS para Tailwind.

### .eslintrc.cjs
Reglas y ajustes de ESLint.

### .gitignore
Archivos ignorados por Git.

### .env
Variables de entorno de desarrollo.

### .env.local
Variables locales (no versionadas).

### index.html
Plantilla HTML principal de Vite.

### src/main.tsx
Inicia la aplicación y envuelve el árbol de componentes.

### src/App.tsx
Define rutas públicas y privadas utilizando React Router.

### src/vite-env.d.ts
Tipos de Vite para TypeScript.

### src/index.css
Importa directivas de Tailwind y establece estilos globales.

### src/contexts/
Contiene archivos de contextos para estado global.

### src/hooks/
Contiene archivos de custom hooks reutilizables.

### src/lib/
Contiene utilidades y configuración compartida.

### src/components/
Contiene elementos UI reutilizables para mantener consistencia en el diseño.

### src/pages/
Agrupa vistas completas de la aplicación asociadas a rutas.

### supabase/
Contiene migraciones y esquema de la base de datos.

## Flujo de Usuario

1. **Registro e Inicio de Sesión**: El usuario crea una cuenta o ingresa con credenciales; Supabase Auth gestiona la seguridad.
2. **Exploración de Negocios**: Desde la página principal puede buscar y filtrar negocios disponibles.
3. **Selección de Servicios**: Al seleccionar un negocio, visualiza sus servicios con precios y duraciones.
4. **Reserva de Cita**: Escoge fecha y hora disponibles, rellena el formulario y confirma la reserva.
5. **Gestión de Reservas**: En "DashboardUsuario" puede consultar, reagendar o cancelar sus citas.

## Flujo de Negocio

1. **Creación de Perfil**: Un usuario autenticado convierte su cuenta en perfil de negocio.
2. **Configuración de Servicios**: Define, edita o elimina servicios con sus precios y duraciones.
3. **Disponibilidad**: Establece franjas horarias y días laborales en el calendario.
4. **Gestión de Citas**: Visualiza solicitudes de reserva, las confirma o rechaza.
5. **Notificaciones**: Envía correos y/o WhatsApp a los clientes sobre el estado de sus reservas.

## Tecnologías Utilizadas

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth y Base de Datos)
- React Router

## Esquema de la Base de Datos

### Descripción general
AppAgenda utiliza Supabase, una plataforma basada en PostgreSQL, para la gestión de persistencia y autenticación. Supabase Auth maneja la tabla interna `auth.users` para credenciales, mientras que la aplicación define tablas adicionales para perfiles, negocios, servicios, horarios, citas, configuración y reseñas.

### Autenticación y Perfiles
- **auth.users** (gestionada por Supabase Auth)
  - `id` (UUID, PK)
  - `email`, `encrypted_password`, `confirmation_sent_at`, etc.

- **profiles**
  - `id` (UUID, PK, FK → auth.users.id)
  - `full_name` (text)
  - `phone` (text)
  - `is_business` (boolean)
  - `business_id` (UUID, FK → businesses.id, opcional)
  - `avatar_url` (text, opcional)
  - `created_at`, `updated_at` (timestamptz)
  - Relación 1:1 con `auth.users` para extender metadata de usuario.

### Tabla: Businesses (Negocios)
- **businesses**
  - `id` (UUID, PK)
  - `owner_id` (UUID, FK → auth.users.id)
  - `name` (text)
  - `description` (text)
  - `address` (text)
  - `logo_url` (text, nullable)
  - `phone` (text)
  - `email` (text)
  - `whatsapp`, `instagram`, `facebook`, `website` (text, nullable)
  - `lat`, `lng` (decimal, nullable)
  - `created_at`, `updated_at` (timestamptz)
  - Rel.: 1:N con `services`, `business_hours`, `appointments`; 1:1 opcional con `business_config`.

### Tabla: Services (Servicios)
- **services**
  - `id` (UUID, PK)
  - `business_id` (UUID, FK → businesses.id)
  - `name` (text)
  - `description` (text)
  - `duration` (integer, minutos)
  - `price` (numeric)
  - `provider` (text)
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)

### Tabla: Business Hours (Horarios)
- **business_hours**
  - `id` (UUID, PK)
  - `business_id` (UUID, FK → businesses.id)
  - `day_of_week` (smallint; 0=Lunes…6=Domingo)
  - `start_time`, `end_time` (time)
  - `is_closed` (boolean)

### Tabla: Appointments (Citas)
- **appointments**
  - `id` (UUID, PK)
  - `business_id` (UUID, FK → businesses.id)
  - `service_id` (UUID, FK → services.id)
  - `user_id` (UUID, FK → auth.users.id)
  - `start_time`, `end_time` (timestamptz)
  - `status` (enum: pending, confirmed, completed, cancelled)
  - `notes` (text, nullable)
  - `created_at`, `updated_at` (timestamptz)
  - Incluye datos embebidos de `businesses`, `services`, `profiles` en algunas consultas.

### Tabla: Business Config (Configuración de Negocio)
- **business_config**
  - `business_id` (UUID, PK, FK → businesses.id)
  - `permitir_reservas_online` (boolean)
  - `mostrar_precios`, `mostrar_telefono`, `mostrar_email`, `mostrar_redes_sociales`, `mostrar_direccion` (boolean)
  - `requiere_confirmacion` (boolean)
  - `tiempo_minimo_cancelacion` (integer, horas)
  - `notificaciones_email`, `notificaciones_whatsapp` (boolean)
  - `created_at`, `updated_at` (timestamptz)
  - Guarda preferencias específicas de cada negocio.

### Tabla: Reviews (Reseñas)
- **reviews**
  - `id` (UUID, PK)
  - `appointment_id` (UUID, FK → appointments.id)
  - `user_id` (UUID, FK → auth.users.id)
  - `business_id` (UUID, FK → businesses.id)
  - `rating` (smallint)
  - `comment` (text, nullable)
  - `created_at` (timestamptz)

### Relaciones y Flujo de Datos
- Un usuario (`auth.users` + `profiles`) puede convertirse en propietario de un negocio (`businesses`).
- Cada negocio tiene múltiples servicios (`services`) y franjas horarias (`business_hours`).
- Los usuarios reservan servicios creando entradas en `appointments`.
- Después de la cita, pueden dejar una reseña en `reviews`.
- La configuración específica de cada negocio se maneja en `business_config`.

### Políticas de Seguridad (RLS)
Supabase Row Level Security está habilitado para asegurar:
- Solo el dueño (`owner_id`) puede modificar su negocio, servicios, horarios y configuración.
- Usuarios autenticados gestionan únicamente sus perfiles y citas.

## Licencia

Distribuido bajo la licencia MIT.