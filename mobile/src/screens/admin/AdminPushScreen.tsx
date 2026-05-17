import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function AdminPushScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const sendNotification = () => {
    if (!title || !body) {
      Alert.alert('Error', 'Completa el título y el mensaje.');
      return;
    }
    // Lógica futura para llamar a Cloud Function y emitir FCM push
    Alert.alert('Simulación Exitosa', `Notificación "${title}" enviada a todos los dispositivos.`);
    setTitle('');
    setBody('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emisión de Alertas Globales</Text>
      <Text style={styles.subtitle}>Envía notificaciones a todos los turistas y negocios.</Text>

      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ej: Alerta de Aguaje" />

      <Text style={styles.label}>Mensaje</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={body} 
        onChangeText={setBody} 
        placeholder="Ej: Se suspenden actividades marítimas..." 
        multiline
      />

      <TouchableOpacity style={styles.btn} onPress={sendNotification}>
        <Text style={styles.btnText}>Enviar Notificación Push</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, backgroundColor: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
