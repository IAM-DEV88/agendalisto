# AppAgenda - Plataforma de Reservas

AppAgenda es una plataforma web para la gestión de reservas y citas, permitiendo a los usuarios reservar servicios con negocios registrados y a los negocios gestionar sus citas y servicios.

## Características principales

### Para usuarios:
- Registro e inicio de sesión
- Reserva de citas con negocios
- Visualización, reagendamiento y cancelación de reservas
- Posibilidad de registrar su propio negocio

### Para negocios:
- Panel de gestión de citas
- Configuración de servicios, precios y duración
- Gestión de disponibilidad y horarios
- Página pública personalizada con información de contacto y ubicación
- Notificaciones por correo y WhatsApp

## Tecnologías utilizadas

- React (con TypeScript)
- Vite
- Tailwind CSS
- Supabase (Auth y base de datos)
- React Router para la navegación

## Estructura del proyecto

```
/src
  /components        # Componentes reutilizables
  /lib               # Utilidades y configuración
  /pages             # Páginas principales
  App.tsx            # Configuración de rutas
  main.tsx           # Punto de entrada
```

## Requisitos previos

- Node.js (v14 o superior)
- npm o yarn
- Cuenta en Supabase

## Configuración e Instalación

1. Clonar el repositorio
   ```
   git clone https://github.com/tu-usuario/app-agenda.git
   cd app-agenda
   ```

2. Instalar dependencias
   ```
   npm install
   ```

3. Configurar variables de entorno
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Iniciar el servidor de desarrollo
   ```
   npm run dev
   ```

## Flujo de usuario

1. Un usuario puede registrarse en la plataforma
2. Después de iniciar sesión, el usuario puede:
   - Buscar negocios/servicios
   - Ver los detalles de un negocio y sus servicios
   - Reservar citas seleccionando fecha y hora disponible
   - Gestionar sus citas en su panel personal
   - Registrar su propio negocio

## Flujo de negocio

1. Un usuario registrado puede crear su perfil de negocio
2. Como negocio, el usuario puede:
   - Configurar su información de contacto y ubicación
   - Añadir, editar o eliminar servicios
   - Gestionar su disponibilidad y horarios
   - Ver y gestionar las citas recibidas
   - Recibir notificaciones sobre nuevas reservas

## Licencia

Este proyecto está bajo la licencia MIT. 