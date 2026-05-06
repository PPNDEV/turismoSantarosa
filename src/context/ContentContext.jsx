import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
// Realtime Database – lectura pública (0 lecturas Firestore)
import { ref, onValue } from "firebase/database";
import { httpsCallable } from "firebase/functions";
// Firestore – solo para colecciones administrativas
import { ContentContext } from "./content-context";
import { normalizeDestinoIcon } from "../utils/destinoIcons";
import { rtdb, functions } from "../services/firebase";

const CONTACT_API_URL =
  import.meta.env.VITE_CONTACT_API_URL || "/api/contact";
const SURVEY_API_URL =
  import.meta.env.VITE_SURVEY_API_URL || "/api/survey";

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "request-failed";
    try {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      }
    } catch {
      // Ignore parse errors and keep default message.
    }
    throw new Error(errorMessage);
  }
}

// ---------------------------------------------------------------------------
// Nodos en Realtime Database (contenido público)
// Estructura: /content/{nodo}/{id}
// ---------------------------------------------------------------------------
const RTDB_NODES = [
  "actividades",
  "actividadesEditorial",
  "gastronomia",
  "hospedajes",
  "eventos",
  "floraFauna",
  "galeria",
  "destinos",
  "blog",
  "heroSlides",
  "comoLlegarIntro",
  "comoLlegar",
  "cooperativas",
];

const RTDB_NODE_SET = new Set(RTDB_NODES);

