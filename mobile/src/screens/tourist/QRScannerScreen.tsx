import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTourismContent } from '../../context/TourismContentContext';

function extractQrId(data: string) {
  try {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      const url = new URL(data);
      return (
        url.searchParams.get('placeId') ||
        url.searchParams.get('id') ||
        url.pathname.split('/').filter(Boolean).pop() ||
        data
      );
    }
  } catch {
    return data;
  }

  return data.trim();
}

export default function QRScannerScreen({ navigation }: any) {
  const { findById } = useTourismContent();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    const placeId = extractQrId(data);
    const item = findById(placeId);

    if (!item) {
      Alert.alert(
        'QR no reconocido',
        'El código escaneado no coincide con un registro turístico sincronizado.',
        [{ text: 'Escanear de nuevo', onPress: () => setScanned(false) }],
      );
      return;
    }

    Alert.alert(
      'Ficha turística detectada',
      `¿Quieres abrir ${item.title}?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Ver información',
          onPress: () => {
            setScanned(false);
            navigation.navigate('PlaceDetailsScreen', { type: item.type, id: item.id });
          },
        },
      ],
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={36} color="#0891b2" />
        <Text style={styles.centerTitle}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-reverse-outline" size={42} color="#94a3b8" />
        <Text style={styles.centerTitle}>Sin acceso a la cámara</Text>
        <Text style={styles.centerText}>Activa el permiso para escanear señalética turística.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.topCard}>
            <Text style={styles.title}>Escáner QR</Text>
            <Text style={styles.subtitle}>Apunta a la señalética del atractivo o servicio turístico.</Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {scanned && (
            <TouchableOpacity style={styles.scanAgain} onPress={() => setScanned(false)}>
              <Ionicons name="refresh-outline" size={18} color="#ffffff" />
              <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.18)' },
  topCard: {
    position: 'absolute',
    top: 24,
    left: 18,
    right: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 18,
    padding: 16,
  },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#cbd5e1', marginTop: 4, lineHeight: 19 },
  scanFrame: { width: 250, height: 250 },
  corner: { position: 'absolute', width: 54, height: 54, borderColor: '#22d3ee' },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 18 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 18 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 18 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 18 },
  scanAgain: {
    position: 'absolute',
    bottom: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 20,
  },
  scanAgainText: { color: '#ffffff', fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#f8fafc' },
  centerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  centerText: { color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
