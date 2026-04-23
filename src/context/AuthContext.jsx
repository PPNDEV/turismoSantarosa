import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AuthContext } from "./auth-context";
import { auth, db, firebaseConfig } from "../services/firebase";

const USERS_PUBLIC_COLLECTION = "usersPublic";
const USERS_PRIVATE_COLLECTION = "usersPrivate";
const USERS_STORAGE_KEY = "visit-santa-rosa-users-v1";
const SESSION_STORAGE_KEY = "visit-santa-rosa-session-v1";
const ROLE_ADMIN = "administrador";
const ROLE_EDITOR = "editor";
const ROLE_VIEWER = "visualizador";

const defaultUsers = [
  {
    uid: "u-admin",
    email: "admin@santarosa.ec",
    password: "admin123",
    displayName: "Administrador",
    role: ROLE_ADMIN,
  },
  {
    uid: "u-editor",
    email: "editor@santarosa.ec",
    password: "editor123",
    displayName: "Editor de Contenidos",
    role: ROLE_EDITOR,
  },
  {
    uid: "u-viewer",
    email: "visualizador@santarosa.ec",
    password: "viewer123",
    displayName: "Visualizador",
    role: ROLE_VIEWER,
  },
];

const fallbackProfiles = defaultUsers.map((profile) => ({
  uid: profile.uid,
  email: profile.email,
  displayName: profile.displayName,
  role: profile.role,
  active: true,
}));

const fallbackPublicProfiles = fallbackProfiles.map((profile) => ({
  uid: profile.uid,
  displayName: profile.displayName,
  role: profile.role,
  active: true,
}));

const fallbackPrivateProfiles = fallbackProfiles.map((profile) => ({
  uid: profile.uid,
  email: profile.email,
}));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRole(role) {
  if (role === ROLE_ADMIN || role === ROLE_EDITOR || role === ROLE_VIEWER) {
    return role;
  }

  return ROLE_VIEWER;
}

function sanitizeProfile(rawProfile) {
  return {
    uid: String(rawProfile?.uid || `u-${Date.now()}`),
    email: String(rawProfile?.email || "")
      .trim()
      .toLowerCase(),
    displayName:
      String(rawProfile?.displayName || "Usuario").trim() || "Usuario",
    role: normalizeRole(rawProfile?.role),
    active: rawProfile?.active !== false,
    deletedAt: rawProfile?.deletedAt || null,
  };
}

function sanitizePublicProfile(rawProfile) {
  return {
    uid: String(rawProfile?.uid || `u-${Date.now()}`),
    displayName:
      String(rawProfile?.displayName || "Usuario").trim() || "Usuario",
    role: normalizeRole(rawProfile?.role),
    active: rawProfile?.active !== false,
  };
}

function sanitizePrivateProfile(rawProfile) {
  return {
    uid: String(rawProfile?.uid || `u-${Date.now()}`),
    email: String(rawProfile?.email || "")
      .trim()
      .toLowerCase(),
    deletedAt: rawProfile?.deletedAt || null,
  };
}

function buildClientProfile(
  publicProfile,
  privateProfile = null,
  fallbackEmail = "",
) {
  return sanitizeProfile({
    uid: publicProfile?.uid,
    displayName: publicProfile?.displayName,
    role: publicProfile?.role,
    active: publicProfile?.active,
    email: privateProfile?.email || fallbackEmail,
    deletedAt: privateProfile?.deletedAt || null,
  });
}

function mergePublicAndPrivateUsers(
  publicUsers,
  privateUsersByUid,
  currentUser,
) {
  return publicUsers
    .map((publicProfile) => {
      const privateProfile = privateUsersByUid.get(publicProfile.uid) || null;
      const ownFallbackEmail =
        currentUser?.uid === publicProfile.uid ? currentUser?.email || "" : "";

      return buildClientProfile(
        publicProfile,
        privateProfile,
        ownFallbackEmail,
      );
    })
    .filter((entry) => entry.active !== false && !entry.deletedAt);
}

