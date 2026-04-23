# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Contador de visitas (Cloud Function + Firestore)

El proyecto incluye un contador de visitas listo para produccion:

- El frontend envia visitas a `POST /api/visits`.
- Firebase Hosting reescribe esa ruta a la funcion `countVisit`.
- La funcion actualiza `analytics/traffic` y deduplica sesiones en backend.
- Firestore bloquea escritura directa del cliente en `analytics/*`.

### Variables opcionales en frontend

- `VITE_VISITS_API_URL`: URL del endpoint de visitas. Por defecto `/api/visits`.
- `VITE_VISITS_BACKEND_MODE`: por defecto `function`.
  - `function`: usa Cloud Function.
  - `firestore-direct`: modo local/no recomendado para produccion.
- `VITE_VISITS_ALLOW_DIRECT_FALLBACK=true`: fallback de emergencia a Firestore directo.

### Desarrollo local con emulador

1. Instala dependencias de funciones:
   - `cd functions`
   - `npm install`
2. Inicia emulador de funciones (desde raiz o desde `functions`):
   - `firebase emulators:start --only functions`
3. Inicia frontend:
   - `npm run dev`

El proxy de Vite redirige `/api/visits` al emulador local.

### Despliegue

1. Compila frontend:
   - `npm run build`
2. Instala dependencias en `functions` (si aun no estan):
   - `cd functions`
   - `npm install`
3. Despliega funciones, reglas y hosting:
   - `firebase deploy --only functions,firestore:rules,hosting`
