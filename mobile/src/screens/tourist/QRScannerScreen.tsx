import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';

export default function QRScannerScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    
    // Si la data es un URL (ej: https://turismosantarosa.com/lugar/123), extraer "123"
    let placeId = data;
    try {
      if (data.startsWith('http://') || data.startsWith('https://')) {
        const parts = data.split('/');
        placeId = parts[parts.length - 1] || data;
      }
    } catch (e) {
      // ignore
    }

    Alert.alert(
      "Código QR Detectado",
      `¿Deseas ver la ficha de este lugar?`,
      [
        { text: "Ver información", onPress: () => {
            setScanned(false);
            navigation.navigate('PlaceDetailsScreen', { placeId, title: `Lugar (${placeId})` });
          }
        },
        { text: "Cancelar", style: "cancel", onPress: () => setScanned(false) }
      ]
    );
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Solicitando permiso de cámara...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>Sin acceso a la cámara</Text></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          {scanned && <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} />}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent'
  }
});
