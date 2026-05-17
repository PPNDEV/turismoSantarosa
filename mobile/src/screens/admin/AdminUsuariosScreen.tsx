import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsuariosScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'usersPublic'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    } catch (e) {
      console.warn("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = (id: string, currentRole: string) => {
    Alert.alert(
      "Cambiar Rol",
      `Rol actual: ${currentRole}`,
      [
        { text: "Hacer Administrador", onPress: () => updateRole(id, 'administrador') },
        { text: "Hacer Editor", onPress: () => updateRole(id, 'editor') },
        { text: "Hacer Visualizador", onPress: () => updateRole(id, 'visualizador') },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'usersPublic', id), { role: newRole });
      loadUsers();
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el rol.");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.email}>{item.email || 'Sin correo'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role?.toUpperCase() || 'DESCONOCIDO'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => changeRole(item.id, item.role)}>
        <Ionicons name="create-outline" size={24} color="#007bff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a472a" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay usuarios registrados.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4f0' },
  header: { backgroundColor: '#1a472a', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  refreshBtn: { padding: 5 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  cardContent: { flex: 1 },
  email: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  roleBadge: { backgroundColor: '#e9ecef', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#495057' },
  editBtn: { padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 50 }
});
