
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
        const q = query(collection(db_fs, "events"), orderBy("fecha", "asc"));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
        });
    },

    saveEvent: async (event: Partial<CalendarEvent>) => {
        if (event.id) {
            await setDoc(doc(db_fs, "events", event.id), {
                ...event,
                timestamp: serverTimestamp()
            }, { merge: true });
        } else {
            await addDoc(collection(db_fs, "events"), {
                ...event,
                timestamp: serverTimestamp()
            });
        }
    },

    deleteEvent: async (id: string) => {
        await deleteDoc(doc(db_fs, "events", id));
    },

    // ---- SONGS ----
    subscribeSongs: (callback: (songs: Song[]) => void) => {
        const q = query(collection(db_fs, "songs"), orderBy("timestamp", "desc"));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
        });
    },

    saveSong: async (song: Partial<Song>) => {
        if (song.id) {
            await setDoc(doc(db_fs, "songs", song.id), {
                ...song,
                timestamp: serverTimestamp()
            }, { merge: true });
        } else {
            await addDoc(collection(db_fs, "songs"), {
                ...song,
                timestamp: serverTimestamp()
            });
        }
    },

    deleteSong: async (id: string) => {
        await deleteDoc(doc(db_fs, "songs", id));
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
        const q = collection(db_fs, "confirmations");
        return onSnapshot(q, (snapshot) => {
            const confirmationsMap: Record<string, any> = {};
            snapshot.docs.forEach(doc => {
                confirmationsMap[doc.id] = doc.data();
            });
            callback(confirmationsMap);
        });
    },

    saveConfirmation: async (eventId: string, userId: string, status: boolean) => {
        const confirmationId = `${eventId}_${userId}`;
        await setDoc(doc(db_fs, "confirmations", confirmationId), {
            eventId,
            userId,
            status,
            timestamp: serverTimestamp()
        });
    },

    getConfirmation: async (eventId: string, userId: string): Promise<boolean> => {
        const confirmationId = `${eventId}_${userId}`;
        const docRef = doc(db_fs, "confirmations", confirmationId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().status : false;
    }
};
