import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Rating } from 'react-native-ratings';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTourismContent } from '../../context/TourismContentContext';
import { moduleConfigs, TourismItem } from '../../services/tourismContent';
import { isFavorite as checkFavorite, toggleFavorite } from '../../services/touristFavorites';

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#0891b2" />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PlaceDetailsScreen({ route }: any) {
  const { type, id, title } = route.params || {};
  const { items, findItem, findById } = useTourismContent();
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const item = useMemo<TourismItem | undefined>(() => {
    if (type && id) return findItem(type, id);
    if (id) return findById(id);
    return items.find((entry) => entry.title === title);
  }, [findById, findItem, id, items, title, type]);

  useEffect(() => {
    if (!item) return;
    checkFavorite(item).then(setFavorite).catch(() => undefined);
  }, [item]);

  if (!item) {
    return (
      <View style={styles.empty}>
        <Ionicons name="alert-circle-outline" size={42} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Lugar no encontrado</Text>
        <Text style={styles.emptyText}>El contenido puede no estar sincronizado todavía o el QR no coincide con un registro publicado.</Text>
      </View>
    );
  }

  const config = moduleConfigs[item.type];

  const handleFavorite = async () => {
    const result = await toggleFavorite(item);
    setFavorite(result.isFavorite);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Calificación pendiente', 'Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        placeId: item.id,
        placeType: item.type,
        placeTitle: item.title,
        rating,
        comment: comment.trim(),
        authorUid: user?.uid || 'anonymous-visitor',
        authorEmail: user?.email || null,
        status: 'pending_approval',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Reseña enviada', 'Tu opinión quedó pendiente de aprobación por el administrador.');
      setRating(0);
      setComment('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la reseña. Intenta nuevamente cuando tengas conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${config.color}1A` }]}>
            <Ionicons name={config.icon as any} size={16} color={config.color} />
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? '#dc2626' : '#64748b'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.quickDetails}>
          <DetailRow icon="location-outline" label="Ubicación" value={item.location || item.island} />
          <DetailRow icon="call-outline" label="Contacto" value={item.contact} />
          <DetailRow icon="time-outline" label="Horario/Frecuencia" value={item.schedule} />
          <DetailRow icon="cash-outline" label="Tarifa referencial" value={item.price} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ficha turística</Text>
          {item.details.map((detail) => (
            <View key={`${detail.label}-${detail.value}`} style={styles.infoPill}>
              <Text style={styles.infoLabel}>{detail.label}</Text>
              <Text style={styles.infoValue}>{detail.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu experiencia</Text>
          <Text style={styles.sectionText}>
            Las reseñas se envían a moderación antes de hacerse públicas, como indica el flujo de calidad del GAD.
          </Text>
          <View style={styles.ratingWrap}>
            <Rating
              type="star"
              ratingCount={5}
              imageSize={34}
              startingValue={rating}
              onFinishRating={(value: number) => setRating(value)}
              style={styles.rating}
            />
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Cuéntanos qué te pareció este lugar"
            placeholderTextColor="#94a3b8"
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={submitReview} disabled={submitting}>
            <Ionicons name="send-outline" size={18} color="#ffffff" />
            <Text style={styles.submitButtonText}>{submitting ? 'Enviando...' : 'Enviar reseña'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingBottom: 28 },
  image: { width: '100%', height: 250, backgroundColor: '#e2e8f0' },
  body: { padding: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  typeBadgeText: { fontWeight: '900', fontSize: 13 },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { color: '#0f172a', fontSize: 28, lineHeight: 34, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#0891b2', fontWeight: '800', marginBottom: 12 },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  quickDetails: { marginTop: 18, gap: 10 },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  detailTextWrap: { flex: 1 },
  detailLabel: { color: '#64748b', fontWeight: '800', fontSize: 12, marginBottom: 2 },
  detailValue: { color: '#0f172a', fontWeight: '700', lineHeight: 19 },
  section: { marginTop: 24 },
  sectionTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  sectionText: { color: '#64748b', lineHeight: 20, marginBottom: 12 },
  infoPill: {
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  infoLabel: { color: '#64748b', fontSize: 12, fontWeight: '900', marginBottom: 3 },
  infoValue: { color: '#0f172a', fontWeight: '700', lineHeight: 19 },
  ratingWrap: { alignItems: 'center', marginBottom: 12 },
  rating: { paddingVertical: 4 },
  commentInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#f8fafc' },
  emptyTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
