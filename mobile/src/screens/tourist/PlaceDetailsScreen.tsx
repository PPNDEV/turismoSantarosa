import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rating } from 'react-native-ratings';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export default function PlaceDetailsScreen({ route, navigation }: any) {
  const { placeId, title } = route.params || { placeId: 'unknown', title: 'Lugar Desconocido' };
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        placeId,
        placeTitle: title,
        rating,
        comment,
        authorUid: user?.uid || 'anonymous',
        status: 'pending_approval',
        createdAt: serverTimestamp()
      });
      Alert.alert('Enviado', 'Tu reseña ha sido enviada para moderación.');
      setRating(0);
      setComment('');
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar la reseña.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>Aquí iría la descripción completa del lugar descargada desde la base de datos.</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>{t('tourist.add_review') || 'Añadir Reseña'}</Text>
        
        <View style={styles.starsContainer}>
          <Rating
            type="star"
            ratingCount={5}
            imageSize={40}
            startingValue={0}
            onFinishRating={(val: number) => setRating(val)}
            style={{ paddingVertical: 10 }}
          />
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder={t('tourist.comment')}
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
          <Text style={styles.submitBtnText}>{t('tourist.submit')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  desc: { fontSize: 16, color: '#555', marginBottom: 30 },
  reviewSection: { marginTop: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 },
  reviewTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top', backgroundColor: '#fff', marginBottom: 15 },
  submitBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
