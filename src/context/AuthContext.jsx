import { useCallback, useEffect, useRef, useState } from "react";
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
    disabled: rawProfile?.disabled === true,
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

function mergeAuthPublicAndPrivateUsers(
  authUsers,
  publicUsers,
  privateUsersByUid,
  currentUser,
) {
  const publicByUid = new Map(publicUsers.map((entry) => [entry.uid, entry]));
  const authByUid = new Map(authUsers.map((entry) => [entry.uid, entry]));
  const allUids = new Set([...publicByUid.keys(), ...authByUid.keys()]);

  return Array.from(allUids)
    .map((uid) => {
      const authProfile = authByUid.get(uid) || {};
      const publicProfile = publicByUid.get(uid) || {};
      const privateProfile = privateUsersByUid.get(uid) || {};
      const ownPrimaryEmail = currentUser?.uid === uid ? currentUser.email : "";

      return sanitizeProfile({
        uid,
        email: authProfile.email || privateProfile.email || ownPrimaryEmail,
        displayName:
          publicProfile.displayName ||
          authProfile.displayName ||
          authProfile.email,
        role: publicProfile.role || authProfile.role,
        active:
          typeof publicProfile.active === "boolean"
            ? publicProfile.active
            : authProfile.active !== false,
        disabled: authProfile.disabled === true,
        deletedAt:
          privateProfile.deletedAt ||
          publicProfile.deletedAt ||
          authProfile.deletedAt ||
          null,
      });
    })
    .sort((a, b) => {
      const left = a.email || a.displayName || "";
      const right = b.email || b.displayName || "";
      return left.localeCompare(right);
    });
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

function isPermissionDenied(error) {
  return (
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied" ||
    String(error?.message || "")
      .toLowerCase()
      .includes("insufficient permissions")
  );
}

function hasFirebaseAuthConfig() {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.authDomain);
}

// Traduce los errores crudos de Firebase Auth a mensajes claros para el usuario.
// Evita exponer textos como "Firebase: Error (auth/invalid-credential)".
function friendlyAuthError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.";
    case "auth/invalid-email":
      return "El correo electrónico no tiene un formato válido.";
    case "auth/missing-password":
      return "Ingresa tu contraseña para continuar.";
    case "auth/user-disabled":
      return "Esta cuenta está deshabilitada. Contacta al administrador.";
    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
    default:
      break;
  }

  if (message.includes("Usuario inactivo")) {
    return "Tu cuenta está inactiva o pendiente de aprobación. Contacta al administrador.";
  }
  if (code.startsWith("auth/")) {
    return "No se pudo iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.";
  }

  // Mensajes propios ya legibles (p. ej. configuración faltante) se conservan.
  return message || "No se pudo iniciar sesión. Inténtalo de nuevo.";
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

async function syncRoleClaim(firebaseUser, profileRole) {
  // Solo admin/editor necesitan el custom claim para las reglas de Firestore.
  if (profileRole !== ROLE_ADMIN && profileRole !== ROLE_EDITOR) {
    return;
  }

  try {
    const tokenResult = await firebaseUser.getIdTokenResult();
    if (tokenResult?.claims?.role === profileRole) {
      return; // el token ya tiene el claim correcto
    }

    const sincronizarMiRol = httpsCallable(functions, "sincronizarMiRol");
    await sincronizarMiRol();
    // Refresca el token para que el nuevo claim esté disponible de inmediato.
    await firebaseUser.getIdToken(true);
  } catch (error) {
    // No bloquea el login: si falla, la sesión sigue con el token actual.
    console.warn(
      "No se pudo sincronizar el rol del token:",
      error?.message || error,
    );
  }
}

