# Scripts de Inicialización - Visit Santa Rosa

## 🚀 Inicialización Completa de Firebase

**Script:** `scripts/init-firebase.ps1` (PowerShell)

Este script hace TODO lo necesario para configurar Firebase:

1. ✅ Verifica Firebase CLI
2. ✅ Instala dependencias (frontend + functions)
3. ✅ Despliega reglas de Firestore
4. ✅ Despliega reglas de Realtime Database
5. ✅ Despliega Cloud Functions (`countVisit`)
6. ✅ Inicializa datos en Firestore
7. ✅ Compila el frontend
8. ✅ Opcional: Despliega a Firebase Hosting

### Ejecutar:

```powershell
.\scripts\init-firebase.ps1
```

---

## 👥 Inicializar Usuarios Administrativos

**Script:** `scripts/init-admin-users.js`

Crea los documentos de usuarios en Firestore:

- `admin@santarosa.ec` (administrador)
- `editor@santarosa.ec` (editor)
- `visualizador@santarosa.ec` (visualizador)

### Ejecutar:

```bash
node scripts/init-admin-users.js
```

### Credenciales:

| Rol           | Email                     | Password  |
| ------------- | ------------------------- | --------- |
| Administrador | admin@santarosa.ec        | admin123  |
| Editor        | editor@santarosa.ec       | editor123 |
| Visualizador  | visualizador@santarosa.ec | viewer123 |

**Nota:** Los passwords se usan solo para fallback local. Para Firebase Auth, configúralos manualmente en:

- Firebase Console → Authentication → Users → Add User

---

## 📊 Verificar Datos en Firestore

Después de ejecutar los scripts, verifica en:

- Firebase Console → Firestore Database

Deberías ver:

- `usersPublic/{uid}` - Perfiles públicos
- `usersPrivate/{uid}` - Emails privados
- `actividades/{id}` - Actividades turísticas
- `gastronomia/{id}` - Restaurantes
- `hospedajes/{id}` - Hoteles/hostales
- `eventos/{id}` - Eventos
- `flora_fauna/{id}` - Especies
- `transporte/{id}` - Cooperativas
- `galeria/{id}` - Imágenes
- `metricas_sitio/estadisticas_generales` - Contador global

---

## 🔧 Comandos Útiles

```bash
# Ver logs de Cloud Functions
firebase functions:log

# Ver datos de Firestore
firebase firestore:delete --all-collections --yes  # ⚠️ BORRA TODO

# Desplegar solo functions
firebase deploy --only functions

# Desplegar solo reglas
firebase deploy --only firestore:rules,database:rules

# Desplegar solo hosting
firebase deploy --only hosting
```

---

## ✅ Checklist Post-Inicialización

- [ ] Reglas de Firestore desplegadas
- [ ] Reglas de Realtime Database desplegadas
- [ ] Cloud Function `countVisit` desplegada
- [ ] Usuarios en Firestore (`usersPublic`, `usersPrivate`)
- [ ] Datos de ejemplo en Firestore (actividades, gastronomia, etc.)
- [ ] Contenido en Realtime Database (`content/*`)
- [ ] Login funciona con credenciales admin
- [ ] Panel admin accesible
- [ ] Contador de visitas funcionando

---

## 🆘 Solución de Problemas

### Error: "Firebase CLI no está instalado"

```bash
npm install -g firebase-tools
```

### Error: "No estás autenticado"

```bash
firebase login
```

### Error: "Function deployment failed"

1. Verifica que `functions/package.json` tenga las dependencias
2. Ejecuta `cd functions && npm install`
3. Revisa los logs: `firebase functions:log`

### Error: "Firestore rules deployment failed"

Verifica que `firestore.rules` exista y tenga sintaxis válida.

### Los usuarios no aparecen en Firestore

Ejecuta: `node scripts/init-admin-users.js`

### El login no funciona con Firebase

1. Verifica `.env` con las credenciales correctas
2. Configura los usuarios en Firebase Auth Console
3. O usa el fallback local (ya configurado)
