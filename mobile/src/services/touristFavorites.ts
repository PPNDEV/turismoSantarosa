import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourismItem } from './tourismContent';

const FAVORITES_KEY = '@tourist_favorites_v2';

export type FavoriteItem = Pick<
  TourismItem,
  | 'id'
  | 'type'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'image'
  | 'location'
  | 'contact'
  | 'schedule'
  | 'category'
  | 'island'
  | 'latitude'
  | 'longitude'
> & {
  savedAt: number;
};

export function favoriteKey(item: Pick<TourismItem, 'id' | 'type'>) {
  return `${item.type}:${item.id}`;
}

export function toFavorite(item: TourismItem): FavoriteItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    image: item.image,
    location: item.location,
    contact: item.contact,
    schedule: item.schedule,
    category: item.category,
    island: item.island,
    latitude: item.latitude,
    longitude: item.longitude,
    savedAt: Date.now(),
  };
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as FavoriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(favorites: FavoriteItem[]) {
  const unique = new Map<string, FavoriteItem>();
  favorites.forEach((item) => unique.set(favoriteKey(item), item));
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...unique.values()].slice(0, 80)));
}

export async function isFavorite(item: Pick<TourismItem, 'id' | 'type'>) {
  const favorites = await getFavorites();
  return favorites.some((favorite) => favoriteKey(favorite) === favoriteKey(item));
}

export async function toggleFavorite(item: TourismItem) {
  const favorites = await getFavorites();
  const key = favoriteKey(item);
  const exists = favorites.some((favorite) => favoriteKey(favorite) === key);
  const nextFavorites = exists
    ? favorites.filter((favorite) => favoriteKey(favorite) !== key)
    : [toFavorite(item), ...favorites];

  await saveFavorites(nextFavorites);
  return { favorites: nextFavorites, isFavorite: !exists };
}
