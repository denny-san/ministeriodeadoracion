
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration using environment variables
const env = (import.meta as any).env || {};

const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const isClient = typeof window !== 'undefined';

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
