# Documentacion de cambios - Vista Turista / Visitante Mobile

Proyecto: turismoSantarosa / mobile  
Fecha: 07/06/2026  
Modulo trabajado: App movil Expo / React Native  
Rol objetivo: Turista / Visitante

## Objetivo

Se trabajo la experiencia mobile para el rol Turista / Visitante, tomando como referencia:

- El documento de Especificacion de Requerimientos de Software.
- El contenido publico ya existente en la web.
- La estructura actual de la app mobile.

La intencion fue que el visitante pueda entrar a la aplicacion sin iniciar sesion y consultar informacion turistica adaptada a mobile.

## Cambios principales realizados

### 1. Entrada como visitante sin login obligatorio

Antes, la app iniciaba en la pantalla de login "Acceso a Negocios".

Ahora:

- Si el usuario no ha iniciado sesion, entra directamente a la experiencia turistica.
- El acceso a negocios/admin queda separado dentro de Configuracion.
- Si un usuario inicia sesion con rol `administrador`, se mantiene el flujo hacia admin.
- Si inicia sesion con rol `editor`, se mantiene el flujo hacia editor.

Archivo modificado:

- `src/navigation/AppNavigator.tsx`

### 2. Nueva pantalla de inicio turistico

Se creo una pantalla inicial para visitantes con:

- Carrusel de portada.
- Acciones principales: buscar lugares y ver mapa.
- Estadisticas rapidas.
- Modulos turisticos.
- Recomendados.
- Indicador de contenido guardado/offline.

Archivo creado:

- `src/screens/tourist/TouristHomeScreen.tsx`

### 3. Carrusel de portada conectado a la web

El hero mobile ahora intenta leer los mismos slides de portada de la web desde:

```text
content/heroSlides
```

Si no hay slides disponibles, usa imagenes turisticas de respaldo:

- Playa.
- Manglares.
- Gastronomia.

Esto reemplazo la imagen institucional que no quedaba bien como portada turistica.

Archivos modificados:

- `src/services/tourismContent.ts`
- `src/context/TourismContentContext.tsx`
- `src/screens/tourist/TouristHomeScreen.tsx`

### 4. Contenido publico mobile conectado a Firebase RTDB

Se agrego una capa para leer y normalizar el contenido publico que ya usa la web.

Nodos utilizados:

```text
content/actividades
content/gastronomia
content/hospedajes
content/eventos
content/floraFauna
content/cooperativas
content/heroSlides
```

Esto permite mostrar en mobile el contenido administrado desde la web.

Archivos creados:

- `src/services/tourismContent.ts`
- `src/context/TourismContentContext.tsx`

### 5. Catalogo turistico real

Se reemplazo el catalogo con datos de prueba por un catalogo real que:

- Lista todos los modulos turisticos.
- Permite buscar por nombre, ubicacion, categoria o descripcion.
- Filtra por modulo:
  - Actividades.
  - Gastronomia.
  - Hospedajes.
  - Eventos.
  - Flora y fauna.
  - Transporte.
- Abre la ficha detallada de cada lugar o servicio.

Archivo modificado:

- `src/screens/tourist/CatalogScreen.tsx`

### 6. Detalle turistico

Se rediseño la ficha de detalle para mostrar:

- Imagen.
- Tipo de modulo.
- Nombre.
- Ubicacion.
- Contacto.
- Horario o frecuencia.
- Tarifa referencial si existe.
- Servicios, ruta, salida, llegada, estado u otros campos segun el tipo de contenido.
- Boton para guardar en favoritos.
- Formulario de reseña con estrellas y comentario.

Las reseñas se guardan con estado:

```text
pending_approval
```

Esto respeta el flujo donde el administrador debe aprobar las reseñas antes de hacerlas publicas.

Archivo modificado:

- `src/screens/tourist/PlaceDetailsScreen.tsx`

### 7. Favoritos offline

Se agrego almacenamiento local con AsyncStorage para que el visitante pueda guardar lugares y consultarlos sin conexion.

La informacion guardada incluye:

- Nombre.
- Tipo.
- Descripcion.
- Imagen.
- Ubicacion.
- Contacto.
- Horario/frecuencia.
- Coordenadas.

Archivos creados/modificados:

- `src/services/touristFavorites.ts`
- `src/screens/tourist/TouristFavoritesScreen.tsx`

### 8. Mapa turistico

Se mejoro la pantalla de mapa para:

- Mostrar marcadores de los modulos turisticos.
- Usar GPS si el usuario da permiso.
- Mantener el mapa funcional aunque el GPS falle o sea denegado.
- Filtrar marcadores por tipo.
- Abrir fichas desde los marcadores.

Archivo modificado:

- `src/screens/tourist/TouristMapScreen.tsx`

### 9. Escaner QR

Se actualizo el lector QR para:

