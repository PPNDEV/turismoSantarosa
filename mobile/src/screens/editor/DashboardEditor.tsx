import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { getLocalDrafts, syncAllDrafts, DraftPost } from '../../services/offlineSync';

export default function DashboardEditor({ navigation }: any) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    // Intentar sincronizar primero
    setIsSyncing(true);
    await syncAllDrafts(user.uid);
    setIsSyncing(false);

    // Cargar borradores (los que quedaron pendientes/fallaron)
    const local = await getLocalDrafts();
    setDrafts(local);
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const renderDraft = ({ item }: { item: DraftPost }) => (
    <View style={styles.draftCard}>
      <Text style={styles.draftTitle}>{item.payload?.nombre || item.payload?.cooperativa || 'Sin título'}</Text>
      <Text style={styles.draftCategory}>{item.category}</Text>
      <Text style={styles.draftStatus}>
        Estado: {item.status === 'pending' ? 'Pendiente de Sync ⏳' : 'Borrador 📝'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Negocios</Text>
        <Text style={styles.subtitle}>Gestiona tus servicios e información</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Crear Nueva Publicación" 
          onPress={() => navigation.navigate('CreateContentScreen')} 
        />
      </View>

      {isSyncing && <Text style={styles.syncText}>Sincronizando con el servidor...</Text>}

      <Text style={styles.sectionTitle}>Tus Publicaciones Locales (Borradores)</Text>
      {drafts.length === 0 ? (
        <Text style={styles.emptyText}>No tienes borradores locales o todo está sincronizado.</Text>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={item => item.id}
          renderItem={renderDraft}
          style={{ width: '100%', marginBottom: 20 }}
        />
      )}

      <Button title="Cerrar Sesión" color="#dc3545" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666' },
  buttonContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  syncText: { color: '#007bff', fontStyle: 'italic', marginBottom: 10 },
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 20 },
  draftCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  draftTitle: { fontSize: 16, fontWeight: 'bold' },
  draftCategory: { fontSize: 14, color: '#666', marginVertical: 4 },
  draftStatus: { fontSize: 14, color: '#d39e00', fontWeight: 'bold' }
});
