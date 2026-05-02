# 🌴 PROMOWEAPP - Turismo Santa Rosa

Bienvenido al repositorio oficial del proyecto **Turismo Santa Rosa**, una plataforma web moderna, rápida y escalable desarrollada para potenciar el turismo en el archipiélago de Jambelí, cantón Santa Rosa, Ecuador.

## 🚀 Características Principales

*   **🌍 Mapa Turístico Interactivo**: Desarrollado con `Leaflet` y `react-leaflet`, permite visualizar rutas y destinos destacados de manera dinámica y optimizada.
*   **🐶 Los 4 Fantásticos (Animaciones Interactivas)**: Integración de mascotas animadas (`framer-motion`) que nadan o saltan aleatoriamente por la pantalla. ¡Totalmente configurables desde el panel de administrador en tiempo real!
*   **🛠️ Sistema de Gestión de Contenidos (CMS)**:
    *   Arquitectura basada en `Realtime Database` de Firebase para permitir ediciones instantáneas en textos, destinos e imágenes del portal.
    *   **RBAC (Control de Acceso Basado en Roles)**: Diferenciación estricta entre Administradores, Editores y Visitantes para restringir y proteger las modificaciones a través de reglas de seguridad avanzadas en Firebase.
*   **📊 Analítica y Tráfico**:
    *   Contador de visitas deduplicado a nivel de servidor utilizando **Cloud Functions** y **Firestore**.
    *   Dashboard analítico que visualiza tráfico real e interacciones del sitio.
*   **📩 Sistema de Contacto y Encuestas**:
    *   Bandejas de entrada administrativas para recepcionar peticiones de negocios, mensajes de turistas y encuestas de satisfacción.
*   **🌐 Internacionalización (i18n)**: Sistema robusto con soporte nativo de multi-idioma integrado desde la arquitectura (`LanguageContext`).

## 🛠️ Stack Tecnológico

**Frontend:**
- **[React 19](https://react.dev/)** + **[Vite 8](https://vitejs.dev/)** (Máximo rendimiento en desarrollo y construcción)
- **CSS Vanilla / Variables CSS** (Arquitectura limpia y libre de frameworks pesados de utilidades)
- **Framer Motion** (Animaciones de UI complejas y físicas)
- **Leaflet** (Mapas)

**Backend & Cloud (Firebase):**
- **Firebase Auth** (Autenticación y manejo de sesión).
- **Firestore** (Datos seguros, analítica, mensajería).
- **Realtime Database** (CMS hiperrápido de contenido público).
- **Cloud Functions (Node 20)** (Procesamiento y conteos de visitas).
- **Firebase Hosting** (Despliegue de frontend y redirecciones al backend).

## 💻 Desarrollo Local

### Prerrequisitos
- Node.js versión v20+
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clonar e Instalar Frontend
```bash
git clone <URL_DEL_REPOSITORIO>
cd turismoSantarosa
npm install
```

### 2. Configurar Firebase / Funciones
El backend local de Cloud Functions permite emular el contador de visitas:
```bash
cd functions
npm install
```

### 3. Ejecución
Para iniciar el proyecto completo en tu entorno de desarrollo, lo más óptimo es utilizar el emulador de backend junto al frontend.

Abre dos terminales:

**Terminal 1 (Emulador de Cloud Functions):**
```bash
cd functions
npm run serve
```

**Terminal 2 (Frontend React):**
```bash
npm run dev
```
> El proxy de Vite se encargará de redirigir los llamados de la API (`/api/visits`) directamente hacia tu emulador local para que la experiencia de desarrollo sea perfecta y libre de CORS.

## 🔒 Reglas de Seguridad y Acceso
Todo el backend está protegido mediante `firestore.rules` y `database.rules.json`.
- **Colección `/settings`**: El estado de la plataforma (como las mascotas flotantes) es de lectura pública, pero su modificación requiere estatus de `isAdmin()`.
- **Colección `/content` (RTDB)**: Totalmente público para lectura, modificable solo si el usuario tiene rol `canEditContent()`.

## 📦 Despliegue a Producción

La plataforma se despliega fácilmente en Firebase. Desde la raíz del proyecto:

1. Compila la versión de producción del frontend:
```bash
npm run build
```
2. Despliega todas las funciones, reglas de seguridad y la página web:
```bash
firebase deploy --only functions,firestore:rules,database:rules,hosting
```

---
*Desarrollado con ❤️ para el turismo de Santa Rosa y el Archipiélago de Jambelí.*
