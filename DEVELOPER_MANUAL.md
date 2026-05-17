# Manual del Programador: PROMOWEAPP - App Móvil

Este documento detalla la arquitectura, decisiones de diseño y las implementaciones clave realizadas durante la fase de actualización a **Release Candidate (RC)** de la aplicación móvil (React Native / Expo) de PROMOWEAPP. Sirve como guía de referencia para futuros desarrolladores que necesiten escalar o dar mantenimiento al proyecto.

---

## 1. Arquitectura de Navegación (Admin y Turista)

La aplicación gestiona dos flujos de navegación completamente separados basados en el Rol del usuario (Administrador vs. Visualizador).

### El Flujo Administrativo (`AdminNavigator.tsx`)
Se reemplazó un stack simple por un esquema moderno de **Bottom Tabs (Pestañas Inferiores)** (`@react-navigation/bottom-tabs`).
*   **Tab Inicio (`AdminDashboardScreen`)**: Panel de control con tarjeta de métricas (Vistas, Sesiones, Eventos) y un gráfico de barras (implementado con `Views` nativas de React Native para evitar dependencias inestables de SVG).
*   **Tab Contenido (`AdminContenidoScreen`)**: Índice principal de los módulos de la app (Gastronomía, Hospedajes, Transporte, etc.). Enruta las solicitudes a través de un Stack anidado hacia `GenericAdminScreen`.
*   **Tab Mensajes (`AdminMensajesScreen`)**: Cliente de lectura de la colección `messages` en Firestore, con sistema de marcadores de "No Leído" (punto verde) e iterador en tiempo real.
*   **Tab Usuarios (`AdminUsuariosScreen`)**: Lector de la colección `usersPublic`. Permite al administrador cambiar permisos al vuelo.

### El Flujo Turista (`AppNavigator.tsx`)
Permanece enfocado en la experiencia del usuario, utilizando el mapa, la cámara para el escáner QR y visualización de módulos.

---

## 2. El Administrador Universal (`GenericAdminScreen`)

El mayor hito del desarrollo móvil fue abandonar la idea de programar 8 pantallas separadas para editar cada tipo de negocio.
En su lugar, creamos `GenericAdminScreen.tsx`.

*   **¿Cómo funciona?** Recibe parámetros dinámicos de ruta (ej. `nodeKey: 'gastronomia'`, `fields: ['nombre', 'isla', 'horario']`).
*   **Conexión en Vivo (Live):** Se salta la base de borradores y se conecta **directamente** a Firebase Realtime Database (`rtdb`) escuchando `content/<nodeKey>`.
*   **Backend Híbrido:** Para realizar inserciones o borrados, la app móvil invoca exactamente las mismas Cloud Functions que usa la página Web (`adminUpsertContent`, `adminDeleteContent`). Esto asegura 100% de paridad en las reglas de negocio, validaciones y triggers.

---

## 3. Barrera de Seguridad: Cuentas No Verificadas

Para evitar ataques de spam y registros falsos, se endureció el flujo de inicio de sesión en `AuthContext.tsx`.

*   **La Regla:** Si el usuario entra exitosamente mediante Email/Password pero la propiedad `firebaseUser.emailVerified` es `false`, se bloquea el seteo de su rol real.
*   **El Castigo:** Se le asigna el rol temporal `"unverified"`.
*   **La Resolución:** El Router (`AppNavigator.tsx`) detecta este rol y lo fuerza a ver **únicamente** la pantalla `UnverifiedScreen.tsx`, donde se le impide avanzar y se le ofrece un botón para "Reenviar correo de verificación". Solo cuando confirma el correo, recupera el acceso al sistema.

---

## 4. Internacionalización Dinámica (i18n)

La app está preparada para el turismo global:
*   **Motor:** `react-i18next` con detección nativa gracias a `expo-localization`.
*   **Estructura:** Los diccionarios están en `src/locales/` (`en.json`, `es.json`, `pt.json`).
*   **Mecánica:** En cuanto la app arranca (`App.tsx`), lee el idioma del dispositivo y cambia todos los textos (botones, alertas y títulos de módulos) al idioma detectado sin intervención del usuario.

---

## 5. Mejoras Nativas: Escáner QR y Reseñas

### Escáner QR Inteligente (`QRScannerScreen.tsx`)
Se diseñó un mecanismo tolerante a fallos para leer señalética en el mundo real.
*   Si el QR contiene directamente el ID del lugar (ej. `lugar-123`), lo lee y abre `PlaceDetailsScreen`.
*   Si el QR contiene una URL compartida (ej. `https://turismosantarosa.com/lugar/hotel-luna`), el código utiliza `.split('/')` y extrae inteligentemente el último bloque, interpretándolo como el ID para abrir la ficha correspondiente.

### Sistema de Valoración (Ratings)
*   Se eliminó la construcción manual de estrellas.
*   Se incorporó la librería `react-native-ratings` en `PlaceDetailsScreen.tsx`.
*   Permite interacciones táctiles de arrastre fluido. Al enviar la reseña, se escribe en la colección `reviews` de Firestore, dejando pendiente la aprobación administrativa.

---

## 6. Decisiones Arquitectónicas y Troubleshooting (Registro de Fallos)

### El caso `victory-native` y SVGs (Invariant Violation)
Durante el desarrollo del Dashboard, se intentó implementar gráficos con `victory-native`.
*   **Problema:** Al correr en Expo, surgió el error `Invariant Violation: View config getter callback for component 'line' must be a function`. Esto ocurre por incompatibilidades profundas entre versiones recientes de `react-native-svg` (v15) y los mapeos heredados de `victory-native`.
*   **Solución Adoptada:** En lugar de forzar *downgrades* masivos o introducir librerías de alto impacto (`react-native-skia`) que pondrían en riesgo los tiempos de compilación, se construyó una gráfica de barras personalizada ("Custom Bar Chart") en `AdminDashboardScreen.tsx` usando puros componentes `<View>` de React Native.
*   **Resultado:** Cero dependencias externas adicionales, 100% de inmunidad a fallos de SVG, y estética idéntica.

### Manejo de Tipos en TypeScript
Se actualizó el archivo de tipos (y temporalmente `AuthContext.tsx`) para asegurar que el sistema TypeScript reconozca `unverified` como un estado válido en el `Role`, previniendo errores estrictos de compilación durante los *builds* de CI/CD.

---

*Documento generado por Antigravity (IA) durante la auditoría de Requerimientos de Software - PROMOWEAPP.*
