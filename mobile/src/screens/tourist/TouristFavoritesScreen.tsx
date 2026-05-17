import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TouristFavoritesScreen() {
  const [favorites, setFavorites] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Carga simulada de favoritos offline
    const loadFavorites = async () => {
      const stored = await AsyncStorage.getItem('@tourist_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        // Mock data temporal
        setFavorites([
          { id: '1', name: 'Playa de Jambelí' },
          { id: '2', name: 'Manglares Costa Rica' }
        ]);
      }
    };
    loadFavorites();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Favoritos (Offline)</Text>
      <Text style={styles.subtitle}>Lugares guardados para ver sin conexión</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <TouchableOpacity><Text style={styles.link}>Ver detalles</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  link: { color: '#007bff', marginTop: 5 }
});
