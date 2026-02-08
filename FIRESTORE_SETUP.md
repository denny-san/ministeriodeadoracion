# 🔥 Configuración de Reglas de Firestore

## ⚠️ PROBLEMA ACTUAL: Error al Guardar Eventos

El error "Error al guardar el evento" generalmente se debe a que las reglas de seguridad de Firestore están bloqueando las escrituras.

## 📋 Solución Paso a Paso

### Opción 1: Configurar Reglas Temporales (RÁPIDO - Para Debugging)

1. **Ve a Firebase Console**: https://console.firebase.google.com/
2. **Selecciona tu proyecto**: `ministerioadoracion-73496`
3. **Ve a Firestore Database** (menú lateral izquierdo)
4. **Haz clic en la pestaña "Rules"** (Reglas)
5. **Copia y pega estas reglas TEMPORALES**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. **Haz clic en "Publish"** (Publicar)
7. **Espera 10 segundos**
8. **Refresca tu aplicación** y prueba crear un evento

### Opción 2: Configurar Reglas de Producción (RECOMENDADO)

Una vez que confirmes que funciona con las reglas temporales, usa estas reglas más seguras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Eventos
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Canciones
    match /songs/{songId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Confirmaciones
    match /confirmations/{confirmationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Notificaciones
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔍 Verificar en la Consola del Navegador

Después de aplicar las reglas, abre la consola del navegador (F12) y busca:

### ✅ Si funciona correctamente:
```
💾 Guardando evento: {...}
✅ Evento creado con ID: abc123
```

### ❌ Si sigue fallando:
```
❌ Error guardando evento: FirebaseError: Missing or insufficient permissions
```

Si ves "Missing or insufficient permissions", significa que las reglas no se aplicaron correctamente. Espera 30 segundos más y refresca.

## 📱 Otros Posibles Errores

### Error: "Firestore no inicializado"
**Solución**: Verifica que las variables de entorno estén configuradas en Vercel.

### Error: "Network error"
**Solución**: Verifica tu conexión a internet y que Firebase esté accesible.

### Error: "Index required"
**Solución**: Firebase te dará un link en el error. Haz clic para crear el índice automáticamente.

## 🎯 Próximos Pasos

1. ✅ Aplica las reglas temporales en Firebase Console
2. ✅ Espera 10-30 segundos
3. ✅ Refresca tu aplicación (Ctrl+Shift+R)
4. ✅ Abre la consola del navegador (F12)
5. ✅ Intenta crear un evento
6. ✅ Observa los logs en la consola
7. ✅ Comparte conmigo el mensaje exacto que aparece

## 📞 Necesito Saber

Por favor, después de aplicar las reglas, dime:

1. ¿Qué mensaje exacto aparece en la consola del navegador?
2. ¿El evento se crea ahora o sigue dando error?
3. ¿Ves algún mensaje de Firebase en la consola?

Esto me ayudará a diagnosticar el problema exacto.
