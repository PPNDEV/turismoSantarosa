import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSolicitudesScreen({ navigation }: any) {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'pending_posts'), where('status', '==', 'pending_approval'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPending(list);
    } catch (e) {
      console.warn("Error fetching pending:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPending();
    });
    return unsubscribe;
  }, [navigation]);

  const handleApprove = async (item: any) => {
    Alert.alert('Funcionalidad en Desarrollo', 'Esto requiere llamar a la Cloud Function de migración a RTDB.');
  };

  const handleReject = (id: string) => {
    Alert.alert('Rechazar', '¿Eliminar este borrador?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'pending_posts', id));
          loadPending();
        } catch (e) {
          Alert.alert('Error', 'No se pudo eliminar.');
        }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
        <Text style={styles.date}>Borrador</Text>
      </View>
      <Text style={styles.title}>{item.nombre || item.cooperativa || 'Sin título'}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.descripcion || item.platoTipico || ''}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(item.id)}>
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.btnText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(item)}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.btnText}>Aprobar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitudes Pendientes</Text>
        <TouchableOpacity onPress={loadPending} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#1a472a" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a472a" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#5dcaa5" />
              <Text style={styles.emptyTitle}>¡Todo al día!</Text>
              <Text style={styles.emptyDesc}>No hay solicitudes pendientes de aprobación.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4f0' },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a472a' },
  refreshBtn: { padding: 5, backgroundColor: '#e9f5f0', borderRadius: 20 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  category: { fontSize: 12, fontWeight: 'bold', color: '#5dcaa5', letterSpacing: 1 },
  date: { fontSize: 12, color: '#888' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  desc: { fontSize: 14, color: '#666', marginBottom: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },
  btnReject: { backgroundColor: '#dc3545' },
  btnApprove: { backgroundColor: '#1a472a' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 15 },
  emptyDesc: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }
});
