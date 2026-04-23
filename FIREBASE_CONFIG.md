# 📚 Configuración de Firebase - Visit Santa Rosa

## Descripción General

Tu proyecto utiliza **Firebase** como backend con dos bases de datos diferentes:

1. **Firestore (Cloud Firestore)** - Base de datos NoSQL en la nube
2. **Realtime Database (RTDB)** - Base de datos en tiempo real

## 🗄️ ¿Cuál Base de Datos se Usa para Qué?

### 1. **Firestore (db)** - Datos Administrativos

**Ubicación:** `src/services/firebase.js`

Firestore almacena:

- ✅ **Usuarios y Roles** (`usersPublic`, `usersPrivate`)
- ✅ **Mensajes de contacto** (`messages`)
- ✅ **Encuestas** (`surveys`)
- ✅ **Analytics/Visitantes** (`analytics/traffic`)

**Por qué Firestore:**

- Mejor para datos estructurados
- Reglas de seguridad granulares (control por usuario/rol)
- Consultas complejas
- Datos sensibles protegidos

**Colecciones Principales:**

```javascript
// Usuarios públicos - visible por todos
usersPublic/{uid} = { displayName, role, active, createdAt, updatedAt }

// Datos privados - solo admin
usersPrivate/{uid} = { email, deletedAt, updatedAt }

// Analytics - registra visitantes
analytics/traffic/{ruta} = { views, sessions, lastUpdated }

// Mensajes de contacto
messages/{id} = { name, email, message, timestamp }

// Encuestas
surveys/{id} = { question, responses, timestamp }
```

### 2. **Realtime Database (rtdb)** - Contenido CMS (Público)

**Ubicación:** `src/services/firebase.js`

RTDB almacena:

- 📝 **Contenido del CMS** (`siteContent/main`)
- 🖼️ **Portada (slides)**
- 🎯 **Destinos**
- 📰 **Blog**
- 🖼️ **Galería**
- 🍽️ **Gastronomía**
- 🏨 **Hospedajes**
- 🦋 **Flora/Fauna**
- 🤝 **Cooperativas**

**Por qué RTDB:**

- Acceso público sin autenticación (más rápido)
- Cero lecturas de Firestore (ahorro de costos)
- Sincronización en tiempo real
- Ideal para contenido que cambia frecuentemente

**Estructura de Datos:**

```javascript
{
  "siteContent": {
    "main": {
      "portada": [ { id, title, image, ... }, ... ],
      "destinos": [ { id, title, coords, ... }, ... ],
      "eventos": [ { id, name, date, ... }, ... ],
      "blog": [ { id, title, content, ... }, ... ],
      "galeria": [ { id, images, ... }, ... ],
      "gastronomia": [ { id, name, description, ... }, ... ],
      "hospedajes": [ { id, name, location, ... }, ... ],
      "floraFauna": [ { id, name, type, ... }, ... ],
      "cooperativas": [ { id, name, contact, ... }, ... ]
    }
  }
}
```

## 🔧 Configuración en .env

Copia el archivo `.env.example` a `.env` y complétalo:

```bash
# Copia de la consola Firebase > Configuración del Proyecto > Credenciales

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=visit-santa-rosa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=visit-santa-rosa-xxxx
VITE_FIREBASE_DATABASE_URL=https://visit-santa-rosa-xxxx-default-rtdb.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=visit-santa-rosa-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXX
```

**Cómo obtener estos valores:**

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. ⚙️ Configuración > Configuración del Proyecto
4. Web apps > (tu app) > Configuración
5. Copia los valores en `.env`

## 🔐 Reglas de Seguridad

### Firebase Rules (`firestore.rules`)

**Firestore - Seguridad Estricta:**

```javascript
// Solo usuarios autenticados
match /usersPublic/{uid} {
  allow read: if request.auth.uid == uid || isAdmin(request.auth.uid);
  allow write: if isAdmin(request.auth.uid);
}

// Solo admins
match /usersPrivate/{uid} {
  allow read, write: if isAdmin(request.auth.uid);
}

// Analytics - solo escritura desde backend
match /analytics/{document=**} {
  allow read: if isAdmin(request.auth.uid);
  allow write: if false;  // Bloqueado, usa Cloud Functions
}
```

**RTDB - Pública pero segura:**