async function ensureOwnPrivateProfileIfAdmin(firebaseUser, role) {
  if (normalizeRole(role) !== ROLE_ADMIN) {
    return;
  }

  const tokenResult = await firebaseUser.getIdTokenResult().catch(() => null);
  if (tokenResult?.claims?.role !== ROLE_ADMIN) {
    return;
  }

  const normalizedEmail = String(firebaseUser?.email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return;
  }

  // Best-effort: en el primer login del admin el custom claim `role` aún no
  // existe, por lo que la regla `isAdmin()` deniega esta escritura. No debe
  // bloquear el inicio de sesión: el perfil privado es solo para auditoría.
  try {
    await setDoc(
      doc(db, USERS_PRIVATE_COLLECTION, firebaseUser.uid),
      {
        email: normalizedEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    if (isPermissionDenied(error)) {
      return;
    }

    console.warn(
      "No se pudo registrar el perfil privado del admin (no bloquea el login):",
      error?.message || error,
    );
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  // authReady: ya sabemos si hay sesión. profileReady: ya se resolvió el rol
  // real (no el provisional), para no mostrar pantallas según un rol a medias.
  const [profileReady, setProfileReady] = useState(false);

  // Fuentes de datos de la lista de usuarios (solo admin). Se guardan en refs
  // para poder recombinarlas tanto desde los snapshots en vivo como desde una
  // recarga manual (refreshUsers) sin volver a suscribirse.
  const userRef = useRef(null);
  const authUsersRef = useRef([]);
  const publicUsersRef = useRef([]);
  const privateUsersByUidRef = useRef(new Map());

  // Mantiene una referencia al usuario actual para que refreshUsers() (llamado
  // desde componentes hijos) siempre lea el rol vigente sin recrearse.
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const recomputeAdminUsers = useCallback((activeUser) => {
    if (!activeUser || activeUser.role !== ROLE_ADMIN) {
      return;
    }

    const nextUsers = mergeAuthPublicAndPrivateUsers(
      authUsersRef.current,
      publicUsersRef.current,
      privateUsersByUidRef.current,
      activeUser,
    );

    if (nextUsers.length === 0) {
      setUsers([]);
      return;
    }

    setUsers(nextUsers);

    const currentProfile = nextUsers.find(
      (entry) => entry.uid === activeUser.uid,
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
  }, []);

  // Recarga la lista autoritativa de usuarios desde Cloud Functions (Admin SDK).
  // Esta vía valida el rol contra usersPublic, así que funciona aunque el custom
  // claim del admin no esté sincronizado o las reglas bloqueen el listado en
  // vivo. Se usa al abrir "Usuarios" y tras aprobar un editor, de modo que las
  // cuentas recién creadas/aprobadas aparezcan siempre.
  const refreshUsers = useCallback(async () => {
    const activeUser = userRef.current;
    if (!activeUser || activeUser.role !== ROLE_ADMIN) {
      return;
    }

    try {
      const adminListUsers = httpsCallable(functions, "adminListUsers");
      const result = await adminListUsers();
      authUsersRef.current = Array.isArray(result?.data?.users)
        ? result.data.users.map(sanitizeProfile)
        : [];
      recomputeAdminUsers(activeUser);
    } catch (error) {
      console.warn("No se pudieron cargar usuarios de Firebase Auth:", error);
    }
  }, [recomputeAdminUsers]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === ROLE_ADMIN) {
      const usersPublicRef = collection(db, USERS_PUBLIC_COLLECTION);
      const usersPrivateRef = collection(db, USERS_PRIVATE_COLLECTION);

      void refreshUsers();

      const unsubscribePublic = onSnapshot(
        usersPublicRef,
        (snapshot) => {
          publicUsersRef.current = snapshot.docs.map((entry) =>
            sanitizePublicProfile({ uid: entry.id, ...entry.data() }),
          );
          recomputeAdminUsers(user);
        },
        () => {
          // Si el listado en vivo falla (p. ej. claim no sincronizado), no se
          // vacía la lista: se conserva lo cargado por refreshUsers().
          publicUsersRef.current = [];
          recomputeAdminUsers(user);
        },
      );

      const unsubscribePrivate = onSnapshot(
        usersPrivateRef,
        (snapshot) => {
          privateUsersByUidRef.current = new Map(
            snapshot.docs.map((entry) => {
              const privateProfile = sanitizePrivateProfile({
                uid: entry.id,
                ...entry.data(),
              });
              return [privateProfile.uid, privateProfile];
            }),
          );
          recomputeAdminUsers(user);
        },
        () => {
          privateUsersByUidRef.current = new Map();
          recomputeAdminUsers(user);
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
  }, [user, refreshUsers, recomputeAdminUsers]);

  const hydrateFirebaseSession = async (firebaseUser) => {
    const profile = await ensureUserProfile(firebaseUser);

    // Sincroniza el custom claim `role` con usersPublic y refresca el token,
    // para que las reglas isAdmin()/canEditContent() funcionen (resuelve el
    // arranque del admin semilla, con rol en Firestore pero no en el token).
    await syncRoleClaim(firebaseUser, profile.role);

    // Fire-and-forget: el perfil privado es solo para auditoría y su escritura
    // puede ser denegada o quedar pendiente hasta que el admin tenga el custom
    // claim. No debe bloquear (ni colgar) el inicio de sesión.
    void ensureOwnPrivateProfileIfAdmin(firebaseUser, profile.role);

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
        setProfileReady(true);
        return;
      }

      setUser(createProvisionalSessionUser(firebaseUser));
      setAuthReady(true);
      setProfileReady(false);

      void hydrateFirebaseSession(firebaseUser)
        .then((sessionUser) => {
          setUser(sessionUser);
        })
        .catch(async () => {
          await signOut(auth);
          setUser(null);
        })
        .finally(() => {
          setProfileReady(true);
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
      setProfileReady(false);

      const hydratedUser = await hydrateFirebaseSession(credential.user);
      setUser(hydratedUser);
      setProfileReady(true);
      return hydratedUser;
    } catch (error) {
      try {
        await signOut(auth);
      } catch {
        // Ignorar si el cierre de sesión falla tras un intento de login.
      }
      setUser(null);
      setProfileReady(true);
      throw new Error(friendlyAuthError(error));
    }
  };

  const logout = async () => {
    setUsers([]);
    setUser(null);
    authUsersRef.current = [];
    publicUsersRef.current = [];
    privateUsersByUidRef.current = new Map();

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
        refreshUsers,
        canEditContent,
        canManageUsers,
        authReady,
        profileReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
