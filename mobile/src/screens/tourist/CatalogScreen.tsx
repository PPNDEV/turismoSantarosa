import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

// Datos de prueba estáticos para el catálogo
const mockData = [
  { id: '1', title: 'Cevichería El Marinero', category: 'Gastronomía' },
  { id: '2', title: 'Hotel Jambelí Paradise', category: 'Hospedaje' },
  { id: '3', title: 'Paseo en Lancha', category: 'Actividades' },
];

export default function CatalogScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string | null>(null);

  const categories = ['Gastronomía', 'Hospedaje', 'Actividades'];

  const filteredData = filter ? mockData.filter(item => item.category === filter) : mockData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('tourist.catalog')}</Text>

      <View style={styles.filters}>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === null && styles.activeFilter]} 
          onPress={() => setFilter(null)}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.filterBtn, filter === cat && styles.activeFilter]} 
            onPress={() => setFilter(cat)}
          >
            <Text style={styles.filterText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('PlaceDetailsScreen', { placeId: item.id, title: item.title })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  filterBtn: { backgroundColor: '#e0e0e0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  activeFilter: { backgroundColor: '#007bff' },
  filterText: { color: '#333', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardCategory: { color: '#666', marginTop: 5 }
});
