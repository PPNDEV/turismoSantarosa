// =========================================================================
// Datos semilla para las colecciones de Firestore
// Los campos coinciden con el esquema definido en el README del proyecto.
// Las coordenadas (lat, lng) se convierten a GeoPoint al escribir a Firestore.
// =========================================================================

export const demoActividades = [
  {
    id: "act-1",
    nombre: "Paseo en lancha por los manglares",
    descripcion:
      "Recorrido guiado a través de los canales de manglar del Archipiélago de Jambelí, ideal para observación de aves y fotografía natural.",
    isla: "Jambelí",
    lat: -3.312,
    lng: -80.083,
  },
  {
    id: "act-2",
    nombre: "Avistamiento de ballenas jorobadas",
    descripcion:
      "Excursión marítima desde Puerto Hualtaco hacia Isla Santa Clara para observar ballenas jorobadas durante la temporada agosto–octubre.",
    isla: "Costa Rica",
    lat: -3.173,
    lng: -80.435,
  },
  {
    id: "act-3",
    nombre: "Kayak en Laguna La Tembladera",
    descripcion:
      "Aventura de kayak en el humedal natural, rodeado de biodiversidad y paisajes impresionantes.",
    isla: "San Gregorio",
    lat: -3.595,
    lng: -79.971,
  },
  {
    id: "act-4",
    nombre: "Snorkeling en la playa de Jambelí",
    descripcion:
      "Descubre la vida marina submarina en las aguas cristalinas de la costa de Jambelí.",
    isla: "Jambelí",
    lat: -3.315,
    lng: -80.080,
  },
];

export const demoEventos = [
  {
    id: "1",
    nombre: "Fiestas de Santa Rosa de Lima",
    descripcion:
      "Celebración patronal con desfiles, música y cultura local. Evento más importante del cantón.",
    fecha: "2026-08-23",
    hora: "18:00",
    lugar: "Parque Central de Santa Rosa",
    tipo: "cultural",
    organizador: "GAD Municipal de Santa Rosa",
    contacto: "turismo@santarosa.gob.ec",
    imagen:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600",
    activo: true,
    isla: "Jambelí",
  },
  {
    id: "2",
    nombre: "Festival del Rey Langostino",
    descripcion:
      "Homenaje a la industria camaronera, pilar de la economía de Santa Rosa. Gastronomía, música y artesanía.",
    fecha: "2026-08-25",
    hora: "13:00",
    lugar: "Malecón de Santa Rosa",
    tipo: "festivo",
    organizador: "Asociación de Emprendedores de Santa Rosa",
    contacto: "0981234567",
    imagen:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    activo: true,
    isla: "Jambelí",
  },
  {
    id: "3",
    nombre: "Tour de Avistamiento de Ballenas",
    descripcion:
      "Temporada de ballenas jorobadas. Excursiones marítimas desde Puerto Hualtaco hacia Isla Santa Clara.",
    fecha: "2026-08-01",
    hora: "06:30",
    lugar: "Puerto Hualtaco",
    tipo: "deportivo",
    organizador: "Operadoras turísticas autorizadas",
    contacto: "info@visitasantarosa.ec",
    imagen: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600",
    activo: true,
    isla: "Costa Rica",
  },
  {
    id: "4",
    nombre: "Semana de la Cultura Orense",
    descripcion:
      "Exposiciones culturales, danza folclórica y muestras artísticas de la provincia de El Oro.",
    fecha: "2026-10-15",
    hora: "16:00",
    lugar: "Casa de la Cultura, Santa Rosa",
    tipo: "cultural",
    organizador: "Casa de la Cultura Núcleo de El Oro",
    contacto: "cultura@santarosa.gob.ec",
    imagen:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600",
    activo: true,
    isla: "San Gregorio",
  },
];

