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
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { AuthContext } from "./auth-context";
import { auth, db, functions, firebaseConfig } from "../services/firebase";
import { httpsCallable } from "firebase/functions";

const USERS_PUBLIC_COLLECTION = "usersPublic";
const USERS_PRIVATE_COLLECTION = "usersPrivate";
const ROLE_ADMIN = "administrador";
const ROLE_EDITOR = "editor";
const ROLE_VIEWER = "visualizador";
const ROLE_SEED_BY_EMAIL = {
  "admin@santarosa.ec": ROLE_ADMIN,
  "editor@santarosa.ec": ROLE_EDITOR,
};

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
  primaryEmail = "",
) {
  return sanitizeProfile({
    uid: publicProfile?.uid,
    displayName: publicProfile?.displayName,
    role: publicProfile?.role,
    active: publicProfile?.active,
    email: privateProfile?.email || primaryEmail,
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
      const ownPrimaryEmail =
        currentUser?.uid === publicProfile.uid ? currentUser?.email || "" : "";

      return buildClientProfile(publicProfile, privateProfile, ownPrimaryEmail);
    })
    .filter((entry) => entry.active !== false && !entry.deletedAt);
}

function createSessionUser(userAccount) {
  return {
    uid: userAccount.uid,
    email: String(userAccount?.email || "")
      .trim()
      .toLowerCase(),
    displayName: userAccount.displayName,
    role: normalizeRole(userAccount.role),
  };
}

function hasAdminRole(currentUser) {
  return currentUser?.role === ROLE_ADMIN;
}

function hasFirebaseAuthConfig() {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.authDomain);
}

// La creación de usuarios por REST se reemplazó por adminCreateUser en Cloud Functions

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

  const normalizedEmail = String(firebaseUser.email || "")
    .trim()
    .toLowerCase();
  const roleFromEmail = ROLE_SEED_BY_EMAIL[normalizedEmail] || ROLE_VIEWER;

  const nextProfile = sanitizePublicProfile({
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || "Usuario",
    role: roleFromEmail,
    active: true,
  });

  const { uid: _ignoredUid, ...publicProfileForWrite } = nextProfile;

  await setDoc(
    profileRef,
    {
      ...publicProfileForWrite,
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

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === ROLE_ADMIN) {
      const usersPublicRef = query(
        collection(db, USERS_PUBLIC_COLLECTION),
        where("active", "==", true),
      );
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
            prev &&
            (prev.displayName !== currentProfile.displayName ||
              prev.role !== currentProfile.role)
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
        (snapshot) => {
          publicUsers = snapshot.docs.map((entry) =>
            sanitizePublicProfile({ uid: entry.id, ...entry.data() }),
          );
          syncUsersState();
        },
        () => {
          setUsers([]);
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
          setUsers([]);
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
          prev &&
          (prev.displayName !== ownProfile.displayName ||
            prev.role !== ownProfile.role)
            ? {
                ...prev,
                displayName: ownProfile.displayName,
                role: ownProfile.role,
              }
            : prev,
        );
      },
      () => {
        setUsers([]);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const hydrateFirebaseSession = async (firebaseUser) => {
    const profile = await ensureUserProfile(firebaseUser);
    await ensureOwnPrivateProfileIfAdmin(firebaseUser, profile.role);

    if (profile.active === false || profile.deletedAt) {
      await signOut(auth);
      throw new Error("Usuario inactivo en Firebase");
    }

    return createSessionUser(profile);
  };

  const createProvisionalSessionUser = (firebaseUser) =>
    createSessionUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || "Usuario",
      role: ROLE_VIEWER,
    });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsers([]);
        setUser(null);
        setAuthReady(true);
        return;
      }

      setUser(createProvisionalSessionUser(firebaseUser));
      setAuthReady(true);

      void hydrateFirebaseSession(firebaseUser)
        .then((sessionUser) => {
          setUser(sessionUser);
        })
        .catch(async () => {
          await signOut(auth);
          setUser(null);
        });
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

    if (!hasFirebaseAuthConfig()) {
      throw new Error(
        "Firebase Auth no está configurado. Revisa variables VITE_FIREBASE_* en tu .env.",
      );
    }

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        safePassword,
      );
      const provisionalSessionUser = createProvisionalSessionUser(
        credential.user,
      );
      setUser(provisionalSessionUser);
      setAuthReady(true);

      const hydratedUser = await hydrateFirebaseSession(credential.user);
      setUser(hydratedUser);
      return hydratedUser;
    } catch (error) {
      try {
        await signOut(auth);
      } catch {
        // Ignorar si el cierre de sesión falla tras un intento de login.
      }
      setUser(null);
      throw new Error(
        error?.message ||
          "No se pudo iniciar sesión con Firebase. Verifica credenciales, reglas y configuración del proyecto.",
      );
    }
  };

  const logout = async () => {
    setUsers([]);
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
    const normalizedDisplayName = String(displayName || "").trim();
    const normalizedRole = normalizeRole(role);

    if (
      users.some(
        (entry) => entry.email && entry.email.toLowerCase() === normalizedEmail,
      )
    ) {
      throw new Error("Ya existe un usuario con ese correo.");
    }

    try {
      const adminCreateUser = httpsCallable(functions, "adminCreateUser");
      const result = await adminCreateUser({
        email: normalizedEmail,
        password,
        displayName: normalizedDisplayName,
        role: normalizedRole,
      });
      const createdUserData =
        result?.data?.user ||
        (result?.data?.uid
          ? {
              uid: result.data.uid,
              email: normalizedEmail,
              displayName: normalizedDisplayName,
              role: normalizedRole,
              active: true,
            }
          : null);

      if (createdUserData) {
        const createdUser = sanitizeProfile(createdUserData);
        setUsers((currentUsers) => {
          if (currentUsers.some((entry) => entry.uid === createdUser.uid)) {
            return currentUsers;
          }

          return [...currentUsers, createdUser];
        });
      }
    } catch (error) {
      throw new Error(
        error?.message || "Error al crear el usuario en el backend.",
      );
    }
  };

  const updateUserRole = async (uid, role) => {
    if (!hasAdminRole(user)) {
      throw new Error("No tienes permisos para actualizar roles.");
    }

    try {
      const asignarRol = httpsCallable(functions, "asignarRol");
      await asignarRol({ targetUid: uid, newRole: role });

      // Forzar el refresco del token local para obtener el nuevo custom claim
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
      throw new Error(error?.message || "Error al actualizar el rol.");
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

    try {
      const adminDeleteUser = httpsCallable(functions, "adminDeleteUser");
      await adminDeleteUser({ uid });
    } catch (error) {
      throw new Error(error?.message || "Error al eliminar el usuario.");
    }
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
