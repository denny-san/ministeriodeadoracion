
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is already initialized to avoid errors during HMR
// and ensure we are only running on the client (browser)
const isClient = typeof window !== 'undefined';

if (isClient) {
    console.log("🔥 Firebase: Inicializando en el cliente...");
    if (!firebaseConfig.apiKey) {
        console.error("❌ Firebase: Las variables de entorno NEXT_PUBLIC_ no están configuradas correctamente.");
    }
}

const app = isClient
    ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
    : null as any;

// Initialize Services (Only if app is available)
export const db_fs = isClient ? getFirestore(app) : null as any;
export const auth = isClient ? getAuth(app) : null as any;
export const storage = isClient ? getStorage(app) : null as any;

export default app;
