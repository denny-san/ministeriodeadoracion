/**
 * Script para generar datos de prueba en Firestore
 * Uso: npx ts-node scripts/seed-test-data.ts
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAoLjHkXhMWoM9qp540R61gqdvXZ05JSHM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ministerioadoracion-73496.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ministerioadoracion-73496",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ministerioadoracion-73496.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "320525219331",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:320525219331:web:604de89b77f62800548036",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedTestData() {
  try {
    console.log('🌱 Iniciando seed de datos de prueba...\n');

    // 1. Crear usuario Leader
    console.log('👑 Creando usuario Leader...');
    const leaderEmail = 'lider@test.com';
    const leaderPassword = 'Password123!';
    
    let leaderUser;
    try {
      const leaderResult = await createUserWithEmailAndPassword(auth, leaderEmail, leaderPassword);
      leaderUser = leaderResult.user;
      console.log(`✅ Líder creado: ${leaderUser.uid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log('⚠️ Usuario líder ya existe, usando el existente');
        // Para obtener el uid, asumimos que ya existe (búsqueda manual necesaria)
        // Por ahora continuamos sin él
        leaderUser = { uid: 'lider-uid-placeholder' } as any;
      } else {
        throw err;
      }
    }

    // Crear documento del usuario Leader en Firestore
    await setDoc(doc(db, 'users', leaderUser.uid), {
      id: leaderUser.uid,
      nombre: 'Juan Líder',
      usuario: 'juan_lider',
      rol: 'Leader',
      fotoPerfil: 'https://ui-avatars.com/api/?name=Juan+Lider&background=random',
      fechaRegistro: new Date().toISOString(),
      activo: true,
    });
    console.log(`✅ Documento de líder guardado en Firestore\n`);

    // 2. Crear usuario Musician
    console.log('🎵 Creando usuario Musician...');
    const musicianEmail = 'musico@test.com';
    const musicianPassword = 'Password123!';
    
    let musicianUser;
    try {
      const musicianResult = await createUserWithEmailAndPassword(auth, musicianEmail, musicianPassword);
      musicianUser = musicianResult.user;
      console.log(`✅ Músico creado: ${musicianUser.uid}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log('⚠️ Usuario músico ya existe, usando el existente');
        musicianUser = { uid: 'musico-uid-placeholder' } as any;
      } else {
        throw err;
      }
    }

    // Crear documento del usuario Musician en Firestore
    await setDoc(doc(db, 'users', musicianUser.uid), {
      id: musicianUser.uid,
      nombre: 'Carlos Músico',
      usuario: 'carlos_musico',
      rol: 'Musician',
      fotoPerfil: 'https://ui-avatars.com/api/?name=Carlos+Musico&background=random',
      fechaRegistro: new Date().toISOString(),
      activo: true,
      instrument: 'Guitarra',
    });
    console.log(`✅ Documento de músico guardado en Firestore\n`);

    // 3. Crear eventos de prueba
    console.log('📅 Creando eventos de prueba...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const events = [
      {
        titulo: 'Ensayo General',
        fecha: tomorrowStr,
        hora: '19:00',
        tipo: 'ensayo',
        notas: 'Ensayo completo del equipo',
        creadoPor: leaderUser.uid,
      },
      {
        titulo: 'Culto Dominical',
        fecha: nextWeekStr,
        hora: '10:00',
        tipo: 'culto',
        notas: 'Adoración al domingo',
        creadoPor: leaderUser.uid,
      },
    ];

    for (const event of events) {
      await addDoc(collection(db, 'events'), {
        ...event,
        timestamp: serverTimestamp(),
      });
      console.log(`✅ Evento creado: "${event.titulo}" el ${event.fecha}`);
    }
    console.log('');

    // 4. Crear canciones de prueba
    console.log('🎵 Creando canciones de prueba...');
    const songs = [
      {
        nombre: 'Way Maker',
        artista: 'Sinach',
        tonalidad: 'G',
        diaAsignado: 'domingo',
        link: 'https://www.youtube.com/watch?v=example',
        creadoPor: leaderUser.uid,
      },
      {
        nombre: 'Great is Thy Faithfulness',
        artista: 'Thomas Chisholm',
        tonalidad: 'D',
        diaAsignado: 'jueves',
        link: 'https://www.youtube.com/watch?v=example2',
        creadoPor: leaderUser.uid,
      },
    ];

    for (const song of songs) {
      await addDoc(collection(db, 'songs'), {
        ...song,
        timestamp: serverTimestamp(),
      });
      console.log(`✅ Canción creada: "${song.nombre}"`);
    }
    console.log('');

    // 5. Crear notificación de prueba
    console.log('📢 Creando notificación de prueba...');
    await addDoc(collection(db, 'notifications'), {
      tipo: 'crear',
      mensaje: 'Bienvenido al ministerio de adoración 🙌',
      dirigidoA: 'musicos',
      leido: false,
      createdBy: leaderUser.uid,
      timestamp: serverTimestamp(),
    });
    console.log('✅ Notificación creada\n');

    console.log('✨ ¡Seed completado!\n');
    console.log('📝 Credenciales de prueba:');
    console.log(`   Líder: ${leaderEmail} / ${leaderPassword}`);
    console.log(`   Músico: ${musicianEmail} / ${musicianPassword}`);
    console.log('\n💡 Ahora puedes:');
    console.log('   1. Abrir dos ventanas del navegador');
    console.log('   2. Loguear como líder en una');
    console.log('   3. Loguear como músico en la otra');
    console.log('   4. Ver los eventos en tiempo real\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante seed:', error);
    process.exit(1);
  }
}

seedTestData();
