import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { Ionicons } from '@expo/vector-icons';
import { rtdb, functions } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export default function GenericAdminScreen({ route, navigation }: any) {
  const { nodeKey, title, fields } = route.params;
  const { user } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formPayload, setFormPayload] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title });

    const nodeRef = ref(rtdb, `content/${nodeKey}`);
    const unsub = onValue(nodeRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setItems([]);
      } else {
        const arr = Object.entries(val).map(([id, data]: any) => ({
          ...data,
          id,
        }));
        setItems(arr);
      }
      setLoading(false);
    }, (error) => {
      console.warn(`RTDB listener error for content/${nodeKey}:`, error);
      setLoading(false);
    });

    return () => unsub();
  }, [nodeKey, title, navigation]);

  const openNew = () => {
    setEditingItem(null);
    setFormPayload({});
    setModalVisible(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormPayload({ ...item });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirmar', '¿Eliminar este elemento permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            const adminDeleteContent = httpsCallable(functions, 'adminDeleteContent');
            await adminDeleteContent({ nodeKey, id });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar');
          }
      }}
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const id = editingItem?.id || `m_${Date.now()}`;
      const adminUpsertContent = httpsCallable(functions, 'adminUpsertContent');
      
      await adminUpsertContent({ 
        nodeKey, 
        itemData: { ...formPayload },
        id 
      });
      
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre || item.cooperativa || item.titulo || 'Sin Título'}</Text>
        <Text style={styles.cardSub}>{item.isla || item.ruta || item.fecha || ''}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.itemCount}>Total: {items.length}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNew}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay elementos registrados.</Text>}
        />
      )}

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingItem ? 'Editar' : 'Nuevo'} {title}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {(fields as string[]).map(field => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{field}</Text>
                <TextInput
                  style={styles.input}
                  value={formPayload[field] || ''}
                  onChangeText={(val) => setFormPayload(prev => ({ ...prev, [field]: val }))}
                  multiline={field === 'descripcion' || field === 'servicios'}
                />
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { backgroundColor: '#a5d8ad' }]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
            <View style={{height: 40}} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  itemCount: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  addBtn: { backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 8, elevation: 1 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#666', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 10, marginLeft: 5, backgroundColor: '#f8f9fa', borderRadius: 8 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontStyle: 'italic' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5, textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
