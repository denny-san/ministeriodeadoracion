
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    onSnapshot,
    orderBy,
    limit,
    where,
    serverTimestamp,
    addDoc
} from "firebase/firestore";
import {
    ref,
    uploadString,
    getDownloadURL
} from "firebase/storage";
import { db_fs, auth, storage } from "./firebase";
import { User, CalendarEvent, Song, MinistryNotification } from "./types";

export const db = {
    // ---- USERS ----
    getUsers: async (): Promise<User[]> => {
        if (!db_fs) return [];
        try {
            const q = collection(db_fs, "users");
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as User);
        } catch (error) {
            console.error("Firestore Error in getUsers:", error);
            return [];
        }
    },

    subscribeUsers: (callback: (users: User[]) => void) => {
        const q = collection(db_fs, "users");
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data() as User));
        });
    },

    saveUser: async (user: User) => {
        await setDoc(doc(db_fs, "users", user.id), {
            ...user,
            activo: user.activo ?? true,
            fechaRegistro: user.fechaRegistro || new Date().toISOString()
        });
    },

    deleteUser: async (id: string) => {
        await deleteDoc(doc(db_fs, "users", id));
    },

    // ---- EVENTS ----
    subscribeEvents: (callback: (events: CalendarEvent[]) => void) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en subscribeEvents");
            return () => { };
        }
        try {
            const q = query(collection(db_fs, "events"), orderBy("fecha", "asc"));
            return onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
            });
        } catch (error) {
            console.error("❌ Error en subscribeEvents:", error);
            return () => { };
        }
    },

    saveEvent: async (event: Partial<CalendarEvent>) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en saveEvent");
            alert("Error: No se pudo conectar a la base de datos. Verifica tu conexión.");
            return;
        }
        try {
            console.log("💾 Guardando evento:", event);
            if (event.id) {
                await setDoc(doc(db_fs, "events", event.id), {
                    ...event,
                    timestamp: serverTimestamp()
                }, { merge: true });
                console.log("✅ Evento actualizado:", event.id);
            } else {
                const docRef = await addDoc(collection(db_fs, "events"), {
                    ...event,
                    timestamp: serverTimestamp()
                });
                console.log("✅ Evento creado con ID:", docRef.id);
            }
        } catch (error) {
            console.error("❌ Error guardando evento:", error);
            alert("Error al guardar el evento. Por favor intenta de nuevo.");
        }
    },

    deleteEvent: async (id: string) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en deleteEvent");
            return;
        }
        try {
            await deleteDoc(doc(db_fs, "events", id));
            console.log("✅ Evento eliminado:", id);
        } catch (error) {
            console.error("❌ Error eliminando evento:", error);
        }
    },

    // ---- SONGS ----
    subscribeSongs: (callback: (songs: Song[]) => void) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en subscribeSongs");
            return () => { };
        }
        try {
            const q = query(collection(db_fs, "songs"), orderBy("timestamp", "desc"));
            return onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
            });
        } catch (error) {
            console.error("❌ Error en subscribeSongs:", error);
            return () => { };
        }
    },

    saveSong: async (song: Partial<Song>) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en saveSong");
            return;
        }
        try {
            console.log("💾 Guardando canción:", song);
            if (song.id) {
                await setDoc(doc(db_fs, "songs", song.id), {
                    ...song,
                    timestamp: serverTimestamp()
                }, { merge: true });
                console.log("✅ Canción actualizada:", song.id);
            } else {
                const docRef = await addDoc(collection(db_fs, "songs"), {
                    ...song,
                    timestamp: serverTimestamp()
                });
                console.log("✅ Canción creada con ID:", docRef.id);
            }
        } catch (error) {
            console.error("❌ Error guardando canción:", error);
            alert("Error al guardar la canción. Por favor intenta de nuevo.");
        }
    },

    deleteSong: async (id: string) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en deleteSong");
            return;
        }
        try {
            await deleteDoc(doc(db_fs, "songs", id));
            console.log("✅ Canción eliminada:", id);
        } catch (error) {
            console.error("❌ Error eliminando canción:", error);
        }
    },

    // ---- NOTIFICATIONS ----
    subscribeNotifications: (callback: (notifications: MinistryNotification[]) => void) => {
        const q = query(collection(db_fs, "notifications"), orderBy("timestamp", "desc"), limit(50));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryNotification)));
        });
    },

    saveNotification: async (notification: Partial<MinistryNotification>) => {
        await addDoc(collection(db_fs, "notifications"), {
            ...notification,
            leido: false,
            timestamp: serverTimestamp()
        });
    },

    markNotificationAsRead: async (id: string) => {
        await setDoc(doc(db_fs, "notifications", id), { leido: true }, { merge: true });
    },

    // ---- STORAGE ----
    uploadProfilePhoto: async (userId: string, base64: string): Promise<string> => {
        const storageRef = ref(storage, `users/${userId}/photo.jpg`);
        await uploadString(storageRef, base64, 'data_url');
        const url = await getDownloadURL(storageRef);
        return url;
    },

    // ---- CONFIRMATIONS (Real-time) ----
    subscribeConfirmations: (callback: (confirmations: Record<string, any>) => void) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en subscribeConfirmations");
            return () => { };
        }
        try {
            const q = collection(db_fs, "confirmations");
            return onSnapshot(q, (snapshot) => {
                const confirmationsMap: Record<string, any> = {};
                snapshot.docs.forEach(doc => {
                    confirmationsMap[doc.id] = doc.data();
                });
                callback(confirmationsMap);
            });
        } catch (error) {
            console.error("❌ Error en subscribeConfirmations:", error);
            return () => { };
        }
    },

    saveConfirmation: async (eventId: string, userId: string, status: boolean) => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en saveConfirmation");
            return;
        }
        try {
            const confirmationId = `${eventId}_${userId}`;
            console.log("💾 Guardando confirmación:", { eventId, userId, status });
            await setDoc(doc(db_fs, "confirmations", confirmationId), {
                eventId,
                userId,
                status,
                timestamp: serverTimestamp()
            });
            console.log("✅ Confirmación guardada:", confirmationId);
        } catch (error) {
            console.error("❌ Error guardando confirmación:", error);
        }
    },

    getConfirmation: async (eventId: string, userId: string): Promise<boolean> => {
        if (!db_fs) {
            console.error("❌ Firestore no inicializado en getConfirmation");
            return false;
        }
        try {
            const confirmationId = `${eventId}_${userId}`;
            const docRef = doc(db_fs, "confirmations", confirmationId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data().status : false;
        } catch (error) {
            console.error("❌ Error obteniendo confirmación:", error);
            return false;
        }
    }
};
