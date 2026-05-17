import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MODULES = [
  { title: 'Gastronomía', nodeKey: 'gastronomia', desc: 'Restaurantes y huecas', icon: 'restaurant-outline', fields: ['nombre', 'isla', 'platoTipico', 'descripcion', 'ubicacion', 'horario', 'contacto', 'imagen'] },
  { title: 'Hospedajes', nodeKey: 'hospedajes', desc: 'Hoteles y hostales', icon: 'bed-outline', fields: ['nombre', 'isla', 'ubicacion', 'servicios', 'contacto', 'imagen'] },
  { title: 'Actividades', nodeKey: 'actividades', desc: 'Tours y senderos', icon: 'bicycle-outline', fields: ['nombre', 'descripcion', 'isla', 'imagen'] },
  { title: 'Transporte', nodeKey: 'cooperativas', desc: 'Rutas y frecuencias', icon: 'boat-outline', fields: ['cooperativa', 'ruta', 'frecuencia', 'contacto', 'puntoSalida', 'puntoLlegada'] },
  { title: 'Eventos', nodeKey: 'eventos', desc: 'Calendario festivo', icon: 'calendar-outline', fields: ['nombre', 'descripcion', 'fecha', 'hora', 'lugar', 'tipo', 'organizador', 'contacto', 'imagen'] },
  { title: 'Flora y Fauna', nodeKey: 'floraFauna', desc: 'Especies locales', icon: 'leaf-outline', fields: ['nombre', 'nombreCientifico', 'descripcion', 'isla', 'imagen'] },
  { title: 'Galería', nodeKey: 'galeria', desc: 'Fotos del sitio', icon: 'image-outline', fields: ['titulo', 'descripcion', 'imagen'] },
];

export default function AdminContenidoScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestor de Contenido</Text>
      <Text style={styles.subtitle}>Selecciona un módulo para editar el catálogo principal.</Text>
      
      <View style={styles.grid}>
        {MODULES.map(mod => (
          <TouchableOpacity 
            key={mod.nodeKey} 
            style={styles.card} 
            onPress={() => navigation.navigate('GenericAdminScreen', mod)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={mod.icon as any} size={32} color="#1a472a" />
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardDesc}>{mod.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4f0', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a472a', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    backgroundColor: '#fff', 
    width: '48%', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9f5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a472a', textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#666', textAlign: 'center' }
});
