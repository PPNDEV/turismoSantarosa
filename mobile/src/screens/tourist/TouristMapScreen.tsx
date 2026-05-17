import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function TouristMapScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado.');
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (e) {
        setErrorMsg('No se pudo obtener la ubicación actual.');
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView 
          style={styles.map} 
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
        >
          {/* Ejemplo de marcador en Santa Rosa / Jambelí */}
          <Marker 
            coordinate={{ latitude: -3.450, longitude: -79.966 }}
            title="Santuario Turístico"
            description="Lugar destacado de Santa Rosa"
          />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : <ActivityIndicator size="large" color="#007bff" />}
        </View>
      )}

      {/* Botón de Cerrar Sesión (Arriba a la derecha) */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Salir</Text>
      </TouchableOpacity>

      <View style={styles.overlayMenu}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('QRScannerScreen')}>
          <Text style={styles.buttonText}>📷 Escanear QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.favButton]} onPress={() => navigation.navigate('TouristFavoritesScreen')}>
          <Text style={styles.buttonText}>⭐ Favoritos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', padding: 20 },
  overlayMenu: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    backgroundColor: '#343a40',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  favButton: { backgroundColor: '#ffc107' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  logoutButtonText: { color: '#fff', fontWeight: 'bold' }
});
