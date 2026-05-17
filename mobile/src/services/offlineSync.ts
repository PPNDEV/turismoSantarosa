import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const DRAFTS_KEY = '@editor_drafts';

export interface DraftPost {
  id: string;
  category: string;
  imageUri: string | null;
  status: 'draft' | 'pending';
  createdAt: number;
  payload: Record<string, any>;
}

// Guarda un borrador localmente
export const saveDraftLocal = async (draft: DraftPost) => {
  try {
    const drafts = await getLocalDrafts();
    drafts.push(draft);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error saving local draft:', error);
  }
};

// Obtiene todos los borradores locales
export const getLocalDrafts = async (): Promise<DraftPost[]> => {
  try {
    const data = await AsyncStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting local drafts:', error);
    return [];
  }
};

// Elimina un borrador local por ID
export const removeLocalDraft = async (id: string) => {
  try {
    const drafts = await getLocalDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing local draft:', error);
  }
};

// Sube una imagen a Firebase Storage y retorna la URL
const uploadImageToStorage = async (uri: string, filename: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const storageRef = ref(storage, `business_images/${Date.now()}_${filename}`);
  const uploadTask = await uploadBytesResumable(storageRef, blob);
  
  return await getDownloadURL(uploadTask.ref);
};

// Sube el borrador a Firebase
export const publishDraftToFirebase = async (draft: DraftPost, uid: string) => {
  try {
    let imageUrl = null;
    
    // Si el borrador incluye una imagen local, la subimos primero
    if (draft.imageUri) {
      imageUrl = await uploadImageToStorage(draft.imageUri, `photo_${draft.id}.jpg`);
    }

    // Guardamos los datos en Firestore bajo una colección de 'pending_posts' para moderación
    const docRef = await addDoc(collection(db, 'pending_posts'), {
      ...draft.payload, // Spread the exact fields expected by the web app
      category: draft.category,
      imageUrl: imageUrl || draft.payload.imagen || null, // Keep backwards compatibility or use image
      authorUid: uid,
      status: 'pending_approval',
      createdAt: serverTimestamp(),
    });

    // Una vez publicado, lo removemos de los borradores locales
    await removeLocalDraft(draft.id);
    return docRef.id;
  } catch (error) {
    console.error('Error publishing to Firebase:', error);
    throw error;
  }
};

// Sincroniza automáticamente los borradores cuando vuelve el internet
export const syncAllDrafts = async (uid: string) => {
  const drafts = await getLocalDrafts();
  const pendingDrafts = drafts.filter(d => d.status === 'pending');
  
  for (const draft of pendingDrafts) {
    try {
      await publishDraftToFirebase(draft, uid);
    } catch (e) {
      console.log(`Fallo al sincronizar borrador ${draft.id}`, e);
    }
  }
};