function createSessionUser(userAccount, source = "firebase") {
  return {
    uid: userAccount.uid,
    email: String(userAccount?.email || "")
      .trim()
      .toLowerCase(),
    displayName: userAccount.displayName,
    role: normalizeRole(userAccount.role),
    source,
  };
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession);
    if (parsedSession?.source !== "local") {
      return null;
    }

    return createSessionUser(parsedSession, "local");
  } catch {
    return null;
  }
}

function readStoredUsers() {
  if (typeof window === "undefined") {
    return clone(fallbackProfiles);
  }

  try {
    const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!rawUsers) {
      return clone(fallbackProfiles);
    }

    const parsedUsers = JSON.parse(rawUsers);
    if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
      return clone(fallbackProfiles);
    }

    const normalized = parsedUsers
      .map(sanitizeProfile)
      .filter((entry) => entry.uid);
    return normalized.length > 0 ? normalized : clone(fallbackProfiles);
  } catch {
    return clone(fallbackProfiles);
  }
}

function hasAdminRole(currentUser) {
  return currentUser?.role === ROLE_ADMIN;
}

async function createFirebaseAuthUser(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "No se pudo crear el usuario.");
  }

  return payload;
}

async function ensureUserProfile(firebaseUser) {
  const profileRef = doc(db, USERS_PUBLIC_COLLECTION, firebaseUser.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    const publicProfile = sanitizePublicProfile({
      uid: profileSnapshot.id,
      ...profileSnapshot.data(),
    });

    return buildClientProfile(publicProfile, null, firebaseUser.email || "");
  }

  const seededProfile =
    defaultUsers.find(
      (entry) =>
        entry.email.toLowerCase() === firebaseUser.email?.toLowerCase(),
    ) || null;

  const nextProfile = sanitizePublicProfile({
    uid: firebaseUser.uid,
    displayName:
      firebaseUser.displayName || seededProfile?.displayName || "Usuario",
    role: seededProfile?.role || ROLE_VIEWER,
    active: true,
  });

  await setDoc(
    profileRef,
    {
      ...nextProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return buildClientProfile(nextProfile, null, firebaseUser.email || "");
}

async function ensureOwnPrivateProfileIfAdmin(firebaseUser, role) {
  if (normalizeRole(role) !== ROLE_ADMIN) {
    return;
  }

  const normalizedEmail = String(firebaseUser?.email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return;
  }

  await setDoc(
    doc(db, USERS_PRIVATE_COLLECTION, firebaseUser.uid),
    {
      email: normalizedEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function persistLocalSession(nextUser) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!nextUser) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
  } catch {
    // Ignorar fallos de almacenamiento local.
  }
}

function persistLocalUsers(nextUsers) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  } catch {
    // Ignorar fallos de almacenamiento local.
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => readStoredUsers());
  const [user, setUser] = useState(() => readStoredSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    persistLocalUsers(users);
  }, [users]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.source === "local") {
      return;
    }

    if (user.role === ROLE_ADMIN) {
      const usersPublicRef = collection(db, USERS_PUBLIC_COLLECTION);
      const usersPrivateRef = collection(db, USERS_PRIVATE_COLLECTION);

      let publicUsers = [];
      let privateUsersByUid = new Map();

      const syncUsersState = () => {
        const nextUsers = mergePublicAndPrivateUsers(
          publicUsers,
          privateUsersByUid,
          user,
        );

        if (nextUsers.length === 0) {
          setUsers([]);
          return;
        }

        setUsers(nextUsers);

        const currentProfile = nextUsers.find(
          (entry) => entry.uid === user.uid,
        );
        if (currentProfile) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  displayName: currentProfile.displayName,
                  role: currentProfile.role,
                }
              : prev,
          );
        }
      };

      const unsubscribePublic = onSnapshot(
        usersPublicRef,
        async (snapshot) => {
          if (snapshot.empty) {
            const seedPublicProfiles = clone(fallbackPublicProfiles);
            publicUsers = seedPublicProfiles;
            syncUsersState();

            try {
              await Promise.all([
                ...seedPublicProfiles.map((profile) =>
                  setDoc(
                    doc(db, USERS_PUBLIC_COLLECTION, profile.uid),
                    {
                      ...profile,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true },
                  ),
                ),
                ...fallbackPrivateProfiles.map((profile) =>
                  setDoc(
                    doc(db, USERS_PRIVATE_COLLECTION, profile.uid),
                    {
                      ...profile,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true },
                  ),
                ),
              ]);
            } catch {
              // Si Firestore no responde, conservamos el respaldo local.
            }

            return;
          }

          publicUsers = snapshot.docs.map((entry) =>
            sanitizePublicProfile({ uid: entry.id, ...entry.data() }),
          );
          syncUsersState();
        },
        () => {
          setUsers(clone(fallbackProfiles));
        },
      );

      const unsubscribePrivate = onSnapshot(
        usersPrivateRef,
        (snapshot) => {
          privateUsersByUid = new Map(
            snapshot.docs.map((entry) => {
              const privateProfile = sanitizePrivateProfile({
                uid: entry.id,
                ...entry.data(),
              });
              return [privateProfile.uid, privateProfile];
            }),
          );
          syncUsersState();
        },
        () => {
          privateUsersByUid = new Map();
          syncUsersState();
        },
      );

      return () => {
        unsubscribePublic();
        unsubscribePrivate();
      };
    }

    const ownUserRef = doc(db, USERS_PUBLIC_COLLECTION, user.uid);
    const unsubscribe = onSnapshot(
      ownUserRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          const ownFallback = sanitizeProfile(user);
          setUsers([ownFallback]);
          return;
        }

        const ownPublicProfile = sanitizePublicProfile({
          uid: snapshot.id,
          ...snapshot.data(),
        });
        const ownProfile = buildClientProfile(
          ownPublicProfile,
          null,
          user.email,
        );
        if (ownProfile.active === false || ownProfile.deletedAt) {
          setUsers([]);
          return;
        }

        setUsers([ownProfile]);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                displayName: ownProfile.displayName,
                role: ownProfile.role,
              }
            : prev,
        );
      },
      () => {
        const ownFallback = sanitizeProfile(user);
        setUsers([ownFallback]);
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsers(clone(fallbackProfiles));
        setUser((currentUser) =>
          currentUser?.source === "local" ? currentUser : null,
        );
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserProfile(firebaseUser);
        await ensureOwnPrivateProfileIfAdmin(firebaseUser, profile.role);

        if (profile.active === false || profile.deletedAt) {
          await signOut(auth);
          setUser(null);
          setAuthReady(true);
          return;
        }

        const sessionUser = createSessionUser(profile, "firebase");
        setUser(sessionUser);
        persistLocalSession(null);
      } catch {
        await signOut(auth);
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const safePassword = String(password || "");

    if (!normalizedEmail || !safePassword) {
      throw new Error("Por favor completa todos los campos");
    }

    // Primero intentar con fallback local (más rápido y confiable)
    const fallbackAccount = defaultUsers.find(
      (entry) =>
        entry.email.toLowerCase() === normalizedEmail &&
        entry.password === safePassword,
    );

    if (!fallbackAccount) {
      throw new Error(
        "Credenciales incorrectas. Verifica tu email y contraseña.",
      );
    }

    try {
      // Intentar con Firebase Auth si está disponible
      if (auth && normalizedEmail) {
        const credential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          safePassword,
        );
        const profile = await ensureUserProfile(credential.user);
        await ensureOwnPrivateProfileIfAdmin(credential.user, profile.role);

        if (profile.active === false || profile.deletedAt) {
          await signOut(auth);
          throw new Error("Usuario inactivo en Firebase");
        }

        const sessionUser = createSessionUser(profile, "firebase");
        setUser(sessionUser);
        persistLocalSession(null);
        return sessionUser;
      }
    } catch (firebaseError) {
      // Si Firebase falla, usar el fallback local
      console.warn(
        "Firebase Auth no disponible, usando credenciales locales",
        firebaseError,
      );
    }

    // Usar fallback local
    const localSession = createSessionUser(fallbackAccount, "local");
    setUser(localSession);
    setUsers(clone(fallbackProfiles));
    persistLocalSession(localSession);
    return localSession;
  };

  const logout = async () => {
    persistLocalSession(null);
    setUsers(clone(fallbackProfiles));
    setUser(null);

    try {
      await signOut(auth);
    } catch {
      // Ignorar fallos de cierre de sesión para no bloquear la UI.
    }
  };

  const createUser = async ({ email, password, displayName, role }) => {
    if (!hasAdminRole(user)) {
      throw new Error("No tienes permisos para crear usuarios.");
    }

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const safePassword = String(password || "").trim();
    const safeName = String(displayName || "").trim();

    if (!normalizedEmail || !safePassword || !safeName) {
      throw new Error("Completa nombre, correo y contraseña.");
    }

    if (
      users.some(
        (entry) =>
          entry.email &&
          entry.email.toLowerCase() === normalizedEmail.toLowerCase(),
      )
    ) {
      throw new Error("Ya existe un usuario con ese correo.");
    }

    const authResult = await createFirebaseAuthUser(
      normalizedEmail,
      safePassword,
    );

    const nextPublicUser = sanitizePublicProfile({
      uid: authResult.localId,
      displayName: safeName,
      role,
      active: true,
    });

    const nextPrivateUser = sanitizePrivateProfile({
      uid: authResult.localId,
      email: normalizedEmail,
    });

    await Promise.all([
      setDoc(
        doc(db, USERS_PUBLIC_COLLECTION, nextPublicUser.uid),
        {
          ...nextPublicUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      setDoc(
        doc(db, USERS_PRIVATE_COLLECTION, nextPrivateUser.uid),
        {
          ...nextPrivateUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);

    const nextUser = buildClientProfile(nextPublicUser, nextPrivateUser);

    setUsers((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.uid === nextUser.uid,
      );
      if (existingIndex === -1) {
        return [...prev, nextUser];
      }

      const nextUsers = [...prev];
      nextUsers[existingIndex] = nextUser;
      return nextUsers;
    });

    return nextUser;
  };

  const updateUserRole = async (uid, role) => {
    if (!hasAdminRole(user)) {
      throw new Error("No tienes permisos para actualizar roles.");
    }

    const nextRole = normalizeRole(role);
    await updateDoc(doc(db, USERS_PUBLIC_COLLECTION, uid), {
      role: nextRole,
      active: true,
      updatedAt: serverTimestamp(),
    });

    setUsers((prev) =>
      prev.map((entry) =>
        entry.uid === uid ? { ...entry, role: nextRole, active: true } : entry,
      ),
    );

    if (uid === user?.uid) {
      setUser((prev) => (prev ? { ...prev, role: nextRole } : prev));
    }
  };

  const deleteUser = async (uid) => {
    if (!hasAdminRole(user)) {
      throw new Error("No tienes permisos para eliminar usuarios.");
    }

    if (uid === user?.uid) {
      throw new Error("No puedes eliminar tu propio usuario activo.");
    }

    const targetUser = users.find((entry) => entry.uid === uid);
    const adminUsers = users.filter(
      (entry) => entry.role === ROLE_ADMIN && entry.active !== false,
    );

    if (targetUser?.role === ROLE_ADMIN && adminUsers.length <= 1) {
      throw new Error("Debe existir al menos un usuario administrador.");
    }

    await updateDoc(doc(db, USERS_PUBLIC_COLLECTION, uid), {
      active: false,
      updatedAt: serverTimestamp(),
    });

    try {
      await updateDoc(doc(db, USERS_PRIVATE_COLLECTION, uid), {
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Si no existe perfil privado, el estado inactivo queda marcado en usersPublic.
    }

    setUsers((prev) => prev.filter((entry) => entry.uid !== uid));
  };

  const canEditContent =
    user?.role === ROLE_ADMIN || user?.role === ROLE_EDITOR;
  const canManageUsers = user?.role === ROLE_ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        createUser,
        updateUserRole,
        deleteUser,
        canEditContent,
        canManageUsers,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