export const demoBlog = [
  {
    id: "1",
    titulo: "5 razones para visitar el Archipiélago de Jambelí",
    resumen:
      "Playas vírgenes, manglares y fauna única te esperan en este paraíso costero del sur del Ecuador.",
    imagen:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    fecha: "2026-04-10",
    autor: "Turismo Santa Rosa",
    categoria: "Destinos",
  },
  {
    id: "2",
    titulo: "Gastronomía de Santa Rosa: Sabores del mar",
    resumen:
      "Desde la parihuela hasta los cebiches de concha, descubre por qué Santa Rosa es el destino gastronómico de El Oro.",
    imagen: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600",
    fecha: "2026-03-28",
    autor: "Turismo Santa Rosa",
    categoria: "Gastronomía",
  },
  {
    id: "3",
    titulo: "Isla Santa Clara: El santuario de vida marina",
    resumen:
      "Conoce el área protegida donde conviven lobos marinos, piqueros de patas azules y ballenas jorobadas.",
    imagen:
      "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600",
    fecha: "2026-03-15",
    autor: "Turismo Santa Rosa",
    categoria: "Naturaleza",
  },
  {
    id: "4",
    titulo: "Guía completa para llegar a Santa Rosa",
    resumen:
      "Desde Guayaquil, Cuenca o Loja: todas las rutas para llegar a La Benemérita del Ecuador.",
    imagen: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
    fecha: "2026-03-05",
    autor: "Redacción",
    categoria: "Viaje",
  },
  {
    id: "5",
    titulo: "Laguna La Tembladera: Un humedal por descubrir",
    resumen:
      "Avistamiento de aves, kayak y naturaleza pura en este laboratorio natural de agua de Santa Rosa.",
    imagen:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
    fecha: "2026-02-20",
    autor: "Turismo Santa Rosa",
    categoria: "Ecoturismo",
  },
  {
    id: "6",
    titulo: "Puerto Jelí: El rincón gastronómico de los mariscos",
    resumen:
      "Un recorrido por los mejores restaurantes de mariscos y la cultura pesquera de Puerto Jelí.",
    imagen:
      "https://images.unsplash.com/photo-1565299715199-866c917206bb?w=600",
    fecha: "2026-02-10",
    autor: "Redacción",
    categoria: "Gastronomía",
  },
];

export const demoDestinos = [
  {
    id: "1",
    nombre: "Isla Jambelí",
    isla: "Jambelí",
    descripcion:
      "El balneario más visitado del Archipiélago. Playas de arena blanca, hosterías y sabores del mar a pie de playa.",
    imagen:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    categoria: "Playa",
    icono: "playa",
    lat: -3.312,
    lng: -80.083,
  },
  {
    id: "2",
    nombre: "Isla Santa Clara",
    isla: "Costa Rica",
    descripcion:
      "Área protegida con lobos marinos, piqueros de patas azules y avistamiento de ballenas jorobadas (agosto–octubre).",
    imagen:
      "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600",
    categoria: "Naturaleza",
    icono: "naturaleza",
    lat: -3.173,
    lng: -80.435,
  },
  {
    id: "3",
    nombre: "Puerto Jelí",
    isla: "San Gregorio",
    descripcion:
      "Famoso por su gastronomía de mariscos frescos y ambiente vinculado a la cultura pesquera y los manglares.",
    imagen: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600",
    categoria: "Gastronomía",
    icono: "gastronomia",
    lat: -3.468,
    lng: -80.052,
  },
  {
    id: "4",
    nombre: "Laguna La Tembladera",
    isla: "Santa Rosa continental",
    descripcion:
      "Humedal natural ideal para ecoturismo, kayak y observación de aves en un entorno de gran biodiversidad.",
    imagen:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
    categoria: "Ecoturismo",
    icono: "ecoturismo",
    lat: -3.595,
    lng: -79.971,
  },
];

