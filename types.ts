
export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  SONGS = 'SONGS',
  TEAM = 'TEAM',
  MUSICIAN_VIEW = 'MUSICIAN_VIEW',
  NOTICES = 'NOTICES'
}

export interface User {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'Leader' | 'Musician';
  fotoPerfil: string;
  fechaRegistro: string;
  activo: boolean;
  instrument?: string; // Optional, kept for UI compatibility
  email?: string; // Optional, for auth identification
  password?: string; // Optional, for auth
}

export interface CalendarEvent {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  tipo: 'ensayo' | 'culto' | 'actividad';
  notas?: string;
  songIds?: string[]; // IDs of songs for this event
  creadoPor: string;
  timestamp: any; // Firestore serverTimestamp
}

export interface Song {
  id: string;
  nombre: string; // Song title
  artista: string;
  tonalidad: string;
  link?: string;
  url?: string; // Alternative property name for link
  diaAsignado?: 'jueves' | 'domingo';
  titulo?: string; // Alternative property name for nombre (for compatibility)
  genero?: string; // Alternative property
  musicosAsignados?: string[]; // Array of user IDs
  creadoPor: string;
  timestamp: any;
}

export interface MinistryNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'Leadership' | 'Music Team' | 'Community' | 'General';
  isPinned?: boolean;
}

export interface MinistryNotification {
  id: string;
  tipo: 'crear' | 'editar' | 'eliminar';
  mensaje: string;
  dirigidoA: 'musicos' | 'lideres';
  leido: boolean;
  timestamp: any;
}

// Backward compatibility interfaces if needed for now
export interface ServicePlan {
  id: string;
  date: string;
  time?: string;
  title: string;
  songs: any[];
}
