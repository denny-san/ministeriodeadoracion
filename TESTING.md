# Plan de Pruebas — Sistema de Sincronización en Tiempo Real

## Credenciales de Prueba

```
Líder:  lider@test.com / Password123!
Músico: musico@test.com / Password123!
```

Genera estos usuarios ejecutando:
```bash
npm run seed
```

## Pasos de Prueba (Smoke Test)

### 1️⃣ **Sincronización de Eventos en Tiempo Real**

**Objetivo**: Verificar que cuando un líder crea un evento, aparece instantáneamente en la agenda del músico.

**Pasos**:
1. Abre dos ventanas del navegador (o dos pestañas):
   - Ventana A: Loguea como `lider@test.com`
   - Ventana B: Loguea como `musico@test.com`
2. En la Ventana A, ve a **Ensayos** (Calendar)
3. Haz clic en un día cualquiera y crea un evento:
   - Título: "Ensayo de Prueba"
   - Fecha: cualquier día futuro
   - Hora: 19:00
   - Tipo: Ensayo
   - Guarda
4. **Sin recargar**, observa la Ventana B → **Mi Agenda** → **Próximo Evento**
   - ✅ Debe aparecer "Ensayo de Prueba" en la lista

**Evidencia**:
- Abre F12 (DevTools) → Console tab
- En Ventana A, durante el guardado verás:
  ```
  📸 Guardando evento: {...}
  ✅ Evento creado con ID: ...
  ```
- En Ventana B, observa el callback:
  ```
  onSnapshot listener triggered: eventos actualizado
  ```
- Si ves estos logs, la sincronización funciona.

---

### 2️⃣ **Persistencia después de Recarga**

**Objetivo**: Verificar que los datos persisten en Firestore y se cargan al recargar la página.

**Pasos**:
1. En la Ventana B (músico), recarga la página (F5 o Ctrl+R)
2. Navega a **Mi Agenda** nuevamente
3. ✅ El evento "Ensayo de Prueba" debe seguir apareciendo

---

### 3️⃣ **Eliminación de Eventos**

**Objetivo**: Verificar que un líder puede eliminar eventos y se refleja en tiempo real.

**Pasos**:
1. En la Ventana A (líder), ve a **Ensayos**
2. Haz clic en el evento "Ensayo de Prueba" que creaste
3. Haz clic en el botón **Eliminar**
4. Confirma
5. **Sin recargar**, ve a la Ventana B (músico)
6. ✅ El evento debe desaparecer de **Mi Agenda**

---

### 4️⃣ **Sincronización de Canciones**

**Objetivo**: Verificar que las canciones asignadas a un evento aparecen en tiempo real.

**Pasos**:
1. En la Ventana A (líder), ve a **Canciones**
2. Crea una nueva canción:
   - Título: "Canción de Prueba"
   - Artista: "Test Artist"
   - Tonalidad: G
   - Guarda
3. **Sin recargar**, ve a la Ventana B (músico)
4. Navega a **Mi Agenda**
5. En **📻 Repertorio de Canciones**, ✅ debe aparecer "Canción de Prueba"

---

### 5️⃣ **Actualización de Foto de Perfil**

**Objetivo**: Verificar que los cambios de avatar persisten y se sincronizan.

**Pasos**:
1. En cualquier ventana, haz clic en tu avatar (esquina superior derecha)
2. Abre el menú de perfil → Haz clic en el ícono de cámara
3. Selecciona una imagen (cualquier JPG/PNG de tu computadora)
4. Abre F12 Console y observa:
   ```
   📸 Foto convertida a base64...
   ✅ Foto de perfil actualizada exitosamente
   ```
5. ✅ La foto debe cambiar inmediatamente en:
   - Header (esquina superior derecha)
   - Perfil (menu de usuario)
   - **Mi Agenda** (si eres músico)
6. Recarga la página (F5)
7. ✅ La foto debe persistir

---

### 6️⃣ **Confirmación de Asistencia**

**Objetivo**: Verificar que un músico puede confirmar asistencia y el líder lo ve.

**Pasos**:
1. En la Ventana A (líder), ve a **Dashboard** → Mira la sección "Confirmaciones"
2. En la Ventana B (músico), ve a **Mi Agenda** → **Próximo Evento** → Haz clic en **CONFIRMAR ASISTENCIA**
3. El botón debe volverse verde y mostrar **CONFIRMADO**
4. **Sin recargar**, ve a la Ventana A (líder)
5. En **Dashboard**, ✅ debe aparecer en la lista de confirmaciones para ese evento

---

## Solución de Problemas

### Si los eventos no aparecen en tiempo real:

1. **Abre DevTools (F12) → Console**
   - Busca mensajes de error rojo (❌)
   - Busca logs de `onSnapshot`

2. **Verifica que la colección existe en Firestore**:
   - Ve a Firebase Console → Firestore Database
   - Busca la colección `events`
   - Debe contener los eventos creados

3. **Verifica que el usuario tiene rol**:
   - En Firestore, ve a `/users/{uid}`
   - Asegúrate que existe el campo `rol: "Leader"` o `rol: "Musician"`

4. **Verifica que Firestore Rules está deployed**:
   - En Firebase Console → Firestore → Rules
   - Debe tener las reglas del archivo `firestore.rules` de este repositorio

### Si la foto no se actualiza:

1. **Verifica Storage en Firebase Console**:
   - Ve a Storage → Mira la carpeta `users/{uid}/`
   - Debe contener un archivo `photo.jpg`

2. **Verifica el URL de descarga**:
   - En DevTools Console, deberías ver:
   ```
   ✅ Foto subida, URL obtenida: https://firebasestorage.googleapis.com/...
   ```

3. **Borra caché del navegador**:
   - Si la foto vieja sigue mostrándose, es un problema de caché
   - Presiona `Ctrl+Shift+Delete` para abrir limpiar caché

---

## Checklist de Validación

- [ ] Evento creado por líder aparece en músico sin recargar
- [ ] Evento persiste después de recargar
- [ ] Evento eliminado desaparece en tiempo real
- [ ] Canción creada aparece en repertorio del músico
- [ ] Avatar se actualiza en tiempo real
- [ ] Avatar persiste después de recargar
- [ ] Confirmación de asistencia aparece en dashboard del líder
- [ ] Notificaciones se sincronizan en tiempo real

---

## Si todo pasa ✅

Todos los listeners y sincronización en tiempo real están funcionando correctamente. La próxima fase es:
1. Desplegar `firestore.rules` y `storage.rules` a Firebase
2. Hacer más pruebas en producción (Vercel)
