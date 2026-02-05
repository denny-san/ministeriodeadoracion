
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAoLjHkXhMWoM9qp540R61gqdvXZ05JSHM",
    authDomain: "ministerioadoracion-73496.firebaseapp.com",
    projectId: "ministerioadoracion-73496",
    storageBucket: "ministerioadoracion-73496.firebasestorage.app",
    messagingSenderId: "320525219331",
    appId: "1:320525219331:web:604de89b77f62800548036",
    measurementId: "G-F0QY7H8XT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db_fs = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
