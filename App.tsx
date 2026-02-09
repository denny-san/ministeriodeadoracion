
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Songs from './pages/Songs';
import Team from './pages/Team';
import MusicianView from './pages/MusicianView';
import Notices from './pages/Notices';
import { NotificationsProvider } from './context/NotificationsContext';
import { db } from './db';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Force client-side rendering only after mount
  useEffect(() => {
    setHasMounted(true);
    console.log("📱 App: Montada en el cliente.");

    // Check if configuration is missing (both env and fallback)
    const env = (import.meta as any).env || {};
    if (!env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.warn("⚠️ Nota: NEXT_PUBLIC_FIREBASE_API_KEY no detectada. Usando respaldo de emergencia.");
    }
  }, []);

  // Initialize session from Firebase Auth
  useEffect(() => {
    if (!hasMounted) return;

    if (!auth) {
      console.error("❌ Auth: El objeto 'auth' no está disponible.");
      setInitError("Firebase Auth no pudo ser inicializado. Verifica las variables de entorno NEXT_PUBLIC_.");
      setIsInitialized(true);
      return;
    }

    console.log("🔐 App: Iniciando escucha de autenticación...");
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      console.log("👤 Auth State Changed:", fbUser ? `Usuario ${fbUser.uid} detectado` : "Sin usuario");

      if (fbUser) {
        try {
          // Fetch user metadata from Firestore
          const users = await db.getUsers();
          let userData = users.find(u => u.id === fbUser.uid);

          if (!userData) {
            console.warn("⚠️ Usuario no encontrado en Firestore, usando fallback.");
            userData = {
              id: fbUser.uid,
              nombre: fbUser.displayName || 'Usuario',
              usuario: fbUser.email?.split('@')[0] || 'usuario',
              rol: 'Musician', // Default to Musician
              fotoPerfil: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName}&background=random`,
              fechaRegistro: new Date().toISOString(),
              activo: true
            };

            // Persistir el documento de usuario en Firestore para que las reglas y permisos funcionen correctamente
            try {
              await db.saveUser(userData as any);
              console.log('✅ Usuario persisted en Firestore:', userData.id);
            } catch (err) {
              console.error('❌ Error guardando usuario en Firestore tras login:', err);
            }
          }

          console.log("📋 Rol del usuario:", userData.rol);
          setUser(userData);

          const savedView = localStorage.getItem('ministry_current_view') as AppView;

          // Role-based routing logic (Leader vs Musician)
          const isMusician = userData.rol === 'Musician' || (userData.rol as string).toLowerCase() === 'musico';

          if (savedView && savedView !== AppView.LOGIN) {
            if (isMusician && (savedView === AppView.DASHBOARD || savedView === AppView.TEAM)) {
              setCurrentView(AppView.MUSICIAN_VIEW);
            } else {
              setCurrentView(savedView);
            }
          } else {
            setCurrentView(isMusician ? AppView.MUSICIAN_VIEW : AppView.DASHBOARD);
          }
        } catch (error) {
          console.error("❌ Error al cargar datos del usuario:", error);
        }
      } else {
        setUser(null);
        setCurrentView(AppView.LOGIN);
      }
      setIsInitialized(true);
    });

    return () => unsub();
  }, [hasMounted]);

  // Sync view changes to localStorage
  useEffect(() => {
    if (user && currentView !== AppView.LOGIN) {
      localStorage.setItem('ministry_current_view', currentView);
    }
  }, [currentView, user]);

  const updateAvatar = async (newAvatarBase64: string) => {
    if (!user) {
      console.error("❌ Usuario no autenticado para actualizar avatar");
      alert("Error: Usuario no autenticado");
      return;
    }

    try {
      console.log("📸 Iniciando actualización de foto de perfil...");
      const downloadUrl = await db.uploadProfilePhoto(user.id, newAvatarBase64);
      const updatedUser = { ...user, fotoPerfil: downloadUrl };
      await db.saveUser(updatedUser);
      setUser(updatedUser);
      console.log("✅ Foto de perfil actualizada exitosamente");
    } catch (error) {
      console.error("❌ Error actualizando foto de perfil:", error);
      alert(`Error al actualizar foto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      await db.saveUser(updatedUser as User);
      setUser(updatedUser as User);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    const isMusician = userData.rol === 'Musician' || (userData.rol as string).toLowerCase() === 'musico';
    const startView = isMusician ? AppView.MUSICIAN_VIEW : AppView.DASHBOARD;
    setCurrentView(startView);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setCurrentView(AppView.LOGIN);
    localStorage.removeItem('ministry_current_view');
  };

  const renderView = () => {
    if (!user && currentView !== AppView.LOGIN) {
      return <Login onLogin={handleLogin} />;
    }

    const commonProps = {
      onNavigate: setCurrentView,
      onLogout: handleLogout,
      user: user,
      onUpdateAvatar: updateAvatar,
      onUpdateUser: updateUser
    };

    // Explicit role check for the main dashboard views
    const isLeader = user?.rol === 'Leader' || (user?.rol as string)?.toLowerCase() === 'lider';
    const isMusician = user?.rol === 'Musician' || (user?.rol as string)?.toLowerCase() === 'musico';

    switch (currentView) {
      case AppView.LOGIN:
        return <Login onLogin={handleLogin} />;
      case AppView.DASHBOARD:
        if (isMusician) return <MusicianView {...commonProps} />;
        return <Dashboard {...commonProps} />;
      case AppView.CALENDAR:
        return <Calendar {...commonProps} />;
      case AppView.SONGS:
        return <Songs {...commonProps} />;
      case AppView.TEAM:
        if (isMusician) return <MusicianView {...commonProps} />;
        return <Team {...commonProps} />;
      case AppView.MUSICIAN_VIEW:
        return <MusicianView {...commonProps} />;
      case AppView.NOTICES:
        return <Notices {...commonProps} />;
      default:
        return isMusician ? <MusicianView {...commonProps} /> : <Dashboard {...commonProps} />;
    }
  };

  // Prevent SSR rendering or premature rendering before initialization
  if (!hasMounted || !isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {initError ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error de Conexión</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Cargando Ministerio...</p>
              <p className="text-slate-400 text-[10px] mt-1 italic">Verificando sesión y roles en tiempo real</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <NotificationsProvider>
      <div className="font-display">
        {renderView()}
      </div>
    </NotificationsProvider>
  );
};

export default App;