export const demoGaleria = [
  {
    id: "1",
    url_archivo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Playas del Archipiélago de Jambelí",
    isla: "Jambelí",
  },
  {
    id: "2",
    url_archivo: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800",
    url: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Mariscos frescos de Puerto Jelí",
    isla: "San Gregorio",
  },
  {
    id: "3",
    url_archivo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Laguna La Tembladera",
    isla: "Jambelí",
  },
  {
    id: "4",
    url_archivo: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800",
    url: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "banner_inicio",
    titulo: "Fauna marina de Isla Santa Clara",
    isla: "Costa Rica",
  },
  {
    id: "5",
    url_archivo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Transporte a las islas",
    isla: "Jambelí",
  },
  {
    id: "6",
    url_archivo: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800",
    url: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Avistamiento de ballenas",
    isla: "Costa Rica",
  },
  {
    id: "7",
    url_archivo: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Festival de Santa Rosa de Lima",
    isla: "Jambelí",
  },
  {
    id: "8",
    url_archivo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Gastronomía típica",
    isla: "San Gregorio",
  },
  {
    id: "9",
    url_archivo: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    tipo_archivo: "foto",
    tipo: "foto",
    seccion: "galeria_general",
    titulo: "Cultura y tradiciones",
    isla: "Jambelí",
  },
];

export const demoGastronomia = [
  {
    id: "g-1",
    nombre: "Comedor La Perla del Mar",
    nombre_local: "Comedor La Perla del Mar",
    isla: "Jambelí",
    platoTipico: "Ceviche mixto y parihuela",
    platos_tipicos: ["Ceviche mixto", "Parihuela", "Arroz marinero"],
    descripcion:
      "Especialidad en mariscos frescos y recetas tradicionales de la costa orense.",
    ubicacion: "Malecón principal de Isla Jambelí",
    horario: "09:00 - 19:00",
    contacto: "+593 98 111 2233",
    imagen:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700",
    lat: -3.311,
    lng: -80.084,
  },
  {
    id: "g-2",
    nombre: "Restaurante Costa Rica Sabores",
    nombre_local: "Restaurante Costa Rica Sabores",
    isla: "Costa Rica",
    platoTipico: "Arroz marinero y encocado de pescado",
    platos_tipicos: ["Arroz marinero", "Encocado de pescado", "Ceviche de concha"],
    descripcion:
      "Cocina de autor inspirada en productos locales y pesca artesanal del archipiélago.",
    ubicacion: "Zona de playa, Isla Costa Rica",
    horario: "10:00 - 20:00",
    contacto: "+593 99 224 1188",
    imagen: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=700",
    lat: -3.256,
    lng: -80.118,
  },
  {
    id: "g-3",
    nombre: "Marisquería San Gregorio",
    nombre_local: "Marisquería San Gregorio",
    isla: "San Gregorio",
    platoTipico: "Sudado de cangrejo y arroz con concha",
    platos_tipicos: ["Sudado de cangrejo", "Arroz con concha", "Sopa marinera"],
    descripcion:
      "Ambiente familiar con platos típicos y menú de temporada según captura del día.",
    ubicacion: "Muelle comunitario de San Gregorio",
    horario: "08:30 - 18:30",
    contacto: "+593 97 456 7800",
    imagen:
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=700",
    lat: -3.355,
    lng: -80.109,
  },
];

export const demoHospedajes = [
  {
    id: "h-1",
    nombre: "Hostería Brisa Jambelí",
    isla: "Jambelí",
    ubicacion: "Frente al malecón de Isla Jambelí",
    servicios: "Wifi, Restaurante, Piscina, Kayak",
    contacto: "+593 99 540 1200",
    imagen:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700",
    lat: -3.313,
    lng: -80.085,
  },
  {
    id: "h-2",
    nombre: "Eco Lodge Costa Rica",
    isla: "Costa Rica",
    ubicacion: "Sector playa norte, Isla Costa Rica",
    servicios: "Wifi, Desayuno, Tours, Observación de aves",
    contacto: "+593 98 120 7741",
    imagen:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=700",
    lat: -3.254,
    lng: -80.116,
  },
  {
    id: "h-3",
    nombre: "Cabañas San Gregorio",
    isla: "San Gregorio",
    ubicacion: "Zona central de la isla, junto al muelle",
    servicios: "Aire acondicionado, Wifi, Parqueo de lanchas",
    contacto: "+593 99 330 6670",
    imagen:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=700",
    lat: -3.356,
    lng: -80.108,
  },
];

