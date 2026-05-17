import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

type Role = 'administrador' | 'editor' | 'visualizador' | 'unverified';

interface UserProfile {
  uid: string;
  email: string | null;
  role: Role;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        if (!firebaseUser.emailVerified) {
          // Si no está verificado, forzamos el estado unverified
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'unverified' as any,
          });
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'usersPublic', firebaseUser.uid));
        
        // Evitar race condition si el usuario fue deslogueado mientras getDoc estaba en progreso
        if (auth.currentUser?.uid !== firebaseUser.uid) return;

        const role = userDoc.exists() ? userDoc.data().role : 'visualizador';
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role as Role,
        });
      } catch (error) {
        console.warn('Error fetching user role:', error);
        
        if (auth.currentUser?.uid !== firebaseUser.uid) return;

        // Fallback for visualizador if network fails
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'visualizador',
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
