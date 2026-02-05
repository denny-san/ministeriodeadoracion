
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User, CalendarEvent, Song } from '../types';
import { db } from '../db';
import { useNotifications } from '../context/NotificationsContext';

interface MusicianViewProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const MusicianView: React.FC<MusicianViewProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const { triggerNotification } = useNotifications();

  useEffect(() => {
    const unsubEvents = db.subscribeEvents((evs) => {
      setEvents(evs);
    });

    const unsubSongs = db.subscribeSongs((sngs) => {
      setSongs(sngs);
    });

    setConfirmations(db.getConfirmations());

    return () => {
      unsubEvents();
      unsubSongs();
    };
  }, []);

  const handleConfirm = (eventId: string) => {
    const userId = user?.id || '';
    const currentStatus = confirmations[`${eventId}_${userId}`] || false;
    const newStatus = !currentStatus;

    const updated = db.saveConfirmation(eventId, userId, newStatus);
    setConfirmations(updated);

    if (newStatus) {
      triggerNotification('crear', `${user?.nombre} ha confirmado su asistencia.`, 'lideres');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.fecha >= today).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const activeEvent = upcomingEvents[0];

  return (
    <Layout activeView={AppView.MUSICIAN_VIEW} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Mi Agenda" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>
      <div className="flex flex-col gap-8 pb-10">

        {!user?.activo && (
          <div className="bg-amber-500 text-white p-4 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">pending_actions</span>
              <p className="text-xs font-black uppercase tracking-widest">Tu perfil está pendiente de verificación por un administrador.</p>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/20 to-transparent"></div>
          <div className="relative z-10">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-3">Panel del Músico</p>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter italic">Bendiciones, {user?.nombre.split(' ')[0]} 🙌</h1>
            <p className="text-slate-400 font-bold italic text-sm md:text-lg opacity-80">Excelencia en cada nota para el Señor.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeEvent ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">Próximo Evento</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">{activeEvent.titulo}</p>
                  </div>
                  <button
                    onClick={() => handleConfirm(activeEvent.id)}
                    className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${confirmations[`${activeEvent.id}_${user?.id}`] ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                  >
                    {confirmations[`${activeEvent.id}_${user?.id}`] ? 'CONFIRMADO' : 'CONFIRMAR ASISTENCIA'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary mb-2">calendar_month</span>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Fecha</p>
                    <p className="text-lg font-black dark:text-white mt-1">{activeEvent.fecha}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Hora</p>
                    <p className="text-lg font-black dark:text-white mt-1">{activeEvent.hora}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary mb-2">info</span>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Tipo</p>
                    <p className="text-lg font-black dark:text-white mt-1 uppercase">{activeEvent.tipo}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] text-center opacity-30">
                <span className="material-symbols-outlined !text-6xl">event_busy</span>
                <p className="text-xl font-black uppercase tracking-tighter mt-4 italic">No hay eventos próximos</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <img src={user?.fotoPerfil} className="size-24 rounded-[32px] object-cover mb-4 border-4 border-white/10 shadow-2xl" alt="" />
                <h3 className="text-xl font-black">{user?.nombre}</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-primary mt-1">{user?.rol}</p>
                <div className="w-full h-px bg-white/5 my-6"></div>
                <p className="text-center text-xs text-slate-400 italic font-medium leading-relaxed">
                  "Alabadle a son de bocina; alabadle con salterio y arpa." <br /> — Salmos 150:3
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MusicianView;