export const demoFloraFauna = [
  {
    id: "ff-1",
    nombre: "Piqueros de patas azules",
    nombre_especie: "Piqueros de patas azules",
    tipo: "Fauna",
    categoria: "fauna",
    zona: "Isla Santa Clara y áreas marinas cercanas",
    estado: "Especie protegida",
    descripcion:
      "Ave emblemática del Pacífico ecuatoriano observada durante recorridos autorizados.",
    imagen: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=700",
    isla: "Costa Rica",
    lat: -3.174,
    lng: -80.433,
  },
  {
    id: "ff-2",
    nombre: "Manglar rojo",
    nombre_especie: "Manglar rojo",
    tipo: "Flora",
    categoria: "flora",
    zona: "Canales de Puerto Jelí y esteros de Santa Rosa",
    estado: "Prioridad de conservación",
    descripcion:
      "Ecosistema clave para crustáceos, peces y aves migratorias en el archipiélago.",
    imagen:
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=700",
    isla: "San Gregorio",
    lat: -3.471,
    lng: -80.051,
  },
  {
    id: "ff-3",
    nombre: "Ballena jorobada",
    nombre_especie: "Ballena jorobada",
    tipo: "Fauna",
    categoria: "fauna",
    zona: "Ruta marítima hacia Isla Santa Clara",
    estado: "Avistamiento estacional (agosto-octubre)",
    descripcion:
      "Durante la temporada, diferentes operadoras autorizadas realizan salidas de observación.",
    imagen: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700",
    isla: "Costa Rica",
    lat: -3.23,
    lng: -80.31,
  },
];

export const demoCooperativas = [
  {
    id: "c-1",
    nombre: "Cooperativa Rutas Orenses",
    cooperativa: "Cooperativa Rutas Orenses",
    ruta: "Machala - Santa Rosa - Puerto Hualtaco",
    ruta_hacia_muelle: "Machala - Santa Rosa - Puerto Hualtaco",
    frecuencia: "Cada 30 minutos",
    contacto: "+593 7 295 1450",
    puntoSalida: "Terminal terrestre de Machala",
    puntoLlegada: "Muelle de Puerto Hualtaco",
    lat: -3.258,
    lng: -79.967,
  },
  {
    id: "c-2",
    nombre: "Cooperativa TACsa",
    cooperativa: "Cooperativa TACsa",
    ruta: "El Guabo - Santa Rosa - Puerto Jelí",
    ruta_hacia_muelle: "El Guabo - Santa Rosa - Puerto Jelí",
    frecuencia: "Cada 45 minutos",
    contacto: "+593 7 294 3311",
    puntoSalida: "Terminal de El Guabo",
    puntoLlegada: "Muelle de Puerto Jelí",
    lat: -3.468,
    lng: -80.052,
  },
  {
    id: "c-3",
    nombre: "Cooperativa Panamericana",
    cooperativa: "Cooperativa Panamericana",
    ruta: "Pasaje - Santa Rosa - Muelle turístico",
    ruta_hacia_muelle: "Pasaje - Santa Rosa - Muelle turístico",
    frecuencia: "Cada 60 minutos",
    contacto: "+593 7 296 8040",
    puntoSalida: "Terminal de Pasaje",
    puntoLlegada: "Muelle turístico de embarcación",
    lat: -3.458,
    lng: -80.048,
  },
];
