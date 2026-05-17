import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function UnverifiedScreen() {
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Éxito', 'Correo de verificación reenviado. Revisa tu bandeja de entrada o spam.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo reenviar el correo.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu correo</Text>
      <Text style={styles.text}>
        Para acceder a tu cuenta, debes verificar tu dirección de correo electrónico.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton, sending && styles.disabled]} 
        onPress={handleResend}
        disabled={sending}
      >
        <Text style={styles.buttonText}>{sending ? 'Enviando...' : 'Reenviar Correo'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#555' },
  button: { width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  primaryButton: { backgroundColor: '#007bff' },
  secondaryButton: { backgroundColor: '#dc3545' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { backgroundColor: '#7fbaff' }
});
