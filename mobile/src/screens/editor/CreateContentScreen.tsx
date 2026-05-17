import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { saveDraftLocal, publishDraftToFirebase, DraftPost } from '../../services/offlineSync';
import { useAuth } from '../../context/AuthContext';

export default function CreateContentScreen({ navigation }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gastronomía');
  const [formPayload, setFormPayload] = useState<Record<string, any>>({
    isla: 'Jambelí', // Default para la mayoría
  });
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Gastronomía', 'Hospedaje', 'Actividades', 'Transporte', 'Eventos'];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar fotos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const updatePayload = (key: string, value: any) => {
    setFormPayload(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Validaciones básicas según categoría
    if (!formPayload.nombre && !formPayload.cooperativa) {
      Alert.alert('Error', 'El campo principal (Nombre o Cooperativa) es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;

      const newDraft: DraftPost = {
        id: uuidv4(),
        category,
        imageUri: image,
        status: isOnline ? 'pending' : 'draft',
        createdAt: Date.now(),
        payload: { ...formPayload, nombre: formPayload.nombre || formPayload.cooperativa },
      };

      if (isOnline && user?.uid) {
        // Subir directamente a Firebase
        await publishDraftToFirebase(newDraft, user.uid);
        Alert.alert('Éxito', 'Publicación enviada a revisión exitosamente.');
      } else {
        // Guardar localmente
        newDraft.status = 'pending';
        await saveDraftLocal(newDraft);
        Alert.alert('Guardado Offline', 'Se guardó en borradores y se sincronizará cuando tengas internet.');
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema procesando tu publicación.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderer Dinámico
  const renderDynamicFields = () => {
    switch (category) {
      case 'Gastronomía':
        return (
          <>
            <Text style={styles.label}>Nombre del Restaurante</Text>
            <TextInput style={styles.input} value={formPayload.nombre || ''} onChangeText={(t) => updatePayload('nombre', t)} />
            <Text style={styles.label}>Isla</Text>
            <View style={styles.radioGroup}>
              {['Jambelí', 'Costa Rica', 'San Gregorio'].map(i => (
                <TouchableOpacity key={i} style={[styles.radio, formPayload.isla === i && styles.radioActive]} onPress={() => updatePayload('isla', i)}>
                  <Text style={[styles.radioText, formPayload.isla === i && styles.radioTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Plato Típico</Text>
            <TextInput style={styles.input} value={formPayload.platoTipico || ''} onChangeText={(t) => updatePayload('platoTipico', t)} />
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={formPayload.descripcion || ''} onChangeText={(t) => updatePayload('descripcion', t)} />
            <Text style={styles.label}>Ubicación</Text>
            <TextInput style={styles.input} value={formPayload.ubicacion || ''} onChangeText={(t) => updatePayload('ubicacion', t)} />
            <Text style={styles.label}>Horario</Text>
            <TextInput style={styles.input} value={formPayload.horario || ''} onChangeText={(t) => updatePayload('horario', t)} />
            <Text style={styles.label}>Contacto</Text>
            <TextInput style={styles.input} value={formPayload.contacto || ''} onChangeText={(t) => updatePayload('contacto', t)} />
          </>
        );
      case 'Hospedaje':
        return (
          <>
            <Text style={styles.label}>Nombre del Hospedaje</Text>
            <TextInput style={styles.input} value={formPayload.nombre || ''} onChangeText={(t) => updatePayload('nombre', t)} />
            <Text style={styles.label}>Isla</Text>
            <View style={styles.radioGroup}>
              {['Jambelí', 'Costa Rica', 'San Gregorio'].map(i => (
                <TouchableOpacity key={i} style={[styles.radio, formPayload.isla === i && styles.radioActive]} onPress={() => updatePayload('isla', i)}>
                  <Text style={[styles.radioText, formPayload.isla === i && styles.radioTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Ubicación</Text>
            <TextInput style={styles.input} value={formPayload.ubicacion || ''} onChangeText={(t) => updatePayload('ubicacion', t)} />
            <Text style={styles.label}>Servicios (separados por coma)</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline placeholder="Ej: Wifi, Piscina, Desayuno" value={formPayload.servicios || ''} onChangeText={(t) => updatePayload('servicios', t)} />
            <Text style={styles.label}>Contacto</Text>
            <TextInput style={styles.input} value={formPayload.contacto || ''} onChangeText={(t) => updatePayload('contacto', t)} />
          </>
        );
      case 'Actividades':
        return (
          <>
            <Text style={styles.label}>Nombre de Actividad</Text>
            <TextInput style={styles.input} value={formPayload.nombre || ''} onChangeText={(t) => updatePayload('nombre', t)} />
            <Text style={styles.label}>Isla</Text>
            <View style={styles.radioGroup}>
              {['Jambelí', 'Costa Rica', 'San Gregorio'].map(i => (
                <TouchableOpacity key={i} style={[styles.radio, formPayload.isla === i && styles.radioActive]} onPress={() => updatePayload('isla', i)}>
                  <Text style={[styles.radioText, formPayload.isla === i && styles.radioTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={formPayload.descripcion || ''} onChangeText={(t) => updatePayload('descripcion', t)} />
          </>
        );
      case 'Transporte':
        return (
          <>
            <Text style={styles.label}>Nombre de Cooperativa</Text>
            <TextInput style={styles.input} value={formPayload.cooperativa || ''} onChangeText={(t) => updatePayload('cooperativa', t)} />
            <Text style={styles.label}>Ruta Fluvial</Text>
            <TextInput style={styles.input} placeholder="Ej: Puerto Jelí - Jambelí" value={formPayload.ruta || ''} onChangeText={(t) => updatePayload('ruta', t)} />
            <Text style={styles.label}>Frecuencia</Text>
            <TextInput style={styles.input} value={formPayload.frecuencia || ''} onChangeText={(t) => updatePayload('frecuencia', t)} />
            <Text style={styles.label}>Muelle de Salida</Text>
            <TextInput style={styles.input} value={formPayload.puntoSalida || ''} onChangeText={(t) => updatePayload('puntoSalida', t)} />
            <Text style={styles.label}>Muelle de Llegada</Text>
            <TextInput style={styles.input} value={formPayload.puntoLlegada || ''} onChangeText={(t) => updatePayload('puntoLlegada', t)} />
            <Text style={styles.label}>Contacto</Text>
            <TextInput style={styles.input} value={formPayload.contacto || ''} onChangeText={(t) => updatePayload('contacto', t)} />
          </>
        );
      case 'Eventos':
        return (
          <>
            <Text style={styles.label}>Nombre del Evento</Text>
            <TextInput style={styles.input} value={formPayload.nombre || ''} onChangeText={(t) => updatePayload('nombre', t)} />
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-10-15" value={formPayload.fecha || ''} onChangeText={(t) => updatePayload('fecha', t)} />
            <Text style={styles.label}>Hora</Text>
            <TextInput style={styles.input} placeholder="14:00" value={formPayload.hora || ''} onChangeText={(t) => updatePayload('hora', t)} />
            <Text style={styles.label}>Lugar</Text>
            <TextInput style={styles.input} value={formPayload.lugar || ''} onChangeText={(t) => updatePayload('lugar', t)} />
            <Text style={styles.label}>Tipo de Evento</Text>
            <TextInput style={styles.input} placeholder="Ej: Cultural" value={formPayload.tipo || ''} onChangeText={(t) => updatePayload('tipo', t)} />
            <Text style={styles.label}>Organizador</Text>
            <TextInput style={styles.input} value={formPayload.organizador || ''} onChangeText={(t) => updatePayload('organizador', t)} />
            <Text style={styles.label}>Contacto</Text>
            <TextInput style={styles.input} value={formPayload.contacto || ''} onChangeText={(t) => updatePayload('contacto', t)} />
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={formPayload.descripcion || ''} onChangeText={(t) => updatePayload('descripcion', t)} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tipo de Negocio / Publicación</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryChip, category === cat && styles.activeChip]}
            onPress={() => { setCategory(cat); setFormPayload({ isla: 'Jambelí' }); }}
          >
            <Text style={[styles.categoryChipText, category === cat && styles.activeChipText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderDynamicFields()}

      {category !== 'Transporte' && (
        <>
          <Text style={styles.label}>Fotografía (Opcional)</Text>
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, styles.galleryButton]} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}
        </>
      )}

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
        onPress={handleSave}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Guardando...' : 'Guardar y Enviar a Revisión'}
        </Text>
      </TouchableOpacity>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10 },
  radioGroup: { flexDirection: 'row', marginBottom: 10 },
  radio: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, marginRight: 8 },
  radioActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  radioText: { color: '#333' },
  radioTextActive: { color: '#fff', fontWeight: 'bold' },
  categoryScroll: { flexDirection: 'row', marginBottom: 15, paddingVertical: 5 },
  categoryChip: { backgroundColor: '#f0f4f8', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ccc' },
  activeChip: { backgroundColor: '#007bff', borderColor: '#007bff' },
  categoryChipText: { color: '#333', fontWeight: 'bold' },
  activeChipText: { color: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
  photoButton: { flex: 1, backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  galleryButton: { backgroundColor: '#17a2b8', marginRight: 0, marginLeft: 5 },
  photoButtonText: { color: '#fff', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
  submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#a5d8ad' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
