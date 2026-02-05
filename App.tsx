
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

  // Initialize session from Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch user metadata from Firestore
        const users = await db.getUsers();
        let userData = users.find(u => u.id === fbUser.uid);

        if (!userData) {
          // Fallback if not found in Firestore yet
          userData = {
            id: fbUser.uid,
            nombre: fbUser.displayName || 'Usuario',
            usuario: fbUser.email?.split('@')[0] || 'usuario',
            rol: 'Musician',
            fotoPerfil: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName}&background=random`,
            fechaRegistro: new Date().toISOString(),
            activo: true
          };
        }

        setUser(userData);

        const savedView = localStorage.getItem('ministry_current_view') as AppView;
        if (savedView && savedView !== AppView.LOGIN) {
          // Role-based view validation
          if (userData.rol === 'Musician' && (savedView === AppView.DASHBOARD || savedView === AppView.SONGS)) {
            setCurrentView(AppView.MUSICIAN_VIEW);
          } else {
            setCurrentView(savedView);
          }
        } else {
          setCurrentView(userData.rol === 'Musician' ? AppView.MUSICIAN_VIEW : AppView.DASHBOARD);
        }
      } else {
        setUser(null);
        setCurrentView(AppView.LOGIN);
      }
      setIsInitialized(true);
    });

    return () => unsub();
  }, []);

  // Sync view changes to localStorage
  useEffect(() => {
    if (user && currentView !== AppView.LOGIN) {
      localStorage.setItem('ministry_current_view', currentView);
    }
  }, [currentView, user]);

  const updateAvatar = async (newAvatarBase64: string) => {
    if (user) {
      const downloadUrl = await db.uploadProfilePhoto(user.id, newAvatarBase64);
      const updatedUser = { ...user, fotoPerfil: downloadUrl };
      await db.saveUser(updatedUser);
      setUser(updatedUser);
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
    const startView = userData.rol === 'Musician' ? AppView.MUSICIAN_VIEW : AppView.DASHBOARD;
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

    switch (currentView) {
      case AppView.LOGIN:
        return <Login onLogin={handleLogin} />;
      case AppView.DASHBOARD:
        return <Dashboard {...commonProps} />;
      case AppView.CALENDAR:
        return <Calendar {...commonProps} />;
      case AppView.SONGS:
        return <Songs {...commonProps} />;
      case AppView.TEAM:
        return <Team {...commonProps} />;
      case AppView.MUSICIAN_VIEW:
        return <MusicianView {...commonProps} />;
      case AppView.NOTICES:
        return <Notices {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  if (!isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-black uppercase tracking-widest text-xs">Iniciando Portal...</p>
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
