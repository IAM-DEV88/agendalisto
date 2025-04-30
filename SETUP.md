# Configuración de Supabase para AppAgenda

Este documento proporciona instrucciones paso a paso para configurar Supabase como backend para la aplicación AppAgenda.

## 1. Crear una cuenta y proyecto en Supabase

1. Visita [Supabase](https://supabase.com/) y crea una cuenta si aún no tienes una.
2. Crea un nuevo proyecto:
   - Da un nombre a tu proyecto (ej. "AppAgenda")
   - Establece una contraseña segura para la base de datos
   - Selecciona la región más cercana a tus usuarios
3. Espera a que tu proyecto se inicialice (puede tomar unos minutos)

## 2. Configurar variables de entorno

1. En el panel de Supabase, ve a `Settings > API`
2. Copia la URL del proyecto y la anon key (clave pública)
3. Crea un archivo `.env.local` en la raíz del proyecto con estos valores:

```
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

Reemplaza los valores con los de tu proyecto Supabase.

## 3. Ejecutar el script SQL para configurar la base de datos

1. En el panel de Supabase, ve a `SQL Editor`
2. Crea un nuevo script
3. Copia y pega todo el contenido del archivo `supabase/schema.sql` en el editor
4. Ejecuta el script para crear todas las tablas y políticas de seguridad

## 4. Configurar autenticación

1. En el panel de Supabase, ve a `Authentication > Settings`
2. Habilita los proveedores de autenticación que necesites:
   - Email (ya viene habilitado por defecto)
   - Configurar el dominio de la aplicación en Site URL

## 5. Configurar almacenamiento para imágenes (opcional)

1. En el panel de Supabase, ve a `Storage`
2. Crea los siguientes buckets:
   - `avatars` - Para fotos de perfil de usuarios
   - `business-logos` - Para logotipos de negocios
3. Configura las políticas de acceso para cada bucket:
   - Para avatars: permitir lectura pública y escritura solo por el propietario
   - Para business-logos: permitir lectura pública y escritura solo por el propietario del negocio

## 6. Probar la conexión

1. Ejecuta la aplicación con `npm run dev`
2. Intenta registrar un usuario nuevo
3. Verifica en el panel de Supabase (Authentication > Users) que el usuario se haya creado
4. Verifica en la tabla `profiles` que se haya creado el perfil automáticamente

## 7. Configurar desarrollo local con intercepción de emails (opcional)

Para desarrollo local, puedes configurar Supabase para que no envíe emails reales:

1. En el panel de Supabase, ve a `Authentication > Settings > Email Templates`
2. Activa el modo de desarrollo para no enviar emails reales
3. Cuando te registres, usa el panel de Supabase para ver los enlaces de confirmación

## 8. Configurar categorías de negocios (opcional)

La aplicación usa categorías para filtrar negocios. Para agregar estas categorías:

1. Crea una nueva tabla `business_categories` con la siguiente estructura:
   - `id` (uuid, clave primaria)
   - `name` (texto, nombre de la categoría)
   - `slug` (texto, identificador URL-friendly)
   - `description` (texto, opcional)
   - `icon` (texto, opcional, para guardar un nombre de icono)

2. Agrega un campo `category_id` de tipo uuid a la tabla `businesses` que referencie a `business_categories.id`

## Solución de problemas comunes

### Error "No se pudo conectar a la base de datos"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto de Supabase esté activo

### Error en políticas de seguridad
- Las políticas RLS (Row Level Security) deben estar correctamente configuradas
- Verifica que el script SQL se haya ejecutado correctamente

### Los triggers no funcionan
- Si los perfiles de usuario no se crean automáticamente, verifica que el trigger `handle_new_user` esté correctamente definido
- Revisa los logs de Supabase para errores específicos

## Recursos adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Ejemplos de aplicaciones con Supabase y React](https://github.com/supabase/supabase/tree/master/examples) 