import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminMensajesScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleToggleRead = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), { isRead: !currentStatus });
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar mensaje', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'messages', id));
        } catch (e) {
          Alert.alert('Error', 'No se pudo eliminar el mensaje.');
        }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.authorInfo}>
          {!item.isRead && <View style={styles.unreadDot} />}
          <Text style={styles.author}>{item.nombre || item.remitente || 'Anónimo'}</Text>
        </View>
        <Text style={styles.date}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Fecha desconocida'}
        </Text>
      </View>
      <Text style={styles.email}>{item.correo}</Text>
      <Text style={styles.message}>{item.mensaje}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => handleToggleRead(item.id, item.isRead)}
        >
          <Ionicons name={item.isRead ? "mail-open-outline" : "mail-unread-outline"} size={20} color="#007bff" />
          <Text style={[styles.actionText, { color: '#007bff' }]}>
            {item.isRead ? 'Marcar no leído' : 'Marcar leído'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
          <Text style={[styles.actionText, { color: '#dc3545' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bandeja de Entrada</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1a472a" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay mensajes de contacto.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4f0', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a472a', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#5dcaa5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5dcaa5', marginRight: 8 },
  author: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#888' },
  email: { fontSize: 14, color: '#007bff', marginBottom: 10 },
  message: { fontSize: 15, color: '#555', marginBottom: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  actionText: { marginLeft: 5, fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 50 }
});