```json
{
  "rules": {
    "siteContent": {
      ".read": true,
      ".write": false,
      "main": {
        ".write": "auth.uid !== null && (root.child('admins').child(auth.uid).val() === true)"
      }
    }
  }
}
```

## 👤 Usuarios de Prueba

El login tiene credenciales locales de fallback:

```javascript
Admin:        admin@santarosa.ec / admin123
Editor:       editor@santarosa.ec / editor123
Visualizador: visualizador@santarosa.ec / viewer123
```

**Roles disponibles:**

- 👑 `administrador` - Acceso total, gestión de usuarios
- ✏️ `editor` - Crear/editar contenido
- 👁️ `visualizador` - Solo lectura

## 🚀 Cómo Funciona el Login

```javascript
// 1. Validar credenciales locales (rápido)
const localUser = defaultUsers.find(
  (u) => u.email === email && u.password === password,
);
if (!localUser) throw new Error("Credenciales incorrectas");

// 2. Intentar Firebase Auth (si está disponible)
try {
  const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
  // ✅ Usar sesión de Firebase
} catch (error) {
  // ❌ Firebase no disponible, usar fallback local
  // ✅ Usuario sigue conectado con permisos locales
}
```

**Ventaja:** Si Firebase está en modo anónimo o no responde, el login sigue funcionando con permisos locales.

## 📊 Estructura de Carpetas

```
visit-santa-rosa/
├── .env                     ← Tu configuración (NO subir a Git)
├── .env.example            ← Template de ejemplo
├── src/
│   ├── services/
│   │   ├── firebase.js      ← Inicialización (Auth, Firestore, RTDB)
│   │   ├── visitCounter.js  ← Registra visitas en analytics
│   ├── context/
│   │   ├── AuthContext.jsx  ← Login con fallback
│   │   ├── ContentContext.jsx ← CMS sincronizado
├── functions/
│   ├── src/
│   │   └── index.js         ← Cloud Function para visitantes
│   ├── firestore.rules      ← Reglas de Firestore
```

## 🆚 Comparación: Firestore vs RTDB

| Aspecto         | Firestore                  | RTDB            |
| --------------- | -------------------------- | --------------- |
| Estructura      | Documentos/Colecciones     | Árbol JSON      |
| Autenticación   | Requerida                  | Opcional        |
| Costo           | Por operación              | Por GB/mes      |
| Seguridad       | Reglas complejas           | Reglas simples  |
| Uso en proyecto | Admin, usuarios, analytics | CMS público     |
| Velocidad       | ⚡ Rápida                  | ⚡⚡ Muy rápida |

## 🔧 Solución de Problemas

### ❌ "Firebase is not available"

**Solución:** Verifica que el `.env` tenga valores correctos

### ❌ "Permission denied" en Firestore

**Solución:** Revisa `firestore.rules` y asegúrate de que el usuario tenga el rol correcto

### ❌ Login lento

**Solución:** Se está intentando Firebase primero. Es normal, se usará el fallback local automáticamente.

### ❌ Cambios en CMS no se guardan

**Solución:**

1. Verifica RTDB esté habilitada en Firebase Console
2. Revisa `firestore.rules` permite escritura
3. Revisa la consola del navegador para errores

## 📱 Uso del API de Visitantes

El contador de visitas usa Cloud Functions:

```javascript
// Registra una visita automáticamente
import { recordVisit } from "@/services/visitCounter";
recordVisit("/destinos"); // registra visita a /destinos

// AdminDashboard muestra analytics en vivo
import { subscribeVisitMetrics } from "@/context/ContentContext";
const unsubscribe = subscribeVisitMetrics((metrics) => {
  console.log(metrics); // { "/": 450, "/destinos": 120, ... }
});
```

## ✅ Checklist de Configuración

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Firestore en modo producción
- [ ] Habilitar Realtime Database
- [ ] Habilitar Authentication (Email/Password)
- [ ] Copiar credenciales a `.env`
- [ ] Subir `firestore.rules` en console
- [ ] Crear usuarios en Authentication console (opcional)
- [ ] Probar login en localhost
- [ ] Revisar analytics en AdminDashboard

## 🎯 Próximos Pasos

1. **Configurar Firebase** según este documento
2. **Activar Firestore Rules** desde Firebase Console
3. **Crear primeros usuarios** en auth > Users
4. **Probar el login** con credenciales de Firebase
5. **Monitor analytics** en `/admin` > Dashboard
