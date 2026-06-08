import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTourismContent } from '../../context/TourismContentContext';
import { MAP_CENTER, moduleConfigs, moduleOrder, TourismModuleKey } from '../../services/tourismContent';

export default function TouristMapScreen({ navigation }: any) {
  const { items, loading } = useTourismContent();
  const [region, setRegion] = useState<Region>(MAP_CENTER);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [activeTypes, setActiveTypes] = useState<TourismModuleKey[]>(moduleOrder);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;

      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        setRegion({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
        setLocationStatus('ready');
      } catch {
        setLocationStatus('error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => activeTypes.includes(item.type)),
    [activeTypes, items],
  );

  const toggleType = (type: TourismModuleKey) => {
    setActiveTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1 ? current : current.filter((item) => item !== type);
      }

      return [...current, type];
    });
  };

  return (
    <View style={styles.screen}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={MAP_CENTER}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={locationStatus === 'ready'}
        showsMyLocationButton
      >
        {filteredItems.map((item) => {
          const config = moduleConfigs[item.type];

          return (
            <Marker
              key={`${item.type}-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              pinColor={config.color}
              title={item.title}
              description={item.subtitle}
            >
              <Callout onPress={() => navigation.navigate('PlaceDetailsScreen', { type: item.type, id: item.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutType}>{config.label}</Text>
                  <Text style={styles.calloutTitle}>{item.title}</Text>
                  <Text style={styles.calloutText}>{item.subtitle || item.description}</Text>
                  <Text style={styles.calloutLink}>Ver ficha</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.topPanel}>
        <View>
          <Text style={styles.title}>Mapa turístico</Text>
          <Text style={styles.subtitle}>{filteredItems.length} marcadores visibles</Text>
        </View>
        {(loading || locationStatus === 'loading') && <ActivityIndicator color="#0891b2" />}
      </View>

      {locationStatus === 'denied' || locationStatus === 'error' ? (
        <View style={styles.locationNotice}>
          <Ionicons name="navigate-outline" size={18} color="#92400e" />
          <Text style={styles.locationNoticeText}>
            {locationStatus === 'denied'
              ? 'Permiso GPS denegado. El mapa sigue disponible con marcadores turísticos.'
              : 'No se pudo obtener tu ubicación. Usamos el centro del archipiélago.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.filters}>
        {moduleOrder.map((type) => {
          const config = moduleConfigs[type];
          const active = activeTypes.includes(type);

          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, active && { backgroundColor: config.color, borderColor: config.color }]}
              onPress={() => toggleType(type)}
            >
              <Ionicons name={config.icon as any} size={16} color={active ? '#ffffff' : config.color} />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#e2e8f0' },
  map: { ...StyleSheet.absoluteFillObject },
  topPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#64748b', fontWeight: '700', marginTop: 2 },
  locationNotice: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    padding: 11,
    borderRadius: 14,
  },
  locationNoticeText: { flex: 1, color: '#92400e', fontWeight: '700', fontSize: 12, lineHeight: 17 },
  filters: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  filterText: { color: '#334155', fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: '#ffffff' },
  callout: { width: 220, padding: 4 },
  calloutType: { color: '#0891b2', fontWeight: '900', fontSize: 12, marginBottom: 3 },
  calloutTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  calloutText: { color: '#475569', lineHeight: 18 },
  calloutLink: { color: '#0891b2', fontWeight: '900', marginTop: 8 },
});
