const admin = require("firebase-admin");

// Reemplazar con el UID del usuario que quieres hacer administrador.
// Puedes pasar el UID como argumento de línea de comandos: node set-admin-claim.js <TU_UID>
const uid = process.argv[2];

if (!uid) {
  console.error("Por favor provee el UID del usuario como argumento.");
  console.error("Ejemplo: node set-admin-claim.js u-1712345678901");
  process.exit(1);
}

// Inicializa Firebase Admin
// Opcion 1: Si tienes el archivo de clave de servicio descargado de la consola de Firebase:
// (Ajustes del proyecto -> Cuentas de servicio -> Generar nueva clave privada)
// Guarda el archivo como 'serviceAccountKey.json' en la carpeta 'functions'
try {
  const serviceAccount = require("./serviceAccountKey.json");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  // Opcion 2: Si estas usando el emulador local, asegúrate de tener seteadas las variables
  // set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
  // set GCLOUD_PROJECT=tu_proyecto
  console.log("No se encontró serviceAccountKey.json. Intentando conectar usando variables de entorno o emulador...");
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

async function setAdminClaim() {
  try {
    console.log(`Asignando claim de administrador al usuario con UID: ${uid}...`);
    await admin.auth().setCustomUserClaims(uid, { role: "administrador" });
    
    // Verificamos si se inyectó correctamente leyendo el usuario
    const user = await admin.auth().getUser(uid);
    console.log("Claims actuales del usuario:", user.customClaims);
    console.log("¡Éxito! El claim de 'administrador' ha sido asignado.");
  } catch (error) {
    console.error("Error al asignar el claim:", error);
  } finally {
    process.exit(0);
  }
}

setAdminClaim();
