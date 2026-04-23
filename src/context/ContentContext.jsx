import { useCallback, useEffect, useMemo, useState } from "react";
// Realtime Database – lectura pública (0 lecturas Firestore)
import {
  ref,
  onValue,
  set,
  push,
  remove,
  serverTimestamp as rtdbTimestamp,
} from "firebase/database";
// Firestore – solo para colecciones administrativas
import {
  collection as fsCollection,
  addDoc,
  serverTimestamp as fsTimestamp,
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
import { db, rtdb } from "../services/firebase";

// ---------------------------------------------------------------------------
// Nodos en Realtime Database (contenido público)
// Estructura: /content/{nodo}/{id}
// ---------------------------------------------------------------------------
const RTDB_NODES = [
  "actividades",
  "gastronomia",
  "hospedajes",
  "eventos",
  "floraFauna",
  "galeria",
  "destinos",
  "blog",
  "heroSlides",
  "cooperativas",
];

// ---------------------------------------------------------------------------
// Demo / seed data por nodo
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
      order: 0,
    },
    {
      id: "hero-2",
      bg: "/hero2.png",
      tag: "Gastronomía del Mar",
      title: "Sabores que no Olvidarás",
      sub: "Puerto Jelí y sus mariscos frescos, cebiches y la auténtica parihuela orense.",
      cta: "Ver Blog",
      ctaTo: "/blog",
      order: 1,
    },
    {
      id: "hero-3",
      bg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600",
      tag: "Agosto – Octubre",
      title: "Avistamiento de Ballenas",
      sub: "Isla Santa Clara: el santuario marino donde la naturaleza deslumbra cada año.",
      cta: "Ver Eventos",
      ctaTo: "/eventos",
      order: 2,
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

/** Convierte un snapshot de RTDB (objeto) a array con `id`. */
function rtdbSnapshotToArray(snapshot) {
  const val = snapshot.val();
  if (!val || typeof val !== "object") return [];

  return Object.entries(val).map(([id, data]) => ({
    ...data,
    id,
  }));
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
  // Real-time listeners desde RTDB (NO consume lecturas de Firestore)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribes = [];
    let loadedCount = 0;
    const totalNodes = RTDB_NODES.length;

    for (const nodeKey of RTDB_NODES) {
      const setter = setters[nodeKey];
      if (!setter) continue;

      const nodeRef = ref(rtdb, `content/${nodeKey}`);

      const unsub = onValue(
        nodeRef,
        (snapshot) => {
          let items = rtdbSnapshotToArray(snapshot);

          // Si no hay datos en RTDB, usar seed data
          if (items.length === 0) {
            const seed = SEED_DATA[nodeKey];
            if (seed) {
              items = seed;
            }
          }

          // Normalizar destinos
          if (nodeKey === "destinos") {
            items.forEach((item) => {
              item.icono = normalizeDestinoIcon(item.icono);
            });
          }

          // Normalizar hero slides
          if (nodeKey === "heroSlides") {
            items.forEach((item) => {
              item.tag = cleanHeroTag(item.tag);
            });
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }

          setter(items);
          loadedCount++;

          if (loadedCount >= totalNodes) {
            setLoading(false);
          }
        },
        (error) => {
          console.warn(`RTDB listener error for content/${nodeKey}:`, error);
          const seed = SEED_DATA[nodeKey];
          if (seed) setter(seed);
          loadedCount++;
          if (loadedCount >= totalNodes) setLoading(false);
        },
      );

      // onValue returns an unsubscribe function
      unsubscribes.push(() => unsub());
    }

    return () => {
      for (const unsub of unsubscribes) unsub();
    };
  }, [setters]);

  // -----------------------------------------------------------------------
  // CRUD helpers – escriben a Realtime Database
  // -----------------------------------------------------------------------

  /** Upsert: crea o actualiza en RTDB → /content/{nodeKey}/{id} */
  const upsertToRTDB = useCallback(async (nodeKey, item) => {
    const itemData = { ...item };
    const id = itemData.id || push(ref(rtdb, `content/${nodeKey}`)).key;
    delete itemData.id;
    itemData.updatedAt = rtdbTimestamp();

    await set(ref(rtdb, `content/${nodeKey}/${id}`), itemData);
  }, []);

  /** Delete: elimina de RTDB → /content/{nodeKey}/{id} */
  const deleteFromRTDB = useCallback(async (nodeKey, id) => {
    if (!id) return;
    await remove(ref(rtdb, `content/${nodeKey}/${id}`));
  }, []);

  // -----------------------------------------------------------------------
  // Public API – CRUD por colección (misma interfaz que antes)
  // -----------------------------------------------------------------------

  // Actividades
  const upsertActividad = useCallback(
    (item) => upsertToRTDB("actividades", item),
    [upsertToRTDB],
  );
  const deleteActividad = useCallback(
    (id) => deleteFromRTDB("actividades", id),
    [deleteFromRTDB],
  );

  // Gastronomía
  const upsertGastronomia = useCallback(
    (item) => upsertToRTDB("gastronomia", item),
    [upsertToRTDB],
  );
  const deleteGastronomia = useCallback(
    (id) => deleteFromRTDB("gastronomia", id),
    [deleteFromRTDB],
  );

  // Hospedajes
  const upsertHospedaje = useCallback(
    (item) => upsertToRTDB("hospedajes", item),
    [upsertToRTDB],
  );
  const deleteHospedaje = useCallback(
    (id) => deleteFromRTDB("hospedajes", id),
    [deleteFromRTDB],
  );

  // Eventos
  const upsertEvento = useCallback(
    (item) => upsertToRTDB("eventos", item),
    [upsertToRTDB],
  );
  const deleteEvento = useCallback(
    (id) => deleteFromRTDB("eventos", id),
    [deleteFromRTDB],
  );

  // Flora y Fauna
  const upsertFloraFauna = useCallback(
    (item) => upsertToRTDB("floraFauna", item),
    [upsertToRTDB],
  );
  const deleteFloraFauna = useCallback(
    (id) => deleteFromRTDB("floraFauna", id),
    [deleteFromRTDB],
  );

  // Galería
  const upsertGaleria = useCallback(
    (item) => upsertToRTDB("galeria", item),
    [upsertToRTDB],
  );
  const deleteGaleria = useCallback(
    (id) => deleteFromRTDB("galeria", id),
    [deleteFromRTDB],
  );

  // Destinos
  const upsertDestino = useCallback(
    (item) => upsertToRTDB("destinos", item),
    [upsertToRTDB],
  );
  const deleteDestino = useCallback(
    (id) => deleteFromRTDB("destinos", id),
    [deleteFromRTDB],
  );

  // Blog
  const upsertBlog = useCallback(
    (item) => upsertToRTDB("blog", item),
    [upsertToRTDB],
  );
  const deleteBlog = useCallback(
    (id) => deleteFromRTDB("blog", id),
    [deleteFromRTDB],
  );

  // Hero Slides
  const upsertHeroSlide = useCallback(
    (item) => upsertToRTDB("heroSlides", item),
    [upsertToRTDB],
  );
  const deleteHeroSlide = useCallback(
    (id) => deleteFromRTDB("heroSlides", id),
    [deleteFromRTDB],
  );
  const setHeroSlides = useCallback(
    async (nextSlides) => {
      const slides =
        typeof nextSlides === "function" ? nextSlides(heroSlides) : nextSlides;
      for (let i = 0; i < slides.length; i++) {
        await upsertToRTDB("heroSlides", { ...slides[i], order: i });
      }
    },
    [heroSlides, upsertToRTDB],
  );
  const moveHeroSlide = useCallback(
    async (id, direction) => {
      const currentIndex = heroSlides.findIndex((s) => s.id === id);
      const targetIndex = currentIndex + direction;
      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= heroSlides.length
      )
        return;

      const reordered = [...heroSlides];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      for (let i = 0; i < reordered.length; i++) {
        await upsertToRTDB("heroSlides", { ...reordered[i], order: i });
      }
    },
    [heroSlides, upsertToRTDB],
  );

  // Cooperativas / Transporte
  const upsertCooperativa = useCallback(
    (item) => upsertToRTDB("cooperativas", item),
    [upsertToRTDB],
  );
  const deleteCooperativa = useCallback(
    (id) => deleteFromRTDB("cooperativas", id),
    [deleteFromRTDB],
  );

  // -----------------------------------------------------------------------
  // Mensajes de contacto y Encuestas → siguen en Firestore
  // (necesitan reglas de seguridad + serverTimestamp de Firestore)
  // -----------------------------------------------------------------------
  const enviarMensajeContacto = useCallback(async (mensaje) => {
    await addDoc(fsCollection(db, "mensajes_contacto"), {
      remitente: mensaje.remitente || "",
      correo: mensaje.correo || "",
      consulta_sugerencia: mensaje.consulta_sugerencia || "",
      fecha: fsTimestamp(),
    });
  }, []);

  const enviarEncuesta = useCallback(async (encuesta) => {
    await addDoc(fsCollection(db, "encuestas_satisfaccion"), {
      puntuacion: Number(encuesta.puntuacion) || 0,
      comentarios: encuesta.comentarios || "",
      fecha: fsTimestamp(),
    });
  }, []);

  // -----------------------------------------------------------------------
  // Reset content – seed RTDB con datos demo
  // -----------------------------------------------------------------------
  const resetContent = useCallback(async () => {
    for (const [nodeKey, seedItems] of Object.entries(SEED_DATA)) {
      if (!seedItems) continue;

      // Limpiar nodo completo y reescribir
      const nodeData = {};
      for (const item of seedItems) {
        const id = item.id || push(ref(rtdb, `content/${nodeKey}`)).key;
        const data = { ...item };
        delete data.id;
        data.updatedAt = Date.now();
        data.createdAt = Date.now();
        nodeData[id] = data;
      }

      await set(ref(rtdb, `content/${nodeKey}`), nodeData);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(
    () => ({
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
