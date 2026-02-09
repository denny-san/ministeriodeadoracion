
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User, MinistryNotification } from '../types';
import { db } from '../db';
import { useNotifications } from '../context/NotificationsContext';

interface NoticesProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const Notices: React.FC<NoticesProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [notifs, setNotifs] = useState<MinistryNotification[]>([]);
  const { markAsRead } = useNotifications();

  useEffect(() => {
    const unsub = db.subscribeNotifications((data) => {
      setNotifs(data);
    });
    return () => unsub();
  }, []);

  const isLeader = user?.rol === 'Leader';

  return (
    <Layout activeView={AppView.NOTICES} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Muro de Actividad" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3 px-1">Historial del Ministerio</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-3 italic text-slate-900 dark:text-white leading-tight">Actividad Reciente</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg font-bold italic leading-relaxed">
            Monitorea los cambios realizados en el sistema en tiempo real.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {notifs.length === 0 ? (
          <div className="py-20 text-center opacity-30 select-none">
            <span className="material-symbols-outlined !text-8xl">notifications_off</span>
            <p className="font-black uppercase tracking-tighter mt-4 text-xl italic">No hay actividad reciente</p>
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            className={`flex gap-6 p-6 rounded-[32px] border transition-all ${n.leido ? 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800' : 'bg-primary/5 border-primary shadow-xl shadow-primary/5'}`}
          >
            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${n.tipo === 'crear' ? 'bg-green-500 text-white' : n.tipo === 'editar' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>
              <span className="material-symbols-outlined !text-xl">{n.tipo === 'crear' ? 'add_circle' : n.tipo === 'editar' ? 'edit' : 'delete'}</span>
            </div>
            <div className="flex-1" onClick={() => markAsRead(n.id)}>
              <p className={`text-sm md:text-lg font-bold dark:text-white ${!n.leido ? 'font-black' : ''}`}>{n.mensaje}</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 italic flex items-center gap-2">
                <span className="material-symbols-outlined !text-xs">schedule</span>
                {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleString() : 'Reciente'}
              </p>
            </div>
            {isLeader && (
              <div className="flex items-start gap-2">
                <button onClick={async () => {
                  if (confirm('¿Eliminar esta noticia permanentemente?')) {
                    await db.deleteNotification(n.id);
                  }
                }} className="size-10 rounded-xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Notices;
