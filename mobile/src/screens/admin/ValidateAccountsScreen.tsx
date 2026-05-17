import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ValidateAccountsScreen() {
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const q = query(collection(db, 'usersPublic'), where('role', '==', 'pending_editor'));
      const snapshot = await getDocs(q);
      const accounts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPendingAccounts(accounts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'usersPublic', id), { role: 'editor' });
      Alert.alert('Aprobado', 'La cuenta ha sido promovida a Editor.');
      fetchPending();
    } catch (e) {
      Alert.alert('Error', 'No se pudo aprobar.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'usersPublic', id), { role: 'visualizador' });
      Alert.alert('Rechazado', 'La cuenta ha vuelto a ser Turista.');
      fetchPending();
    } catch (e) {
      Alert.alert('Error', 'No se pudo rechazar.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validación de Cuentas (RUC)</Text>
      {pendingAccounts.length === 0 ? (
        <Text style={styles.empty}>No hay cuentas pendientes por validar.</Text>
      ) : (
        <FlatList
          data={pendingAccounts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.email || 'Sin Email'}</Text>
              <Text style={styles.cardDesc}>RUC: {item.ruc || 'No provisto'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => handleApprove(item.id)}>
                  <Text style={styles.btnText}>Aprobar RUC</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => handleReject(item.id)}>
                  <Text style={styles.btnText}>Denegar</Text>
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
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
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