const ROUTE_NODES = {
  "/": [
    "heroSlides",
    "actividades",
    "actividadesEditorial",
    "destinos",
    "eventos",
    "galeria",
    "blog",
    "comoLlegarIntro",
    "comoLlegar",
  ],
  "/actividades": ["actividades", "actividadesEditorial"],
  "/destinos": ["destinos"],
  "/eventos": ["eventos"],
  "/hospedaje": ["hospedajes"],
  "/gastronomia": ["gastronomia"],
  "/transporte": ["cooperativas"],
  "/flora-fauna": ["floraFauna"],
  "/informacion": [
    "destinos",
    "gastronomia",
    "hospedajes",
    "floraFauna",
    "cooperativas",
  ],
  "/galeria": ["galeria"],
  "/blog": ["blog"],
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

function getRequiredNodes(pathname) {
  if (String(pathname || "").startsWith("/admin")) {
    return RTDB_NODES;
  }

  return ROUTE_NODES[pathname] || ROUTE_NODES["/"];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ContentProvider({ children }) {
  const location = useLocation();
  const [actividades, setActividades] = useState([]);
  const [actividadesEditorial, setActividadesEditorial] = useState([]);
  const [gastronomia, setGastronomia] = useState([]);
  const [hospedajes, setHospedajes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [floraFauna, setFloraFauna] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [blog, setBlog] = useState([]);
  const [heroSlides, setHeroSlidesState] = useState([]);
  const [comoLlegarIntro, setComoLlegarIntro] = useState([]);
  const [comoLlegar, setComoLlegar] = useState([]);
  const [cooperativas, setCooperativas] = useState([]);
  const [loadedNodes, setLoadedNodes] = useState(() => new Set());
  const requiredNodes = useMemo(
    () => getRequiredNodes(location.pathname),
    [location.pathname],
  );
  const requiredNodesKey = requiredNodes.join("|");
  const loading = useMemo(
    () => requiredNodes.some((nodeKey) => !loadedNodes.has(nodeKey)),
    [loadedNodes, requiredNodes],
  );

  const setters = useMemo(
    () => ({
      actividades: setActividades,
      actividadesEditorial: setActividadesEditorial,
      gastronomia: setGastronomia,
      hospedajes: setHospedajes,
      eventos: setEventos,
      floraFauna: setFloraFauna,
      galeria: setGaleria,
      destinos: setDestinos,
      blog: setBlog,
      heroSlides: setHeroSlidesState,
      comoLlegarIntro: setComoLlegarIntro,
      comoLlegar: setComoLlegar,
      cooperativas: setCooperativas,
    }),
    [],
  );

  // -----------------------------------------------------------------------
  // Real-time listeners desde RTDB por ruta (NO consume lecturas de Firestore)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribes = [];

    for (const nodeKey of requiredNodes) {
      const setter = setters[nodeKey];
      if (!setter) continue;

      const nodeRef = ref(rtdb, `content/${nodeKey}`);

      const unsub = onValue(
        nodeRef,
        (snapshot) => {
          const items = rtdbSnapshotToArray(snapshot);

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

          if (nodeKey === "comoLlegar") {
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }

          setter(items);
          setLoadedNodes((previous) => new Set(previous).add(nodeKey));
        },
        (error) => {
          console.warn(`RTDB listener error for content/${nodeKey}:`, error);
          setter([]);
          setLoadedNodes((previous) => new Set(previous).add(nodeKey));
        },
      );

      // onValue returns an unsubscribe function
      unsubscribes.push(() => unsub());
    }

    return () => {
      for (const unsub of unsubscribes) unsub();
    };
  }, [requiredNodes, requiredNodesKey, setters]);

  // -----------------------------------------------------------------------
  // CRUD helpers – usando Cloud Functions seguras
  // -----------------------------------------------------------------------

  /** Upsert: crea o actualiza en RTDB vía Cloud Function */
  const upsertToRTDB = useCallback(async (nodeKey, item) => {
    if (!RTDB_NODE_SET.has(nodeKey)) {
      throw new Error("Nodo de contenido no permitido.");
    }

    const itemData = { ...item };
    const id = itemData.id;
    delete itemData.id;

    const adminUpsertContent = httpsCallable(functions, "adminUpsertContent");
    await adminUpsertContent({ nodeKey, itemData, id });
  }, []);

  /** Delete: elimina de RTDB vía Cloud Function */
  const deleteFromRTDB = useCallback(async (nodeKey, id) => {
    if (!id) return;
    if (!RTDB_NODE_SET.has(nodeKey)) {
      throw new Error("Nodo de contenido no permitido.");
    }

    const adminDeleteContent = httpsCallable(functions, "adminDeleteContent");
    await adminDeleteContent({ nodeKey, id });
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
  const upsertActividadesEditorial = useCallback(
    (item) => upsertToRTDB("actividadesEditorial", item),
    [upsertToRTDB],
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
  const upsertComoLlegar = useCallback(
    (item) => upsertToRTDB("comoLlegar", item),
    [upsertToRTDB],
  );
  const upsertComoLlegarIntro = useCallback(
    (item) => upsertToRTDB("comoLlegarIntro", item),
    [upsertToRTDB],
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
  // Mensajes de contacto y Encuestas → validacion server-side via Functions
  // -----------------------------------------------------------------------
  const enviarMensajeContacto = useCallback(async (mensaje) => {
    await postJson(CONTACT_API_URL, {
      nombre: mensaje.remitente || "",
      correo: mensaje.correo || "",
      mensaje: mensaje.consulta_sugerencia || "",
    });
  }, []);

  const enviarEncuesta = useCallback(async (encuesta) => {
    await postJson(SURVEY_API_URL, {
      puntuacion: Number(encuesta.puntuacion) || 0,
      comentarios: encuesta.comentarios || "",
    });
  }, []);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(
    () => ({
      actividades,
      actividadesEditorial,
      gastronomia,
      hospedajes,
      eventos,
      floraFauna,
      galeria,
      destinos,
      blog,
      heroSlides,
      comoLlegarIntro,
      comoLlegar,
      cooperativas,
      loading,

      upsertActividad,
      deleteActividad,
      upsertActividadesEditorial,
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
      upsertComoLlegarIntro,
      upsertComoLlegar,
      setHeroSlides,
      moveHeroSlide,
      upsertCooperativa,
      deleteCooperativa,
      enviarMensajeContacto,
      enviarEncuesta,
    }),
    [
      actividades,
      actividadesEditorial,
      gastronomia,
      hospedajes,
      eventos,
      floraFauna,
      galeria,
      destinos,
      blog,
      heroSlides,
      comoLlegarIntro,
      comoLlegar,
      cooperativas,
      loading,
      upsertActividad,
      deleteActividad,
      upsertActividadesEditorial,
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
      upsertComoLlegarIntro,
      upsertComoLlegar,
      setHeroSlides,
      moveHeroSlide,
      upsertCooperativa,
      deleteCooperativa,
      enviarMensajeContacto,
      enviarEncuesta,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}
