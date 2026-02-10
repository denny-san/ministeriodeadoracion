
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration using Vite env vars (VITE_*) with fallbacks
const env = (import.meta as any).env || {};

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAoLjHkXhMWoM9qp540R61gqdvXZ05JSHM",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ministerioadoracion-73496.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ministerioadoracion-73496",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ministerioadoracion-73496.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "320525219331",
    appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:320525219331:web:604de89b77f62800548036",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F0QY7H8XT4"
};

const isClient = typeof window !== 'undefined';

if (isClient) {
    if (env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.log("✅ Firebase: Usando variables de entorno (VITE_ o NEXT_PUBLIC_)." );
    } else {
        console.warn("⚠️ Firebase: Variables de entorno no detectadas, usando configuración de respaldo.");
    }
}

let app: FirebaseApp | null = null;
let db_fs: Firestore = null as any;
let auth: Auth = null as any;
let storage: FirebaseStorage = null as any;

if (isClient) {
    console.log("🔥 Firebase: Intentando inicializar en el cliente...");
    try {
        if (!firebaseConfig.apiKey) {
            console.warn("⚠️ Firebase: NEXT_PUBLIC_FIREBASE_API_KEY no está definido.");
        } else {
            app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            db_fs = getFirestore(app);
            auth = getAuth(app);
            storage = getStorage(app);
            console.log("✅ Firebase: Inicializado correctamente.");
        }
    } catch (error) {
        console.error("❌ Firebase: Error durante la inicialización:", error);
    }
}

export { app, db_fs, auth, storage };
export default app;
