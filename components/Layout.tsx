
import React, { useState, useRef, useEffect } from 'react';
import { AppView, User } from '../types';
import { useNotifications } from '../context/NotificationsContext';
import { db } from '../db';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  title: string;
  onUpdateAvatar?: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, onLogout, user, title, onUpdateAvatar, onUpdateUser }) => {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState(user?.nombre || '');
  const [editInstrument, setEditInstrument] = useState(user?.instrument || '');

  const instruments = ['Voz', 'Piano', 'Batería', 'Bajo', 'Guitarra', 'Saxofón', 'Coros', 'Director', 'Liderazgo'];

  useEffect(() => {
    if (user) {
      setEditName(user.nombre);
      setEditInstrument(user.instrument || '');
    }
  }, [user]);

  const isLeader = user?.rol === 'Leader' || (user?.rol as string)?.toLowerCase() === 'lider';

  const handleLogout = () => {
    onLogout();
  };

  const handleDeleteAccount = () => {
    if (confirm('¿Estás seguro de que deseas borrar tu cuenta? Esta acción no se puede deshacer.')) {
      alert('Cuenta eliminada con éxito.');
      handleLogout();
    }
  };

  const handleResetSystem = () => {
    if (!isLeader) return;
    const confirm1 = confirm('¡ADVERTENCIA CRÍTICA!\n\nEstás a punto de borrar TODO el sistema (Eventos, Canciones, Miembros).');
    if (confirm1) {
      const confirm2 = confirm('¿ESTÁS REALMENTE SEGURO?\n\nEsta acción eliminará todos los datos del ministerio permanentemente.');
      if (confirm2) {
        localStorage.clear();
        alert('Sistema reiniciado. Todos los datos han sido eliminados.');
        window.location.reload();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn("⚠️ No file selected");
      return;
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    if (!onUpdateAvatar) {
      console.error("❌ onUpdateAvatar no disponible");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        console.log("📸 Foto convertida a base64, subiendo...");
        await onUpdateAvatar(base64String);
        console.log("✅ Foto de perfil actualizada exitosamente");
        // Limpiar el input para permitir seleccionar la misma foto nuevamente
        e.target.value = '';
      } catch (error) {
        console.error("❌ Error procesando foto:", error);
        alert(`Error al procesar la foto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      console.error("❌ Error leyendo archivo");
      alert('Error al leer la imagen');
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({ nombre: editName, instrument: editInstrument });
      setIsEditingProfile(false);
      alert('Perfil actualizado con éxito');
    }
  };

  const menuItems = [
    { id: AppView.DASHBOARD, icon: 'dashboard', label: 'Dashboard', roles: ['Leader', 'Admin'] },
    { id: AppView.CALENDAR, icon: 'calendar_month', label: 'Calendario', roles: ['Leader', 'Musician', 'Admin'] },
    { id: AppView.SONGS, icon: 'history', label: 'Ensayos', roles: ['Leader', 'Admin'] },
    { id: AppView.TEAM, icon: 'groups', label: 'Músicos', roles: ['Leader', 'Musician', 'Admin'] },
    { id: AppView.NOTICES, icon: 'notifications', label: 'Noticias', roles: ['Leader', 'Musician', 'Admin'] },
    { id: AppView.MUSICIAN_VIEW, icon: 'person', label: 'Mi Agenda', roles: ['Musician'] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-navy-dark flex-col justify-between p-6 shrink-0 border-r border-navy-dark/10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-accent-gold/20 rounded-lg p-2 flex items-center justify-center text-accent-gold">
              <span className="material-symbols-outlined text-3xl">church</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-tight">M. Adoración</h1>
              <p className="text-slate-400 text-xs font-medium">Portal de Gestión</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems
              .filter(item => user && item.roles.includes(user.rol))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${activeView === item.id
                    ? 'bg-primary/20 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className={`material-symbols-outlined ${activeView === item.id ? 'text-accent-gold' : 'text-slate-500'} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                </button>
              ))}
          </nav>
        </div>

        {isLeader && (
          <button
            onClick={() => onNavigate(AppView.CALENDAR)}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Nuevo Evento</span>
          </button>
        )}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`lg:hidden fixed inset-0 z-[100] flex transition-opacity duration-300 ${showMobileSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}></div>
        <aside className={`relative w-72 h-full bg-navy-dark flex flex-col justify-between p-6 transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent-gold/20 rounded-lg p-2 flex items-center justify-center text-accent-gold">
                  <span className="material-symbols-outlined text-2xl">church</span>
                </div>
                <h1 className="text-white text-base font-bold">M. Adoración</h1>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {menuItems
                .filter(item => user && item.roles.includes(user.rol))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setShowMobileSidebar(false); }}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${activeView === item.id
                      ? 'bg-primary text-white shadow-xl'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className={`material-symbols-outlined ${activeView === item.id ? 'text-white' : 'text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  </button>
                ))}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 mt-10 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
        {/* Top Navbar */}
        <header className="flex items-center justify-between sticky top-0 z-[60] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-slate-900 dark:text-white text-lg md:text-xl font-extrabold tracking-tight truncate max-w-[150px] md:max-w-none">{title}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="hidden md:relative md:block w-48 lg:w-72 h-10">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full h-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 shadow-inner"
                placeholder="Buscar..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                className={`p-2 md:p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
              >
                <span className="material-symbols-outlined !text-xl md:!text-2xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                )}
              </button>

              {/* Profile Button */}
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setIsEditingProfile(false); }}
                className={`h-9 w-9 md:h-11 md:w-11 rounded-xl border-2 shadow-sm overflow-hidden hover:ring-4 hover:ring-primary/10 transition-all ${showProfileMenu ? 'ring-4 ring-primary/20 border-primary' : 'border-white dark:border-slate-800'}`}
              >
                <img key={user?.fotoPerfil} className="w-full h-full object-cover" src={user?.fotoPerfil || "https://picsum.photos/seed/user/100/100"} alt="User Profile" />
              </button>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden z-[70] animate-scale-in origin-top-right">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Notificaciones</h3>
                    <span className="text-[10px] bg-primary text-white px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">{unreadCount} nuevas</span>
                  </div>
                  <div className="max-h-[70vh] md:max-h-96 overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center text-slate-300">
                        <span className="material-symbols-outlined !text-6xl opacity-20 mb-4 text-slate-500">notifications_off</span>
                        <p className="font-black uppercase tracking-widest text-[10px]">Sin novedades</p>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const date = n.timestamp?.toDate ? n.timestamp.toDate() : (typeof n.timestamp === 'string' ? new Date(n.timestamp) : new Date());

                        // Map tipo to type for icon display
                        const notifType = n.tipo === 'crear' ? 'success' : n.tipo === 'eliminar' ? 'warning' : 'info';

                        return (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-5 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!n.leido ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex gap-4">
                              <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notifType === 'success' ? 'bg-green-500 text-white' :
                                notifType === 'warning' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                <span className="material-symbols-outlined !text-xl">
                                  {notifType === 'success' ? 'check_circle' : notifType === 'warning' ? 'error' : 'info'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${!n.leido ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-500 dark:text-slate-400'}`}>
                                  {n.tipo === 'crear' ? 'Nuevo elemento creado' : n.tipo === 'editar' ? 'Elemento actualizado' : 'Elemento eliminado'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.mensaje}</p>
                                <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-tighter opacity-60">
                                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden z-[70] animate-scale-in origin-top-right">
                  {!isEditingProfile ? (
                    <>
                      <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative size-20 mx-auto mb-4">
                          <img key={user?.fotoPerfil} src={user?.fotoPerfil} className="size-full rounded-[24px] object-cover shadow-2xl ring-4 ring-white dark:ring-slate-800" alt="Avatar" />
                          <button onClick={triggerFileUpload} className="absolute -right-2 -bottom-2 size-9 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                            <span className="material-symbols-outlined !text-xl">photo_camera</span>
                          </button>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{user?.nombre}</h4>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-2 inline-block px-3 py-1 bg-primary/10 rounded-full">{user?.instrument || user?.rol}</p>
                      </div>
                      <div className="p-3 space-y-1">
                        <button onClick={() => setIsEditingProfile(true)} className="w-full flex items-center gap-4 px-4 py-3.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">
                          <span className="material-symbols-outlined text-primary">person</span> Mi Información
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">
                          <span className="material-symbols-outlined text-slate-400">logout</span> Cerrar Sesión
                        </button>
                        <div className="h-px bg-slate-50 dark:bg-slate-800 my-2 mx-4"></div>
                        <button onClick={handleDeleteAccount} className="w-full flex items-center gap-4 px-4 py-3.5 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-[0.2em]">
                          <span className="material-symbols-outlined !text-lg">person_remove</span> Borrar Cuenta
                        </button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="p-8 space-y-5 animate-slide-left">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editar Perfil</h4>
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                        <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrumento</label>
                        <select value={editInstrument} onChange={(e) => setEditInstrument(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                          {instruments.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                        </select>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atrás</button>
                        <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Guardar</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
