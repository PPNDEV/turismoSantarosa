import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';
import { useTourismContent } from '../../context/TourismContentContext';
import { moduleConfigs, moduleOrder, TourismItem, TourismModuleKey } from '../../services/tourismContent';

const light = { background: '#f8fafc', card: '#ffffff', soft: '#f1f5f9', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' };
const dark = { background: '#020617', card: '#0f172a', soft: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#1e293b' };

function TouristCard({ item, onPress, theme }: { item: TourismItem; onPress: () => void; theme: typeof light }) {
  const config = moduleConfigs[item.type];

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: `${config.color}1A` }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={theme.muted} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle || item.category}</Text>
        <Text style={[styles.cardDescription, { color: theme.muted }]} numberOfLines={2}>{item.description}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={theme.muted} />
          <Text style={[styles.metaText, { color: theme.muted }]} numberOfLines={1}>{item.location || item.island}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CatalogScreen({ navigation, route }: any) {
  const initialType = route?.params?.initialType as TourismModuleKey | undefined;
  const { items, loading } = useTourismContent();
  const { darkMode } = usePreferences();
  const theme = darkMode ? dark : light;
  const [activeType, setActiveType] = useState<TourismModuleKey | 'todos'>(initialType || 'todos');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = activeType === 'todos' || item.type === activeType;
      const searchableText = [item.title, item.subtitle, item.description, item.category, item.location, item.contact, item.island].join(' ').toLowerCase();
      return matchesType && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [activeType, items, search]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Catalogo turistico</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Explora informacion aprobada desde la plataforma web.</Text>
        <View style={[styles.searchBox, { backgroundColor: theme.soft, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar por nombre, ubicacion o categoria"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        horizontal
        data={['todos', ...moduleOrder] as Array<TourismModuleKey | 'todos'>}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersList, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => {
          const isAll = item === 'todos';
          const config = isAll ? null : moduleConfigs[item];
          const active = activeType === item;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: theme.card, borderColor: theme.border },
                active && { backgroundColor: config?.color || '#0891b2', borderColor: config?.color || '#0891b2' },
              ]}
              onPress={() => setActiveType(item)}
            >
              <Ionicons name={(config?.icon || 'apps-outline') as any} size={16} color={active ? '#ffffff' : config?.color || '#0891b2'} />
              <Text style={[styles.filterText, { color: theme.text }, active && styles.filterTextActive]} numberOfLines={1}>
                {isAll ? 'Todos' : config?.pluralLabel}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0891b2" />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando contenido...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouristCard item={item} theme={theme} onPress={() => navigation.navigate('PlaceDetailsScreen', { type: item.type, id: item.id })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color="#94a3b8" />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin resultados</Text>
              <Text style={[styles.emptyText, { color: theme.muted }]}>Prueba con otra categoria o palabra clave.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 18, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { marginTop: 4, lineHeight: 19 },
  searchBox: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, borderWidth: 1 },
  searchInput: { flex: 1, minHeight: 46, fontSize: 15 },
  filtersList: { flexGrow: 0, borderBottomWidth: 1 },
  filters: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    minWidth: 86,
    maxWidth: 150,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    flexShrink: 0,
  },
  filterText: { fontWeight: '800', fontSize: 13, flexShrink: 1 },
  filterTextActive: { color: '#ffffff' },
  list: { padding: 16, paddingBottom: 28 },
  card: { borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1 },
  cardImage: { width: '100%', height: 154, backgroundColor: '#1e293b' },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '900' },
  cardTitle: { fontSize: 19, fontWeight: '900', marginBottom: 4 },
  cardSubtitle: { color: '#0891b2', fontWeight: '800', marginBottom: 8 },
  cardDescription: { lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '900' },
  emptyText: { textAlign: 'center', marginTop: 6 },
});
