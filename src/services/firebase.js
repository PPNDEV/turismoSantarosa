import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "turismosantarosa.firebaseapp.com",
  projectId: "turismosantarosa",
  storageBucket: "turismosantarosa.firebasestorage.app",
  messagingSenderId: "1014596518675",
  appId: "1:1014596518675:web:6db4600e74471980add0e6",
  measurementId: "G-G4ZHEF4FNC",
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics, firebaseConfig };

export default app;
