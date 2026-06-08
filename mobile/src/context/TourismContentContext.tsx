import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../services/firebase';
import {
  buildAllFallbackItems,
  HeroSlide,
  moduleOrder,
  normalizeHeroSlide,
  normalizeTourismItem,
  scenicHeroSlides,
  snapshotObjectToArray,
  TourismItem,
  TourismModuleKey,
} from '../services/tourismContent';

const CACHE_KEY = '@tourism_public_content_v1';

type TourismContentState = {
  items: TourismItem[];
  loading: boolean;
  fromCache: boolean;
  refreshToken: number;
  heroSlides: HeroSlide[];
  byType: Record<TourismModuleKey, TourismItem[]>;
  findItem: (type: TourismModuleKey, id: string) => TourismItem | undefined;
  findById: (id: string) => TourismItem | undefined;
};

const emptyByType = moduleOrder.reduce(
  (acc, key) => ({ ...acc, [key]: [] }),
  {} as Record<TourismModuleKey, TourismItem[]>,
);

const TourismContentContext = createContext<TourismContentState>({
  items: [],
  loading: true,
  fromCache: false,
  refreshToken: 0,
  heroSlides: scenicHeroSlides,
  byType: emptyByType,
  findItem: () => undefined,
  findById: () => undefined,
});

export function useTourismContent() {
  return useContext(TourismContentContext);
}

function mergeByType(nextByType: Record<TourismModuleKey, TourismItem[]>) {
  return moduleOrder.flatMap((key) => nextByType[key] ?? []);
}

export const TourismContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [byType, setByType] = useState<Record<TourismModuleKey, TourismItem[]>>(emptyByType);
  const [loadingNodes, setLoadingNodes] = useState(() => new Set<TourismModuleKey>(moduleOrder));
  const [fromCache, setFromCache] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(scenicHeroSlides);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(CACHE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        const cached = JSON.parse(stored) as TourismItem[];
        const cachedByType = moduleOrder.reduce((acc, key) => {
          acc[key] = cached.filter((item) => item.type === key);
          return acc;
        }, { ...emptyByType });

        setByType(cachedByType);
        setFromCache(true);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribers = moduleOrder.map((nodeKey) => {
      const nodeRef = ref(rtdb, `content/${nodeKey}`);

      return onValue(
        nodeRef,
        (snapshot) => {
          const normalized = snapshotObjectToArray(snapshot.val())
            .filter((item) => item.activo !== false)
            .map((item, index) => normalizeTourismItem(nodeKey, item, index));

          setByType((current) => ({
            ...current,
            [nodeKey]: normalized,
          }));
          setLoadingNodes((current) => {
            const next = new Set(current);
            next.delete(nodeKey);
            return next;
          });
          setFromCache(false);
          setRefreshToken((current) => current + 1);
        },
        () => {
          setByType((current) => ({
            ...current,
            [nodeKey]: current[nodeKey]?.length ? current[nodeKey] : [],
          }));
          setLoadingNodes((current) => {
            const next = new Set(current);
            next.delete(nodeKey);
            return next;
          });
        },
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    const nodeRef = ref(rtdb, 'content/heroSlides');

    return onValue(
      nodeRef,
      (snapshot) => {
        const slides = snapshotObjectToArray(snapshot.val())
          .map((slide, index) => normalizeHeroSlide(slide, index))
          .filter((slide) => slide.bg)
          .sort((a, b) => a.order - b.order);

        setHeroSlides(slides.length ? slides : scenicHeroSlides);
      },
      () => setHeroSlides(scenicHeroSlides),
    );
  }, []);

  const items = useMemo(() => {
    const merged = mergeByType(byType);
    return merged.length ? merged : buildAllFallbackItems();
  }, [byType]);

  useEffect(() => {
    if (!items.length || loadingNodes.size > 0) return;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items, loadingNodes.size, refreshToken]);

  const value = useMemo<TourismContentState>(() => {
    const effectiveByType = moduleOrder.reduce((acc, key) => {
      const source = byType[key] ?? [];
      acc[key] = source.length ? source : items.filter((item) => item.type === key);
      return acc;
    }, { ...emptyByType });

    return {
      items,
      loading: loadingNodes.size > 0 && items.length === 0,
      fromCache,
      refreshToken,
      heroSlides,
      byType: effectiveByType,
      findItem: (type, id) => items.find((item) => item.type === type && item.id === id),
      findById: (id) => items.find((item) => item.id === id),
    };
  }, [byType, fromCache, heroSlides, items, loadingNodes.size, refreshToken]);

  return (
    <TourismContentContext.Provider value={value}>
      {children}
    </TourismContentContext.Provider>
  );
};
