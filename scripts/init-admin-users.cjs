/**
 * Script de Inicialización de Usuarios Administrativos
 *
 * Crea los usuarios por defecto en Firestore:
 * - admin@santarosa.ec (administrador)
 * - editor@santarosa.ec (editor)
 * - visualizador@santarosa.ec (visualizador)
 *
 * Ejecutar: node scripts/init-admin-users.js
 */

const admin = require("firebase-admin");

// Inicializar Admin SDK
admin.initializeApp();
const db = admin.firestore();

const USERS = [
  {
    email: "admin@santarosa.ec",
    displayName: "Administrador Principal",
    role: "administrador",
    password: "admin123", // Solo para referencia - el password real se maneja con Firebase Auth
  },
  {
    email: "editor@santarosa.ec",
    displayName: "Editor de Contenido",
    role: "editor",
    password: "editor123",
  },
  {
    email: "visualizador@santarosa.ec",
    displayName: "Visualizador",
    role: "visualizador",
    password: "viewer123",
  },
];

async function createUserInFirestore(userData) {
  const { email, displayName, role } = userData;

  // Generar UID basado en email (para consistencia)
  const uid = `admin-${email.split("@")[0]}`;

  // Documento público
  const publicDoc = {
    displayName,
    role,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Documento privado
  const privateDoc = {
    email: email.toLowerCase().trim(),
    deletedAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Escribir en Firestore
  await db.collection("usersPublic").doc(uid).set(publicDoc);
  await db.collection("usersPrivate").doc(uid).set(privateDoc);

  console.log(`  ✅ ${email} (${role})`);
}

async function main() {
  console.log("👥 Inicializando usuarios administrativos en Firestore...\n");

  for (const user of USERS) {
    try {
      await createUserInFirestore(user);
    } catch (error) {
      console.error(`  ❌ Error con ${user.email}:`, error.message);
    }
  }

  console.log("\n🎉 Usuarios inicializados correctamente!");
  console.log(
    "\n📝 Nota: Los passwords deben configurarse manualmente en Firebase Auth:",
  );
  console.log("   1. Ve a Firebase Console > Authentication > Users");
  console.log("   2. Agrega usuario con email y password");
  console.log(
    "   3. Usa el UID correspondiente (admin-admin, admin-editor, admin-visualizador)",
  );
  console.log(
    "\n   O usa las credenciales de fallback local que ya funcionan en el login.",
  );

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
