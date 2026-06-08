import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { usePreferences } from '../../context/PreferencesContext';
import { getFavorites, FavoriteItem, saveFavorites, favoriteKey } from '../../services/touristFavorites';
import { moduleConfigs } from '../../services/tourismContent';

const light = { background: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' };
const dark = { background: '#020617', card: '#0f172a', text: '#f8fafc', muted: '#cbd5e1', border: '#1e293b' };

export default function TouristFavoritesScreen({ navigation }: any) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { darkMode } = usePreferences();
  const theme = darkMode ? dark : light;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavorites().then((stored) => {
        if (mounted) setFavorites(stored);
      });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const removeFavorite = async (item: FavoriteItem) => {
    const next = favorites.filter((favorite) => favoriteKey(favorite) !== favoriteKey(item));
    setFavorites(next);
    await saveFavorites(next);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Favoritos offline</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Lugares guardados para consultar contacto, ubicacion y horarios sin senal.</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => favoriteKey(item)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const config = moduleConfigs[item.type];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('PlaceDetailsScreen', { type: item.type, id: item.id, title: item.title })}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <View style={[styles.badge, { backgroundColor: `${config.color}1A` }]}>
                    <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeFavorite(item)}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.cardText, { color: theme.muted }]} numberOfLines={2}>{item.description}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={theme.muted} />
                  <Text style={[styles.metaText, { color: theme.muted }]} numberOfLines={1}>{item.location || item.island}</Text>
                </View>
                {!!item.contact && (
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={14} color={theme.muted} />
                    <Text style={[styles.metaText, { color: theme.muted }]} numberOfLines={1}>{item.contact}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={42} color="#94a3b8" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aun no tienes favoritos</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>Abre un lugar del catalogo y toca el corazon para guardarlo.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 18, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { marginTop: 4, lineHeight: 19 },
  list: { padding: 16, paddingBottom: 28 },
  card: { borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1 },
  image: { width: '100%', height: 132, backgroundColor: '#1e293b' },
  body: { padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '900' },
  removeButton: { padding: 8, borderRadius: 14, backgroundColor: '#fee2e2' },
  cardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  cardText: { lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 28 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginTop: 12 },
  emptyText: { textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
