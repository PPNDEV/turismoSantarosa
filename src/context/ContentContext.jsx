import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";
import {
  demoBlog,
  demoCooperativas,
  demoDestinos,
  demoEventos,
  demoFloraFauna,
  demoGastronomia,
  demoGaleria,
  demoHospedajes,
  demoActividades,
} from "../data/demoData";
import { ContentContext } from "./content-context";
import { normalizeDestinoIcon } from "../utils/destinoIcons";
import { db } from "../services/firebase";

// ---------------------------------------------------------------------------
// Collection names – mapped to Firestore top‑level collections
// ---------------------------------------------------------------------------
const COLLECTIONS = {
  actividades: "actividades",
  gastronomia: "gastronomia",
  hospedajes: "hospedajes",
  eventos: "eventos",
  floraFauna: "flora_fauna",
  transporte: "transporte",
  galeria: "galeria",
  destinos: "destinos",
  blog: "blog",
  heroSlides: "heroSlides",
  cooperativas: "cooperativas",
  mensajesContacto: "mensajes_contacto",
  encuestasSatisfaccion: "encuestas_satisfaccion",
};

// ---------------------------------------------------------------------------
// Demo / seed data per collection
// ---------------------------------------------------------------------------
const SEED_DATA = {
  actividades: demoActividades,
  gastronomia: demoGastronomia,
  hospedajes: demoHospedajes,
  eventos: demoEventos,
  floraFauna: demoFloraFauna,
  galeria: demoGaleria,
  destinos: demoDestinos,
  blog: demoBlog,
  heroSlides: [
    {
      id: "hero-1",
      bg: "/hero1.png",
      tag: "Archipiélago de Jambelí",
      title: "Paraíso Natural del Pacífico",
      sub: "Playas vírgenes, manglares y fauna única te esperan en el sur de Ecuador.",
      cta: "Explorar Destinos",
      ctaTo: "/destinos",
    },
    {
      id: "hero-2",
      bg: "/hero2.png",
      tag: "Gastronomía del Mar",
      title: "Sabores que no Olvidarás",
      sub: "Puerto Jelí y sus mariscos frescos, cebiches y la auténtica parihuela orense.",
      cta: "Ver Blog",
      ctaTo: "/blog",
    },
    {
      id: "hero-3",
      bg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600",
      tag: "Agosto – Octubre",
      title: "Avistamiento de Ballenas",
      sub: "Isla Santa Clara: el santuario marino donde la naturaleza deslumbra cada año.",
      cta: "Ver Eventos",
      ctaTo: "/eventos",
    },
  ],
  cooperativas: demoCooperativas,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanHeroTag(tag) {
  return String(tag || "")
    .replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "")
    .trim();
}

/** Convert a Firestore doc snapshot to a plain object with `id`. */
function docToObject(docSnap) {
  const data = docSnap.data();
  const obj = { id: docSnap.id };

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof GeoPoint) {
      obj.lat = value.latitude;
      obj.lng = value.longitude;
    } else if (key === "platos_tipicos" || key === "servicios") {
      // Arrays from Firestore come through fine
      obj[key] = Array.isArray(value) ? value : [];
    } else if (value && typeof value === "object" && value.toDate) {
      // Convert Firestore Timestamps to ISO strings for display
      obj[key] = value.toDate().toISOString();
    } else {
      obj[key] = value;
    }
  }

  return obj;
}

