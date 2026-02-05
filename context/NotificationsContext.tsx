
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db';
import { MinistryNotification } from '../types';

interface NotificationsContextType {
  notifications: MinistryNotification[];
  triggerNotification: (tipo: 'crear' | 'editar' | 'eliminar', mensaje: string, dirigidoA: 'musicos' | 'lideres') => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<MinistryNotification[]>([]);

  // Real-time subscription
  useEffect(() => {
    const unsub = db.subscribeNotifications((notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, []);

  const triggerNotification = (tipo: 'crear' | 'editar' | 'eliminar', mensaje: string, dirigidoA: 'musicos' | 'lideres') => {
    db.saveNotification({
      tipo,
      mensaje,
      dirigidoA,
      leido: false
    });
  };

  const markAsRead = (id: string) => {
    db.markNotificationAsRead(id);
  };

  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <NotificationsContext.Provider value={{ notifications, triggerNotification, markAsRead, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
};

// Global helper kept for backward compatibility if needed
export const triggerGlobalNotification = (tipo: 'crear' | 'editar' | 'eliminar', mensaje: string, dirigidoA: 'musicos' | 'lideres') => {
  db.saveNotification({
    tipo,
    mensaje,
    dirigidoA,
    leido: false
  });
};
