/**
 * Firestore Seed Script
 *
 * Ejecutar desde la carpeta functions/:
 *   cd functions
 *   node seed-firestore.cjs
 *
 * Puebla las colecciones de Firestore con datos de demostración, incluyendo
 * reseñas, encuestas de satisfacción, mensajes de contacto y solicitudes de
 * negocios (para que los paneles del admin muestren ejemplos reales).
 *
 * Credenciales: coloca el archivo "serviceAccountKey.json" en esta carpeta
 * (Consola Firebase -> Ajustes del proyecto -> Cuentas de servicio ->
 * Generar nueva clave privada). El Admin SDK ignora las reglas de seguridad.
 */

const admin = require("firebase-admin");

// Inicializa el Admin SDK con la clave de servicio si existe; de lo contrario
// recurre a las credenciales por defecto (GOOGLE_APPLICATION_CREDENTIALS / emulador).
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch {
  console.log(
    "No se encontró serviceAccountKey.json. Usando credenciales por defecto del entorno...",
  );
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

// ---------------------------------------------------------------------------
// Demo data (duplicated from src/data/demoData.js for Node.js compat)
// ---------------------------------------------------------------------------

const demoActividades = [
  {
    id: "act-1",
    nombre: "Paseo en lancha por los manglares",
    descripcion:
      "Recorrido guiado a través de los canales de manglar del Archipiélago de Jambelí.",
    isla: "Jambelí",
  },
  {
    id: "act-2",
    nombre: "Avistamiento de ballenas jorobadas",
    descripcion:
      "Excursión marítima desde Puerto Hualtaco hacia Isla Santa Clara (agosto–octubre).",
    isla: "Costa Rica",
  },
  {
    id: "act-3",
    nombre: "Kayak en Laguna La Tembladera",
    descripcion:
      "Aventura de kayak en el humedal natural, rodeado de biodiversidad.",
    isla: "San Gregorio",
  },
];

const demoGastronomia = [
  {
    id: "g-1",
    nombre_local: "Comedor La Perla del Mar",
    platos_tipicos: ["Ceviche mixto", "Parihuela", "Arroz marinero"],
    isla: "Jambelí",
  },
  {
    id: "g-2",
    nombre_local: "Restaurante Costa Rica Sabores",
    platos_tipicos: [
      "Arroz marinero",
      "Encocado de pescado",
      "Ceviche de concha",
    ],
    isla: "Costa Rica",
  },
  {
    id: "g-3",
    nombre_local: "Marisquería San Gregorio",
    platos_tipicos: ["Sudado de cangrejo", "Arroz con concha", "Sopa marinera"],
    isla: "San Gregorio",
  },
];

const demoHospedajes = [
  {
    id: "h-1",
    nombre: "Hostería Brisa Jambelí",
    servicios: ["Wifi", "Restaurante", "Piscina", "Kayak"],
    contacto: "+593 99 540 1200",
    isla: "Jambelí",
  },
  {
    id: "h-2",
    nombre: "Eco Lodge Costa Rica",
    servicios: ["Wifi", "Desayuno", "Tours", "Observación de aves"],
    contacto: "+593 98 120 7741",
    isla: "Costa Rica",
  },
  {
    id: "h-3",
    nombre: "Cabañas San Gregorio",
    servicios: ["Aire acondicionado", "Wifi", "Parqueo de lanchas"],
    contacto: "+593 99 330 6670",
    isla: "San Gregorio",
  },
];

const demoEventos = [
  {
    id: "ev-1",
    titulo: "Fiestas de Santa Rosa de Lima",
    tipo: "cultural",
    fecha: new Date("2026-08-23T18:00:00"),
    isla: "Jambelí",
  },
  {
    id: "ev-2",
    titulo: "Festival del Rey Langostino",
    tipo: "festivo",
    fecha: new Date("2026-08-25T13:00:00"),
    isla: "Jambelí",
  },
  {
    id: "ev-3",
    titulo: "Tour de Avistamiento de Ballenas",
    tipo: "deportivo",
    fecha: new Date("2026-08-01T06:30:00"),
    isla: "Costa Rica",
  },
];

const demoFloraFauna = [
  {
    id: "ff-1",
    nombre_especie: "Piqueros de patas azules",
    categoria: "fauna",
    descripcion:
      "Ave emblemática del Pacífico ecuatoriano observada durante recorridos autorizados.",
    isla: "Costa Rica",
  },
  {
    id: "ff-2",
    nombre_especie: "Manglar rojo",
    categoria: "flora",
    descripcion:
      "Ecosistema clave para crustáceos, peces y aves migratorias en el archipiélago.",
    isla: "San Gregorio",
  },
  {
    id: "ff-3",
    nombre_especie: "Ballena jorobada",
    categoria: "fauna",
    descripcion:
      "Observación estacional (agosto-octubre) en la ruta hacia Isla Santa Clara.",
    isla: "Costa Rica",
  },
];

const demoTransporte = [
  {
    id: "t-1",
    cooperativa: "Cooperativa Rutas Orenses",
    ruta_hacia_muelle: "Machala - Santa Rosa - Puerto Hualtaco",
    contacto: "+593 7 295 1450",
  },
  {
    id: "t-2",
    cooperativa: "Cooperativa TACsa",
    ruta_hacia_muelle: "El Guabo - Santa Rosa - Puerto Jelí",
    contacto: "+593 7 294 3311",
  },
];

const demoGaleria = [
  {
    id: "gal-1",
    url_archivo:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    tipo_archivo: "foto",
    seccion: "galeria_general",
    isla: "Jambelí",
  },
  {
    id: "gal-2",
    url_archivo:
      "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800",
    tipo_archivo: "foto",
    seccion: "banner_inicio",
    isla: "Costa Rica",
  },
];

// ---------------------------------------------------------------------------
// Reseñas turísticas (colección: resenas_turisticas)
// Mezcla de estados para demostrar la moderación: aprobada / pendiente / rechazada.
// ---------------------------------------------------------------------------

const demoResenas = [
  {
    id: "rev-demo-1",
    nombre: "María Fernanda Loayza",
    cedula: "0703456781",
    tipoObjetivo: "isla",
    objetivoId: "isla-jambeli",
    objetivoNombre: "Jambelí",
    isla: "Jambelí",
    calificacion: 5,
    opinion:
      "Las playas de Jambelí son hermosas y tranquilas. El paseo en lancha por los manglares fue lo mejor de mi visita.",
    estado: "aprobada",
    fecha: new Date("2026-05-12T16:20:00"),
  },
  {
    id: "rev-demo-2",
    nombre: "Jorge Patiño",
    cedula: "0701122334",
    tipoObjetivo: "establecimiento",
    objetivoId: "g-1",
    objetivoNombre: "Comedor La Perla del Mar",
    isla: "Jambelí",
    calificacion: 4,
    opinion:
      "El ceviche mixto estaba delicioso y la atención muy amable. Volvería sin dudarlo.",
    estado: "aprobada",
    fecha: new Date("2026-05-08T13:05:00"),
  },
  {
    id: "rev-demo-3",
    nombre: "Andrea Saldaña",
    cedula: "0702233445",
    tipoObjetivo: "atractivo",
    objetivoId: "act-2",
    objetivoNombre: "Avistamiento de ballenas jorobadas",
    isla: "Costa Rica",
    calificacion: 5,
    opinion:
      "Una experiencia inolvidable ver a las ballenas tan de cerca. El guía conocía muchísimo del ecosistema marino.",
    estado: "pendiente",
    fecha: new Date("2026-05-20T09:40:00"),
  },
  {
    id: "rev-demo-4",
    nombre: "Visitante de prueba",
    cedula: "0700000001",
    tipoObjetivo: "isla",
    objetivoId: "isla-santa-clara",
    objetivoNombre: "Isla Santa Clara",
    isla: "Santa Clara",
    calificacion: 1,
    opinion:
      "Reseña de ejemplo rechazada durante la moderación por no cumplir las normas de publicación.",
    estado: "rechazada",
    fecha: new Date("2026-05-02T11:00:00"),
  },
];

// ---------------------------------------------------------------------------
// Encuestas de satisfacción (colección: encuestas_satisfaccion)
// ---------------------------------------------------------------------------

const demoEncuestas = [
  {
    id: "enc-demo-1",
    puntuacion: 5,
    comentarios:
      "Excelente sitio web, encontré toda la información que necesitaba para planear mi viaje.",
    fecha: new Date("2026-05-21T10:15:00"),
  },
  {
    id: "enc-demo-2",
    puntuacion: 4,
    comentarios: "Muy útil, aunque me gustaría ver más fotos de los hospedajes.",
    fecha: new Date("2026-05-18T18:42:00"),
  },
  {
    id: "enc-demo-3",
    puntuacion: 5,
    comentarios: "",
    fecha: new Date("2026-05-15T08:30:00"),
  },
  {
    id: "enc-demo-4",
    puntuacion: 3,
    comentarios: "La sección de transporte podría tener horarios más detallados.",
    fecha: new Date("2026-05-11T14:05:00"),
  },
  {
    id: "enc-demo-5",
    puntuacion: 5,
    comentarios: "Me encantó el mapa interactivo del archipiélago.",
    fecha: new Date("2026-05-05T20:10:00"),
  },
];

// ---------------------------------------------------------------------------
// Mensajes de contacto (colección: mensajes_contacto)
// ---------------------------------------------------------------------------

const demoMensajes = [
  {
    id: "msg-demo-1",
    remitente: "Carlos Andrade",
    correo: "carlos.andrade@example.com",
    consulta_sugerencia:
      "Buenas tardes, ¿cuál es el horario de salida de las lanchas hacia Jambelí los fines de semana?",
    fecha: new Date("2026-05-22T09:12:00"),
  },
  {
    id: "msg-demo-2",
    remitente: "Lucía Méndez",
    correo: "lucia.mendez@example.com",
    consulta_sugerencia:
      "Quisiera saber si hay hospedajes que admitan mascotas en la isla. ¡Gracias!",
    fecha: new Date("2026-05-19T17:33:00"),
  },
  {
    id: "msg-demo-3",
    remitente: "Agencia Sol Tours",
    correo: "reservas@soltours.example.com",
    consulta_sugerencia:
      "Somos una agencia y nos interesa coordinar tours grupales. ¿Con quién podemos hablar?",
    fecha: new Date("2026-05-16T11:48:00"),
  },
];

// ---------------------------------------------------------------------------
// Solicitudes de negocios (colección: solicitudes_negocios)
// La "categoria" debe ser un nodo de contenido válido para poder aprobarse.
// ---------------------------------------------------------------------------

const demoSolicitudes = [
  {
    id: "sol-demo-1",
    categoria: "gastronomia",
    nombre: "Cevichería El Manglar",
    isla: "Jambelí",
    descripcion: "Mariscos frescos del día con vista al mar.",
    platoTipico: "Ceviche de camarón",
    ubicacion: "Malecón de Jambelí",
    contacto: "+593 99 888 1212",
  },
  {
    id: "sol-demo-2",
    categoria: "hospedajes",
    nombre: "Hostal Brisa Marina",
    isla: "Costa Rica",
    ubicacion: "Frente a la playa principal",
    servicios: "Wifi, Desayuno, Aire acondicionado",
    contacto: "+593 98 444 7788",
  },
  {
    id: "sol-demo-3",
    categoria: "actividades",
    nombre: "Tour fotográfico de aves",
    isla: "San Gregorio",
    descripcion:
      "Recorrido guiado para fotografiar aves migratorias en el humedal La Tembladera.",
    contacto: "+593 96 222 3344",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prepareDoc(item) {
  const out = { ...item };
  delete out.id;

  if (out.fecha && out.fecha instanceof Date) {
    out.fecha = admin.firestore.Timestamp.fromDate(out.fecha);
  }

  out.createdAt = FieldValue.serverTimestamp();
  out.updatedAt = FieldValue.serverTimestamp();

  return out;
}

async function seedCollection(collectionName, items) {
  console.log(`  Seeding ${collectionName} (${items.length} docs)...`);

  for (const item of items) {
    const docData = prepareDoc(item);
    await db.collection(collectionName).doc(item.id).set(docData);
  }

  console.log(`  ✔ ${collectionName} done.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting Firestore seed...\n");

  await seedCollection("actividades", demoActividades);
  await seedCollection("gastronomia", demoGastronomia);
  await seedCollection("hospedajes", demoHospedajes);
  await seedCollection("eventos", demoEventos);
  await seedCollection("flora_fauna", demoFloraFauna);
  await seedCollection("transporte", demoTransporte);
  await seedCollection("galeria", demoGaleria);

  // Interacción de visitantes (paneles de moderación del admin)
  await seedCollection("resenas_turisticas", demoResenas);
  await seedCollection("encuestas_satisfaccion", demoEncuestas);
  await seedCollection("mensajes_contacto", demoMensajes);
  await seedCollection("solicitudes_negocios", demoSolicitudes);

  // Metricas del sitio – documento único
  console.log("  Seeding metricas_sitio...");
  await db.collection("metricas_sitio").doc("estadisticas_generales").set({
    total_visitas: 0,
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("  ✔ metricas_sitio done.");

  console.log("\n🎉 All collections seeded successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
