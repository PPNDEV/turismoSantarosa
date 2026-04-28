# AGENTS.md

Guía para agentes de código con IA que trabajan en este repositorio.

## Resumen Del Proyecto

- Stack: frontend con React 19 + Vite 8, Firebase (Auth, Firestore, Realtime Database, Hosting), Cloud Functions (Node 20).
- Aplicación principal: `src/`
- Backend de funciones: `functions/`
- Configuración/reglas de Firebase: `firebase.json`, `firestore.rules`, `database.rules.json`

Para más contexto, usa estos documentos en lugar de duplicar detalles:

- [QUICK_START.md](QUICK_START.md)
- [FIREBASE_CONFIG.md](FIREBASE_CONFIG.md)
- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)

## Comandos De Ejecución Y Build

Desde la raíz del repositorio:

- Instalar dependencias del frontend: `npm install`
- Iniciar servidor de desarrollo frontend: `npm run dev`
- Compilar frontend: `npm run build`
- Ejecutar lint del frontend: `npm run lint`
- Previsualizar build de producción: `npm run preview`

Servicio de funciones:

- Instalar dependencias de functions: `cd functions && npm install`
- Iniciar emulador de functions: `cd functions && npm run serve`
- Desplegar solo functions: `cd functions && npm run deploy`
- Ver logs de functions: `cd functions && npm run logs`

Flujo local común para la API de visitas:

1. Iniciar el emulador de functions.
2. Iniciar el servidor de desarrollo frontend.
3. El frontend llama a `/api/visits`; Vite redirige al backend local según la configuración.

## Límites De Arquitectura

- Punto de entrada de rutas y composición: `src/App.jsx`
- Bootstrap de la app: `src/main.jsx`
- Páginas públicas: `src/pages/`
- Componentes UI compartidos: `src/components/`
- Páginas/layout del panel admin: `src/admin/`
- Capas de estado y acceso a datos:
  - Flujo de auth y roles/sesión: `src/context/AuthContext.jsx`
  - CMS de contenido y CRUD en RTDB: `src/context/ContentContext.jsx`
  - Idioma y traducciones: `src/context/LanguageContext.jsx`
- Inicialización del cliente Firebase: `src/services/firebase.js`
- Cliente de conteo de visitas: `src/services/visitCounter.js`
- Endpoint backend del conteo de visitas: `functions/src/index.js` (`countVisit`)

## Convenciones Del Modelo De Datos

- El contenido público del CMS se lee/escribe en Realtime Database bajo `content/<node>` (no en Firestore).
- Los datos administrativos/sensibles están en Firestore (`usersPublic`, `usersPrivate`, `messages`, `surveys`, `analytics`).
- Mantén las escrituras de analytics en Firestore pasando por Cloud Function cuando corresponda; las escrituras directas desde cliente están restringidas por reglas para esas colecciones.

## Convenciones De Código En La Práctica

- Usa módulos ES y componentes funcionales/hooks de React en el frontend.
- Sigue el estilo de nombres y archivos existente:
  - Providers de contexto en `src/context/*Context.jsx`
  - Wrappers de hooks en `src/context/use*.jsx`
  - Pantallas admin como `src/admin/Admin*.jsx`
- Respeta la configuración de ESLint en `eslint.config.js`:
  - `no-unused-vars` está activo, con patrón de exclusión para variables que empiezan con mayúscula o guion bajo.
- Mantén los cambios mínimos y localizados; evita refactors amplios salvo que se soliciten explícitamente.

## Riesgos Conocidos

- La documentación puede mencionar ejemplos legacy de `siteContent/main`, mientras que el código activo escribe en RTDB `content/<node>` vía `ContentContext`.
- `README.md` mezcla contenido de plantilla con notas del proyecto; valida el comportamiento contra el código antes de asumir algo por la plantilla.
- El login incluye usuarios de fallback local en `AuthContext`; no elimines este comportamiento salvo que la tarea pida explícitamente endurecer autenticación.
- Los modos por defecto del contador de visitas pueden variar por variables de entorno. Confirma la intención de `VITE_VISITS_BACKEND_MODE` antes de cambiar la lógica.

## Checklist De Validación Para Agentes

Después de cambios en frontend:

1. Ejecutar `npm run lint`.
2. Ejecutar `npm run build` cuando los cambios puedan afectar bundling/rutas.

Después de cambios en functions o en el flujo de analytics:

1. Validar el comportamiento de `functions/src/index.js`.
2. Asegurar que el rewrite de `/api/visits` en `firebase.json` siga apuntando a `countVisit`.
3. Confirmar que la intención de seguridad se mantenga consistente con `firestore.rules` y `database.rules.json`.

## Alcance Seguro De Cambios

- Prioriza editar módulos existentes antes de introducir frameworks nuevos.
- Preserva la terminología de dominio en español y los nombres de roles (`administrador`, `editor`, `visualizador`) usados en auth y reglas.
- Para cambios arquitectónicos grandes, propone primero un plan breve y mapea docs/reglas afectadas antes de implementar.
