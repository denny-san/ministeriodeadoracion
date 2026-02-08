
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User, CalendarEvent, Song, ServicePlan } from '../types';
import { db } from '../db';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [team, setTeam] = useState<User[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState({
    events: 0,
    rehearsals: 0,
    members: 0,
    songs: 0,
    musicians: 0,
    pending: 0
  });

  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlanTitle, setActivePlanTitle] = useState<string>('');
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Real-time subscriptions
    const unsubUsers = db.subscribeUsers((users) => {
      setTeam(users);
      const musicians = users.filter(u => u.rol === 'Musician');
      const pending = musicians.filter(m => !m.activo); // Using 'activo' as placeholder for verification
      setStats(prev => ({ ...prev, members: users.length, musicians: musicians.length, pending: pending.length }));
    });

    const unsubEvents = db.subscribeEvents((evs) => {
      setEvents(evs);
      const rehearsals = evs.filter(e => e.tipo === 'ensayo').length;
      setStats(prev => ({ ...prev, events: evs.length, rehearsals }));

      // Select active plan (closest upcoming event)
      const today = new Date().toISOString().split('T')[0];
      const upcoming = evs.filter(e => e.fecha >= today).sort((a, b) => a.fecha.localeCompare(b.fecha));
      if (upcoming.length > 0) {
        setActivePlanId(upcoming[0].id);
        setActivePlanTitle(upcoming[0].titulo);
      }
    });

    const unsubSongs = db.subscribeSongs((sngs) => {
      setSongs(sngs);
      setStats(prev => ({ ...prev, songs: sngs.length }));
    });

    // Real-time confirmations subscription
    const unsubConfirmations = db.subscribeConfirmations((confirmationsMap) => {
      const statusMap: Record<string, boolean> = {};
      Object.entries(confirmationsMap).forEach(([key, value]) => {
        statusMap[key] = value.status;
      });
      setConfirmations(statusMap);
    });

    return () => {
      unsubUsers();
      unsubEvents();
      unsubSongs();
      unsubConfirmations();
    };
  }, []);

  const handleVerify = async (userId: string) => {
    const member = team.find(u => u.id === userId);
    if (member) {
      await db.saveUser({ ...member, activo: true });
    }
  };

  const pendingMembers = team.filter(m => !m.activo && m.rol === 'Musician');

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Panel de Líder" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>
      <div className="flex flex-col gap-8 pb-10">

        {/* Welcome Header */}
        <div className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/20 to-transparent"></div>
          <div className="relative z-10">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-3">Administración Central</p>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter italic">Hola, {user?.nombre.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 font-bold italic text-sm md:text-lg opacity-80">Control total y visión del ministerio.</p>
          </div>
        </div>

        {/* Integration Bar (Verified/Pending) */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="size-14 md:size-20 rounded-[24px] md:rounded-[32px] bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-2xl md:!text-4xl text-primary">group_add</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">Integrantes del Ministerio</h3>
              <p className="text-xs md:text-sm font-bold text-slate-400 mt-1 italic">
                <span className="text-primary">{stats.musicians} músicos activos</span> • {stats.pending} perfiles por confirmar
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(AppView.TEAM)}
            className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Gestionar Equipo
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Stats & Pending Members */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Eventos', value: stats.events, icon: 'calendar_month', color: 'text-blue-500' },
                { label: 'Ensayos', value: stats.rehearsals, icon: 'history', color: 'text-amber-500' },
                { label: 'Músicos', value: stats.musicians, icon: 'groups', color: 'text-green-500' },
                { label: 'Canciones', value: stats.songs, icon: 'music_note', color: 'text-purple-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group shrink-0">
                  <div className={`size-10 md:size-12 rounded-xl md:rounded-2xl ${stat.color.replace('text-', 'bg-')}/10 flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-xl md:text-2xl">{stat.icon}</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Verification Queue */}
            {pendingMembers.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-slide-up">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Solicitudes Pendientes</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Nuevos miembros esperando confirmación</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {pendingMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <img src={member.fotoPerfil} className="size-14 rounded-xl border-2 border-white shadow-md object-cover" alt="" />
                        <div>
                          <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{member.nombre}</p>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{member.instrument || 'Sin Instrumento'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(member.id)}
                          className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                          Verificar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Column: Confirmations Breakdown */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16"></div>

              <div className="relative z-10 mb-8">
                <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2 px-1">Control de Asistencia</p>
                <h3 className="text-2xl font-black leading-tight italic">{activePlanTitle || 'Próximo Evento'}</h3>
                <p className="text-slate-400 font-bold text-xs mt-2 opacity-60">Seguimiento de confirmaciones en tiempo real.</p>
              </div>

              <div className="space-y-1 mt-auto">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[40px] font-black leading-none mb-2">
                      {team.filter(m => confirmations[`${activePlanId}_${m.id}`]).length} / {team.filter(u => u.rol === 'Musician').length}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmados hoy</p>
                  </div>
                  <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                  {team.filter(u => u.rol === 'Musician').map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={member.fotoPerfil} className="size-8 rounded-lg object-cover" alt="" />
                        <span className="text-xs font-bold">{member.nombre}</span>
                      </div>
                      <span className={`material-symbols-outlined text-lg ${confirmations[`${activePlanId}_${member.id}`] ? 'text-green-400' : 'text-slate-600'}`}>
                        {confirmations[`${activePlanId}_${member.id}`] ? 'check_circle' : 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