- Pedir permiso de camara.
- Leer codigos QR.
- Extraer un `id` desde URL o texto.
- Buscar el registro turistico sincronizado.
- Abrir la ficha si el QR coincide.
- Mostrar alerta si el QR no corresponde a un contenido conocido.

Archivo modificado:

- `src/screens/tourist/QRScannerScreen.tsx`

### 10. Pantalla de configuracion

Se agrego una nueva pantalla de Ajustes con:

- Modo oscuro.
- Selector de idioma.
- Activar/desactivar alertas turisticas.
- Acceso rapido a QR.
- Acceso rapido a favoritos.
- Acceso interno a negocios/admin.

El boton "Negocios" fue removido del carrusel y movido aqui para que la portada sea mas turistica y menos administrativa.

Archivos creados/modificados:

- `src/screens/tourist/TouristSettingsScreen.tsx`
- `src/context/PreferencesContext.tsx`
- `src/navigation/TouristNavigator.tsx`
- `App.tsx`

### 11. Modo oscuro

Se agrego preferencia local para modo oscuro.

Actualmente afecta:

- Pantalla de inicio.
- Pantalla de configuracion.
- Barra de navegacion inferior.
- Tema base de React Navigation.
- Status bar.

Pendiente:

- Aplicarlo completamente a catalogo, detalle, favoritos, mapa y QR.

### 12. Selector de idioma

Se agrego selector manual:

- Español.
- English.
- Portugues.

Actualmente afecta:

- Pantalla de Ajustes.
- Etiquetas de la barra inferior.

Pendiente:

- Traducir todo el contenido fijo de home, catalogo, detalle, favoritos, mapa y QR.
- El contenido cargado desde Firebase depende del idioma en el que fue creado.

### 13. Navegacion mobile

La navegacion del visitante ahora usa tabs:

- Inicio.
- Catalogo.
- Mapa.
- Favoritos.
- QR.
- Ajustes.

Tambien se mantiene una pantalla stack para:

- Detalle turistico.
- Login / Acceso a negocios.

Archivo modificado:

- `src/navigation/TouristNavigator.tsx`

## Dependencias ajustadas

Se instalaron o alinearon dependencias necesarias para Expo:

- `react-native-web`
- `react-dom`
- `expo`
- `expo-localization`

Archivos modificados:

- `package.json`
- `package-lock.json`

## Comandos de verificacion usados

Se verifico TypeScript:

```powershell
npx tsc --noEmit
```

Se verificaron dependencias Expo:

```powershell
npx expo install --check
```

Ambos comandos pasaron correctamente al momento de la documentacion.

## Como ejecutar la app mobile

Desde la carpeta mobile:

```powershell
cd "C:\Users\Public\Visual Studio Projects\turismoSantarosa\mobile"
npx expo start -c
```

Para abrir en emulador Android:

```text
a
```

Para compartir con otros fuera de la misma red:

```powershell
npx expo start --tunnel -c
```

Luego compartir el QR generado por Expo.

## Notas importantes

- La app depende de que Firebase RTDB tenga contenido publico en los nodos indicados.
- Si no hay contenido, se muestran datos/imagenes de respaldo para evitar pantalla vacia.
- El acceso interno no fue eliminado; solo fue movido a Configuracion.
- El modo oscuro y el idioma ya tienen base funcional, pero aun falta extenderlos a todas las pantallas.
- El QR funciona si el codigo contiene un `id` que coincida con algun registro cargado.

## Archivos principales trabajados

```text
App.tsx
src/context/PreferencesContext.tsx
src/context/TourismContentContext.tsx
src/navigation/AppNavigator.tsx
src/navigation/TouristNavigator.tsx
src/screens/tourist/TouristHomeScreen.tsx
src/screens/tourist/CatalogScreen.tsx
src/screens/tourist/PlaceDetailsScreen.tsx
src/screens/tourist/TouristMapScreen.tsx
src/screens/tourist/TouristFavoritesScreen.tsx
src/screens/tourist/QRScannerScreen.tsx
src/screens/tourist/TouristSettingsScreen.tsx
src/services/tourismContent.ts
src/services/touristFavorites.ts
package.json
package-lock.json
```

## Pendientes recomendados

1. Aplicar modo oscuro al 100% en catalogo, detalle, favoritos, mapa y QR.
2. Traducir todas las pantallas nuevas, no solo Ajustes y tabs.
3. Mejorar QR para aceptar formatos oficiales definidos por el equipo.
4. Revisar si los slides de la web tienen imagenes optimizadas para mobile.
5. Agregar pantalla o modal de encuesta de satisfaccion para visitantes.
6. Validar en celular fisico Android y, si es posible, iOS con Expo Go.
7. Revisar con el equipo si "Ajustes" debe llamarse "Configuracion" o "Perfil".
