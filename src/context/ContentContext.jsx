import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  demoBlog,
  demoCooperativas,
  demoDestinos,
  demoEventos,
  demoFloraFauna,
  demoGastronomia,
  demoGaleria,
  demoHospedajes,
} from "../data/demoData";
import { ContentContext } from "./content-context";
import { normalizeDestinoIcon } from "../utils/destinoIcons";
import { db } from "../services/firebase";

const STORAGE_KEY = "visit-santa-rosa-content-v1";
const CONTENT_COLLECTION = "siteContent";
const CONTENT_DOCUMENT = "main";

const initialContent = {
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
  destinos: demoDestinos,
  eventos: demoEventos,
  blog: demoBlog,
  galeria: demoGaleria,
  gastronomia: demoGastronomia,
  hospedajes: demoHospedajes,
  floraFauna: demoFloraFauna,
  cooperativas: demoCooperativas,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function upsertItem(list, item) {
  const nextItem = { ...item };
  if (!nextItem.id) {
    nextItem.id = Date.now().toString();
  }

  const index = list.findIndex((entry) => entry.id === nextItem.id);
  if (index === -1) {
    return [...list, nextItem];
  }

  const nextList = [...list];
  nextList[index] = nextItem;
  return nextList;
}

function cleanHeroTag(tag) {
  return String(tag || "")
    .replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "")
    .trim();
}

function normalizeHeroSlides(slides) {
  return slides.map((slide) => ({
    ...slide,
    tag: cleanHeroTag(slide.tag),
  }));
}

function normalizeDestinos(destinos) {
  return destinos.map((destino) => ({
    ...destino,
    icono: normalizeDestinoIcon(destino.icono),
  }));
}

function normalizeContent(rawContent) {
  if (!rawContent || typeof rawContent !== "object") {
    return clone(initialContent);
  }

  return {
    heroSlides:
      Array.isArray(rawContent.heroSlides) && rawContent.heroSlides.length > 0
        ? normalizeHeroSlides(rawContent.heroSlides)
        : clone(initialContent.heroSlides),
    destinos: Array.isArray(rawContent.destinos)
      ? normalizeDestinos(rawContent.destinos)
      : clone(initialContent.destinos),
    eventos: Array.isArray(rawContent.eventos)
      ? rawContent.eventos
      : clone(initialContent.eventos),
    blog: Array.isArray(rawContent.blog)
      ? rawContent.blog
      : clone(initialContent.blog),
    galeria: Array.isArray(rawContent.galeria)
      ? rawContent.galeria
      : clone(initialContent.galeria),
    gastronomia: Array.isArray(rawContent.gastronomia)
      ? rawContent.gastronomia
      : clone(initialContent.gastronomia),
    hospedajes: Array.isArray(rawContent.hospedajes)
      ? rawContent.hospedajes
      : clone(initialContent.hospedajes),
    floraFauna: Array.isArray(rawContent.floraFauna)
      ? rawContent.floraFauna
      : clone(initialContent.floraFauna),
    cooperativas: Array.isArray(rawContent.cooperativas)
      ? rawContent.cooperativas
      : clone(initialContent.cooperativas),
  };
}

function readStoredContent() {
  if (typeof window === "undefined") {
    return clone(initialContent);
  }

  try {
    const rawContent = window.localStorage.getItem(STORAGE_KEY);
    if (!rawContent) {
      return clone(initialContent);
    }

    return normalizeContent(JSON.parse(rawContent));
  } catch {
    return clone(initialContent);
  }
}

function persistStoredContent(content) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch {
    // Ignorar fallos de almacenamiento local.
  }
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(readStoredContent);

  const contentRef = useMemo(
    () => doc(db, CONTENT_COLLECTION, CONTENT_DOCUMENT),
    [],
  );

  useEffect(() => {
    persistStoredContent(content);
  }, [content]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      contentRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setContent(normalizeContent(snapshot.data()));
          return;
        }

        const seedContent = clone(initialContent);
        try {
          await setDoc(contentRef, {
            ...seedContent,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Si Firestore no está disponible, seguimos con el respaldo local.
        }
      },
      () => {
        setContent(readStoredContent());
      },
    );

    return () => unsubscribe();
  }, [contentRef]);

  const persistContent = (nextContent) => {
    persistStoredContent(nextContent);

    void setDoc(contentRef, {
      ...nextContent,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      // Respaldo local ya persistido.
    });
  };

  const updateCollection = (key, item) => {
    setContent((prev) => {
      const nextContent = {
        ...prev,
        [key]: upsertItem(prev[key], item),
      };

      persistContent(nextContent);
      return nextContent;
    });
  };

  const removeFromCollection = (key, id) => {
    setContent((prev) => {
      const nextContent = {
        ...prev,
        [key]: prev[key].filter((entry) => entry.id !== id),
      };

      persistContent(nextContent);
      return nextContent;
    });
  };

  const moveInCollection = (key, id, direction) => {
    setContent((prev) => {
      const currentList = prev[key];
      const currentIndex = currentList.findIndex((entry) => entry.id === id);
      const targetIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= currentList.length
      ) {
        return prev;
      }

      const nextList = [...currentList];
      [nextList[currentIndex], nextList[targetIndex]] = [
        nextList[targetIndex],
        nextList[currentIndex],
      ];

      const nextContent = {
        ...prev,
        [key]: nextList,
      };

      persistContent(nextContent);
      return nextContent;
    });
  };

  const setHeroSlides = (nextSlides) => {
    setContent((prev) => {
      const nextContent = {
        ...prev,
        heroSlides:
          typeof nextSlides === "function"
            ? nextSlides(prev.heroSlides)
            : clone(nextSlides),
      };

      persistContent(nextContent);
      return nextContent;
    });
  };

  const resetContent = () => {
    const nextContent = clone(initialContent);
    setContent(nextContent);
    persistContent(nextContent);
  };

  const value = {
    ...content,
    setHeroSlides,
    upsertHeroSlide: (slide) => updateCollection("heroSlides", slide),
    deleteHeroSlide: (id) => removeFromCollection("heroSlides", id),
    moveHeroSlide: (id, direction) =>
      moveInCollection("heroSlides", id, direction),
    upsertDestino: (destino) => updateCollection("destinos", destino),
    deleteDestino: (id) => removeFromCollection("destinos", id),
    upsertEvento: (evento) => updateCollection("eventos", evento),
    deleteEvento: (id) => removeFromCollection("eventos", id),
    upsertBlog: (articulo) => updateCollection("blog", articulo),
    deleteBlog: (id) => removeFromCollection("blog", id),
    upsertGaleria: (item) => updateCollection("galeria", item),
    deleteGaleria: (id) => removeFromCollection("galeria", id),
    upsertGastronomia: (restaurante) =>
      updateCollection("gastronomia", restaurante),
    deleteGastronomia: (id) => removeFromCollection("gastronomia", id),
    upsertHospedaje: (hospedaje) => updateCollection("hospedajes", hospedaje),
    deleteHospedaje: (id) => removeFromCollection("hospedajes", id),
    upsertFloraFauna: (registro) => updateCollection("floraFauna", registro),
    deleteFloraFauna: (id) => removeFromCollection("floraFauna", id),
    upsertCooperativa: (cooperativa) =>
      updateCollection("cooperativas", cooperativa),
    deleteCooperativa: (id) => removeFromCollection("cooperativas", id),
    resetContent,
  };

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}