/** Prepare an object for Firestore write – converts lat/lng to GeoPoint. */
function objectToDoc(item) {
  const out = { ...item };
  delete out.id; // Firestore uses the doc ID

  // Convert lat/lng to GeoPoint if both are present
  const lat = Number(out.lat);
  const lng = Number(out.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    out.coordenadas = new GeoPoint(lat, lng);
  }

  delete out.lat;
  delete out.lng;

  out.updatedAt = serverTimestamp();

  return out;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ContentProvider({ children }) {
  const [actividades, setActividades] = useState([]);
  const [gastronomia, setGastronomia] = useState([]);
  const [hospedajes, setHospedajes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [floraFauna, setFloraFauna] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [blog, setBlog] = useState([]);
  const [heroSlides, setHeroSlidesState] = useState([]);
  const [cooperativas, setCooperativas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map of stateKey → setter for dynamic dispatch
  const setters = useMemo(
    () => ({
      actividades: setActividades,
      gastronomia: setGastronomia,
      hospedajes: setHospedajes,
      eventos: setEventos,
      floraFauna: setFloraFauna,
      galeria: setGaleria,
      destinos: setDestinos,
      blog: setBlog,
      heroSlides: setHeroSlidesState,
      cooperativas: setCooperativas,
    }),
    [],
  );

  // -----------------------------------------------------------------------
  // Real-time listeners for each collection
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribes = [];
    let loadedCount = 0;
    const totalCollections = Object.keys(setters).length;

    for (const [stateKey, setter] of Object.entries(setters)) {
      const collectionName = COLLECTIONS[stateKey];
      if (!collectionName) continue;

      const colRef = collection(db, collectionName);

      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const items = snapshot.docs.map(docToObject);

          // Normalize destinos icons
          if (stateKey === "destinos") {
            items.forEach((item) => {
              item.icono = normalizeDestinoIcon(item.icono);
            });
          }

          // Normalize hero slide tags
          if (stateKey === "heroSlides") {
            items.forEach((item) => {
              item.tag = cleanHeroTag(item.tag);
            });
            // Sort by order field if present
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }

          setter(items);
          loadedCount++;

          if (loadedCount >= totalCollections) {
            setLoading(false);
          }
        },
        (error) => {
          console.warn(
            `Firestore listener error for ${collectionName}:`,
            error,
          );
          // Fall back to seed data if Firestore is unavailable
          const seed = SEED_DATA[stateKey];
          if (seed) {
            setter(seed);
          }
          loadedCount++;

          if (loadedCount >= totalCollections) {
            setLoading(false);
          }
        },
      );

      unsubscribes.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
    };
  }, [setters]);

  // -----------------------------------------------------------------------
  // CRUD helpers
  // -----------------------------------------------------------------------

  /** Upsert a document into a Firestore collection. */
  const upsertToCollection = useCallback(async (stateKey, item) => {
    const collectionName = COLLECTIONS[stateKey];
    if (!collectionName) return;

    const docData = objectToDoc(item);

    if (item.id) {
      // Update existing
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, docData, { merge: true });
    } else {
      // Create new
      docData.createdAt = serverTimestamp();
      await addDoc(collection(db, collectionName), docData);
    }
  }, []);

  /** Delete a document from a Firestore collection. */
  const deleteFromCollection = useCallback(async (stateKey, id) => {
    const collectionName = COLLECTIONS[stateKey];
    if (!collectionName || !id) return;

    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }, []);

  // -----------------------------------------------------------------------
  // Public API – same interface as before so admin panels work unchanged
  // -----------------------------------------------------------------------

  // Actividades
  const upsertActividad = useCallback(
    (item) => upsertToCollection("actividades", item),
    [upsertToCollection],
  );
  const deleteActividad = useCallback(
    (id) => deleteFromCollection("actividades", id),
    [deleteFromCollection],
  );

  // Gastronomía
  const upsertGastronomia = useCallback(
    (item) => upsertToCollection("gastronomia", item),
    [upsertToCollection],
  );
  const deleteGastronomia = useCallback(
    (id) => deleteFromCollection("gastronomia", id),
    [deleteFromCollection],
  );

  // Hospedajes
  const upsertHospedaje = useCallback(
    (item) => upsertToCollection("hospedajes", item),
    [upsertToCollection],
  );
  const deleteHospedaje = useCallback(
    (id) => deleteFromCollection("hospedajes", id),
    [deleteFromCollection],
  );

  // Eventos
  const upsertEvento = useCallback(
    (item) => upsertToCollection("eventos", item),
    [upsertToCollection],
  );
  const deleteEvento = useCallback(
    (id) => deleteFromCollection("eventos", id),
    [deleteFromCollection],
  );

  // Flora y Fauna
  const upsertFloraFauna = useCallback(
    (item) => upsertToCollection("floraFauna", item),
    [upsertToCollection],
  );
  const deleteFloraFauna = useCallback(
    (id) => deleteFromCollection("floraFauna", id),
    [deleteFromCollection],
  );

  // Galería
  const upsertGaleria = useCallback(
    (item) => upsertToCollection("galeria", item),
    [upsertToCollection],
  );
  const deleteGaleria = useCallback(
    (id) => deleteFromCollection("galeria", id),
    [deleteFromCollection],
  );

  // Destinos
  const upsertDestino = useCallback(
    (item) => upsertToCollection("destinos", item),
    [upsertToCollection],
  );
  const deleteDestino = useCallback(
    (id) => deleteFromCollection("destinos", id),
    [deleteFromCollection],
  );

  // Blog
  const upsertBlog = useCallback(
    (item) => upsertToCollection("blog", item),
    [upsertToCollection],
  );
  const deleteBlog = useCallback(
    (id) => deleteFromCollection("blog", id),
    [deleteFromCollection],
  );

  // Hero Slides
  const upsertHeroSlide = useCallback(
    (item) => upsertToCollection("heroSlides", item),
    [upsertToCollection],
  );
  const deleteHeroSlide = useCallback(
    (id) => deleteFromCollection("heroSlides", id),
    [deleteFromCollection],
  );
  const setHeroSlides = useCallback(
    async (nextSlides) => {
      const slides =
        typeof nextSlides === "function"
          ? nextSlides(heroSlides)
          : nextSlides;
      // Write each slide as a separate doc with order
      for (let i = 0; i < slides.length; i++) {
        await upsertToCollection("heroSlides", {
          ...slides[i],
          order: i,
        });
      }
    },
    [heroSlides, upsertToCollection],
  );
  const moveHeroSlide = useCallback(
    async (id, direction) => {
      const currentIndex = heroSlides.findIndex((s) => s.id === id);
      const targetIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= heroSlides.length
      ) {
        return;
      }

      const reordered = [...heroSlides];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      for (let i = 0; i < reordered.length; i++) {
        await upsertToCollection("heroSlides", {
          ...reordered[i],
          order: i,
        });
      }
    },
    [heroSlides, upsertToCollection],
  );

  // Cooperativas / Transporte
  const upsertCooperativa = useCallback(
    (item) => upsertToCollection("cooperativas", item),
    [upsertToCollection],
  );
  const deleteCooperativa = useCallback(
    (id) => deleteFromCollection("cooperativas", id),
    [deleteFromCollection],
  );

  // -----------------------------------------------------------------------
  // Mensajes de contacto (RF11) – write-only for visitors
  // -----------------------------------------------------------------------
  const enviarMensajeContacto = useCallback(async (mensaje) => {
    await addDoc(collection(db, COLLECTIONS.mensajesContacto), {
      remitente: mensaje.remitente || "",
      correo: mensaje.correo || "",
      consulta_sugerencia: mensaje.consulta_sugerencia || "",
      fecha: serverTimestamp(),
    });
  }, []);

  // -----------------------------------------------------------------------
  // Encuesta de satisfacción (RF15) – write-only for visitors
  // -----------------------------------------------------------------------
  const enviarEncuesta = useCallback(async (encuesta) => {
    await addDoc(collection(db, COLLECTIONS.encuestasSatisfaccion), {
      puntuacion: Number(encuesta.puntuacion) || 0,
      comentarios: encuesta.comentarios || "",
      fecha: serverTimestamp(),
    });
  }, []);

  // -----------------------------------------------------------------------
  // Reset content – seed all collections with demo data
  // -----------------------------------------------------------------------
  const resetContent = useCallback(async () => {
    for (const [stateKey, seedItems] of Object.entries(SEED_DATA)) {
      const collectionName = COLLECTIONS[stateKey];
      if (!collectionName || !seedItems) continue;

      for (const item of seedItems) {
        const docData = objectToDoc(item);
        docData.createdAt = serverTimestamp();

        if (item.id) {
          await setDoc(doc(db, collectionName, item.id), docData);
        } else {
          await addDoc(collection(db, collectionName), docData);
        }
      }
    }
  }, []);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(
    () => ({
      // Data arrays
      actividades,
      gastronomia,
      hospedajes,
      eventos,
      floraFauna,
      galeria,
      destinos,
      blog,
      heroSlides,
      cooperativas,
      loading,

      // CRUD – actividades
      upsertActividad,
      deleteActividad,

      // CRUD – gastronomía
      upsertGastronomia,
      deleteGastronomia,

      // CRUD – hospedajes
      upsertHospedaje,
      deleteHospedaje,

      // CRUD – eventos
      upsertEvento,
      deleteEvento,

      // CRUD – flora/fauna
      upsertFloraFauna,
      deleteFloraFauna,

      // CRUD – galería
      upsertGaleria,
      deleteGaleria,

      // CRUD – destinos
      upsertDestino,
      deleteDestino,

      // CRUD – blog
      upsertBlog,
      deleteBlog,

      // CRUD – hero slides
      upsertHeroSlide,
      deleteHeroSlide,
      setHeroSlides,
      moveHeroSlide,

      // CRUD – cooperativas
      upsertCooperativa,
      deleteCooperativa,

      // Visitante
      enviarMensajeContacto,
      enviarEncuesta,

      // Admin
      resetContent,
    }),
    [
      actividades,
      gastronomia,
      hospedajes,
      eventos,
      floraFauna,
      galeria,
      destinos,
      blog,
      heroSlides,
      cooperativas,
      loading,
      upsertActividad,
      deleteActividad,
      upsertGastronomia,
      deleteGastronomia,
      upsertHospedaje,
      deleteHospedaje,
      upsertEvento,
      deleteEvento,
      upsertFloraFauna,
      deleteFloraFauna,
      upsertGaleria,
      deleteGaleria,
      upsertDestino,
      deleteDestino,
      upsertBlog,
      deleteBlog,
      upsertHeroSlide,
      deleteHeroSlide,
      setHeroSlides,
      moveHeroSlide,
      upsertCooperativa,
      deleteCooperativa,
      enviarMensajeContacto,
      enviarEncuesta,
      resetContent,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}
