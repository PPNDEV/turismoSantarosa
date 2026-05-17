import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function AdminModerationScreen() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'reviews'>('posts');

  const fetchPending = async () => {
    try {
      const collectionName = tab === 'posts' ? 'pending_posts' : 'reviews';
      const q = query(collection(db, collectionName), where('status', '==', 'pending_approval'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingItems(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [tab]);

  const handleApprove = async (id: string) => {
    try {
      const collectionName = tab === 'posts' ? 'pending_posts' : 'reviews';
      await updateDoc(doc(db, collectionName, id), { status: 'approved' });
      Alert.alert('Aprobado', 'El elemento ha sido aprobado.');
      fetchPending();
    } catch (e) {
      Alert.alert('Error', 'No se pudo aprobar.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const collectionName = tab === 'posts' ? 'pending_posts' : 'reviews';
      await deleteDoc(doc(db, collectionName, id));
      Alert.alert('Rechazado', 'El elemento ha sido eliminado.');
      fetchPending();
    } catch (e) {
      Alert.alert('Error', 'No se pudo rechazar.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'posts' && styles.activeTab]} onPress={() => setTab('posts')}>
          <Text style={styles.tabText}>Publicaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'reviews' && styles.activeTab]} onPress={() => setTab('reviews')}>
          <Text style={styles.tabText}>Reseñas</Text>
        </TouchableOpacity>
      </View>

      {pendingItems.length === 0 ? (
        <Text style={styles.empty}>No hay elementos pendientes de revisión en esta categoría.</Text>
      ) : (
        <FlatList
          data={pendingItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || item.placeTitle || 'Sin título'}</Text>
              <Text style={styles.cardDesc}>
                {item.description || item.comment || 'Sin descripción'}
              </Text>
              {item.rating && <Text style={{fontWeight: 'bold', color: '#ffc107'}}>Calificación: {item.rating} Estrellas</Text>}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => handleApprove(item.id)}>
                  <Text style={styles.btnText}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => handleReject(item.id)}>
                  <Text style={styles.btnText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  tabs: { flexDirection: 'row', marginBottom: 15 },
  tabBtn: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ccc' },
  activeTab: { borderBottomColor: '#007bff' },
  tabText: { fontWeight: 'bold' },
  empty: { fontStyle: 'italic', color: '#666' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDesc: { marginVertical: 8, color: '#444' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  btn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, marginLeft: 10 },
  approve: { backgroundColor: '#28a745' },
  reject: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
