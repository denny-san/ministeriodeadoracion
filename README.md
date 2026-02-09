# Ministerio de Adoración - Portal de Gestión

## Variables de Entorno Requeridas para Vercel

Para que la aplicación funcione correctamente en producción (Vercel), debes configurar las siguientes variables de entorno en el panel de Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAoLjHkXhMWoM9qp540R61gqdvXZ05JSHM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ministerioadoracion-73496.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ministerioadoracion-73496
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ministerioadoracion-73496.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=320525219331
NEXT_PUBLIC_FIREBASE_APP_ID=1:320525219331:web:604de89b77f62800548036
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-F0QY7H8XT4
```

### Cómo configurar en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor correspondiente
4. Selecciona "Production", "Preview" y "Development"
5. Guarda y redeploy

## Desarrollo Local

Para desarrollo local, las variables ya están configuradas en `.env.local`.

```bash
npm install
npm run dev
```

## Estructura del Proyecto

- **App.tsx**: Punto de entrada principal con manejo de autenticación
- **firebase.ts**: Configuración de Firebase (Auth, Firestore, Storage)
- **db.ts**: Funciones de base de datos (CRUD operations)
- **components/Layout.tsx**: Layout principal con sidebar y navegación
- **pages/**: Vistas de la aplicación (Dashboard, Calendar, Team, etc.)
- **context/**: Contextos de React (Notificaciones)

## Características

✅ Autenticación con Firebase Auth
✅ Base de datos en tiempo real con Firestore
✅ Almacenamiento de imágenes con Firebase Storage
✅ Panel de líder con estadísticas y gestión
✅ Panel de músico con agenda y confirmaciones
✅ Sistema de notificaciones en tiempo real
✅ Gestión de eventos y calendario
✅ Gestión de equipo y músicos
✅ Responsive design (móvil y desktop)

## Roles de Usuario

- **Leader**: Acceso completo a gestión de equipo, eventos, canciones
- **Musician**: Vista de agenda personal, confirmación de asistencia

## Tecnologías

- React 19
- TypeScript
- Firebase (Auth, Firestore, Storage)
- Vite
- Tailwind CSS (estilos inline)

## Pruebas locales y despliegue de reglas Firestore

1. Instala dependencias e inicia la app en modo desarrollo:

```bash
npm install
npm run dev
```

2. Inicia sesión en Firebase desde la CLI (necesitas `firebase-tools`):

```bash
npm install -g firebase-tools
firebase login
```

3. Para desplegar las reglas de Firestore desde la consola local (asegúrate de tener `firebase.json` y `firestore.rules` en el repo):

```bash
firebase deploy --only firestore:rules
```

4. Pruebas manuales recomendadas:
- Abrir dos sesiones (una con usuario `Leader`, otra con `Musician`).
- Como `Leader`: crear/editar/eliminar una noticia, canción y un evento.
- Verificar en la sesión `Musician` que los cambios aparecen instantáneamente sin recargar.
- Probar confirmaciones de asistencia desde `Musician` y verificar recepción en `Dashboard`.

5. Notas sobre permisos y reglas:
- Las reglas actualizadas requieren que los `Leader` estén marcados en `/users/{uid}.rol`.
- Si pruebas en emulador local, puedes usar `firebase emulators:start` para Firestore.

Si quieres, puedo: 1) ejecutar pruebas automatizadas básicas (requiere credenciales), 2) preparar un script para deploy automático de reglas o 3) documentar pasos para crear cuentas de prueba de `Leader` y `Musician`.
