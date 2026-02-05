
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User, CalendarEvent } from '../types';
import { useNotifications } from '../context/NotificationsContext';
import { db } from '../db';

interface CalendarProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const EVENT_TYPES = ['ensayo', 'culto', 'actividad'] as const;

const Calendar: React.FC<CalendarProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { triggerNotification } = useNotifications();

  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [todayStr, setTodayStr] = useState(getTodayStr());

  useEffect(() => {
    const unsub = db.subscribeEvents((evs) => {
      setEvents(evs);
    });
    
    const timer = setInterval(() => setTodayStr(getTodayStr()), 60000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    titulo: '',
    hora: '19:00',
    tipo: 'ensayo',
    notas: ''
  });

  const isLeader = user?.rol === 'Leader';

  const handleDayClick = (dateStr: string) => {
    if (!isLeader) return;
    setSelectedDate(dateStr);
    setSelectedEvent(null);
    setEventForm({ titulo: '', hora: '19:00', tipo: 'ensayo', notas: '' });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedEvent(item);
    setSelectedDate(item.fecha);
    setEventForm(item);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titulo || !selectedDate) return;

    const eventToSave: Partial<CalendarEvent> = {
      ...eventForm,
      id: selectedEvent?.id,
      fecha: selectedDate,
      creadoPor: user?.id || 'Sistema'
    };

    await db.saveEvent(eventToSave);
    triggerNotification(
      selectedEvent ? 'editar' : 'crear',
      `Evento "${eventToSave.titulo}" listo para el ${eventToSave.fecha}.`,
      'musicos'
    );

    setIsModalOpen(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!isLeader) return;
    if (confirm(`¿Eliminar definitivamente este evento?`)) {
      await db.deleteEvent(id);
      setIsModalOpen(false);
      triggerNotification('eliminar', `Un evento ha sido cancelado.`, 'musicos');
    }
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="min-h-[80px] md:h-32 border border-slate-50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/10"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.fecha === dateStr);
        const isToday = dateStr === todayStr;

        days.push(
            <div
                key={day}
                onClick={() => handleDayClick(dateStr)}
                className={`min-h-[80px] md:h-32 border border-slate-100 dark:border-slate-800 p-1.5 transition-all cursor-pointer relative overflow-hidden group ${isToday ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
                {isToday && <div className="absolute inset-0 border-2 border-primary pointer-events-none"></div>}
                <div className="flex justify-between items-start mb-0.5">
                    <span className={`size-6 md:size-7 flex items-center justify-center rounded-lg text-[10px] md:text-xs font-black transition-colors ${isToday ? 'bg-primary text-white' : 'text-slate-400 group-hover:text-primary'}`}>
                        {day}
                    </span>
                    {isToday && <span className="text-[7px] font-black text-primary uppercase tracking-tighter hidden md:block">HOY</span>}
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-24px)] no-scrollbar">
                    {dayEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event)}
                            className={`text-[8px] md:text-[9px] p-1 md:p-2 rounded-lg md:rounded-xl truncate font-black shadow-lg hover:scale-[1.03] transition-transform border-l-2 md:border-l-4 ${event.tipo === 'culto' ? 'bg-amber-400 text-white border-amber-600' :
                                event.tipo === 'ensayo' ? 'bg-primary text-white border-primary-light' :
                                    'bg-slate-500 text-white border-slate-700'
                                }`}
                        >
                            <span className="truncate uppercase">{event.titulo}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return days;
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <Layout activeView={AppView.CALENDAR} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Calendario Global" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 md:gap-6">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic text-slate-900 dark:text-white">{monthNames[currentDate.getMonth()]}</h1>
            <span className="text-2xl md:text-5xl font-black opacity-20 tracking-tighter text-primary">{currentDate.getFullYear()}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
              <span className="material-symbols-outlined !text-xs md:!text-sm text-primary">schedule</span>
              <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest">{todayStr}</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {events.length} Actividades Programadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1.5 md:p-2 rounded-2xl md:rounded-[24px] shadow-2xl border border-white/5 w-fit">
          <button onClick={handlePrevMonth} className="size-10 md:size-12 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-primary transition-all active:scale-90">
            <span className="material-symbols-outlined">west</span>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 md:px-8 py-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all">HOY</button>
          <button onClick={handleNextMonth} className="size-10 md:size-12 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-primary transition-all active:scale-90">
            <span className="material-symbols-outlined">east</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border-4 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="grid grid-cols-7 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="py-6 text-center text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 bg-slate-100 dark:bg-slate-800">
          {renderDays()}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/90 backdrop-blur-2xl animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[48px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in border border-white/10 relative">

            <div className="p-6 md:p-12 pb-4">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 size-10 md:size-14 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:scale-110 active:scale-90 shadow-xl">
                <span className="material-symbols-outlined !text-xl md:!text-3xl">close</span>
              </button>
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight italic tracking-tighter">
                {selectedDate?.split('-')[2]} <span className="text-slate-300 not-italic font-normal">/</span> {monthNames[parseInt(selectedDate?.split('-')[1] || '1') - 1]}
              </h3>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 md:p-12 pt-0 space-y-4 md:space-y-8">
              <div className="space-y-1 md:space-y-2">
                <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 md:ml-6">Título de la Actividad</label>
                <input required className="w-full px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[32px] bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm md:text-base font-bold transition-all outline-none shadow-inner" value={eventForm.titulo} onChange={(e) => setEventForm({ ...eventForm, titulo: e.target.value })} placeholder="Ej. Culto de Avivamiento" />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 md:ml-6">Hora</label>
                  <input type="time" className="w-full px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[32px] bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-sm md:text-base font-bold outline-none shadow-inner" value={eventForm.hora} onChange={(e) => setEventForm({ ...eventForm, hora: e.target.value })} />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 md:ml-6">Tipo</label>
                  <select className="w-full px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[32px] bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-sm md:text-base font-bold outline-none appearance-none cursor-pointer shadow-inner" value={eventForm.tipo} onChange={(e) => setEventForm({ ...eventForm, tipo: e.target.value as any })}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 md:ml-6">Detalles Adicionales</label>
                <textarea className="w-full px-6 md:px-10 py-4 md:py-6 rounded-3xl md:rounded-[40px] bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm md:text-base font-bold transition-all resize-none outline-none shadow-inner" rows={3} value={eventForm.notas || ''} onChange={(e) => setEventForm({ ...eventForm, notas: e.target.value })} placeholder="Instrucciones para el equipo..." />
              </div>

              <div className="pt-4 md:pt-8 flex gap-3 md:gap-6">
                {selectedEvent && (
                  <button type="button" onClick={() => handleDeleteEvent(selectedEvent.id)} className="size-14 md:size-20 flex items-center justify-center rounded-2xl md:rounded-[32px] bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl group">
                    <span className="material-symbols-outlined !text-xl md:!text-3xl">delete</span>
                  </button>
                )}
                <button type="submit" className="flex-1 py-4 md:py-6 bg-primary text-white rounded-2xl md:rounded-[32px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all">
                  {selectedEvent ? 'GUARDAR CAMBIOS' : 'CONFIRMAR ACTIVIDAD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Calendar;
