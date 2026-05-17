import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminSurveysScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métricas de Satisfacción</Text>
      <Text style={styles.subtitle}>Aquí se visualizarán las estadísticas de encuestas rellenadas por turistas (Simulación Fase 4).</Text>
      
      <View style={styles.card}>
        <Text style={styles.statTitle}>Satisfacción General</Text>
        <Text style={styles.statValue}>4.8 / 5.0 ⭐</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.statTitle}>Lugares más visitados</Text>
        <Text style={styles.statValue}>1. Playa Jambelí</Text>
        <Text style={styles.statValue}>2. Isla Costa Rica</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 15, elevation: 2 },
  statTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  statValue: { fontSize: 18, color: '#007bff' }
});
