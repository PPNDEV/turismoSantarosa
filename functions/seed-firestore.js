/**
 * Firestore Seed Script
 *
 * Run from the project root:
 *   node functions/seed-firestore.js
 *
 * This populates all Firestore collections with the demo data.
 * Requires the Firebase Admin SDK (already in functions/node_modules).
 */

const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const { GeoPoint, FieldValue } = admin.firestore;

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
    lat: -3.312,
    lng: -80.083,
  },
  {
    id: "act-2",
    nombre: "Avistamiento de ballenas jorobadas",
    descripcion:
      "Excursión marítima desde Puerto Hualtaco hacia Isla Santa Clara (agosto–octubre).",
    isla: "Costa Rica",
    lat: -3.173,
    lng: -80.435,
  },
  {
    id: "act-3",
    nombre: "Kayak en Laguna La Tembladera",
    descripcion:
      "Aventura de kayak en el humedal natural, rodeado de biodiversidad.",
    isla: "San Gregorio",
    lat: -3.595,
    lng: -79.971,
  },
];

const demoGastronomia = [
  {
    id: "g-1",
    nombre_local: "Comedor La Perla del Mar",
    platos_tipicos: ["Ceviche mixto", "Parihuela", "Arroz marinero"],
    isla: "Jambelí",
    lat: -3.311,
    lng: -80.084,
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
    lat: -3.256,
    lng: -80.118,
  },
  {
    id: "g-3",
    nombre_local: "Marisquería San Gregorio",
    platos_tipicos: ["Sudado de cangrejo", "Arroz con concha", "Sopa marinera"],
    isla: "San Gregorio",
    lat: -3.355,
    lng: -80.109,
  },
];

const demoHospedajes = [
  {
    id: "h-1",
    nombre: "Hostería Brisa Jambelí",
    servicios: ["Wifi", "Restaurante", "Piscina", "Kayak"],
    contacto: "+593 99 540 1200",
    isla: "Jambelí",
    lat: -3.313,
    lng: -80.085,
  },
  {
    id: "h-2",
    nombre: "Eco Lodge Costa Rica",
    servicios: ["Wifi", "Desayuno", "Tours", "Observación de aves"],
    contacto: "+593 98 120 7741",
    isla: "Costa Rica",
    lat: -3.254,
    lng: -80.116,
  },
  {
    id: "h-3",
    nombre: "Cabañas San Gregorio",
    servicios: ["Aire acondicionado", "Wifi", "Parqueo de lanchas"],
    contacto: "+593 99 330 6670",
    isla: "San Gregorio",
    lat: -3.356,
    lng: -80.108,
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
// Helpers
// ---------------------------------------------------------------------------

function prepareDoc(item) {
  const out = { ...item };
  delete out.id;

  if (Number.isFinite(out.lat) && Number.isFinite(out.lng)) {
    out.coordenadas = new GeoPoint(out.lat, out.lng);
  }

  delete out.lat;
  delete out.lng;

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
