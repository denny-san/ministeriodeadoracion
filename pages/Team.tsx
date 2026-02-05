
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User } from '../types';
import { db } from '../db';
import { useNotifications } from '../context/NotificationsContext';

interface TeamProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const Team: React.FC<TeamProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<User>>({});
  const { triggerNotification } = useNotifications();

  useEffect(() => {
    const unsub = db.subscribeUsers((users) => {
      setMembers(users);
    });
    return () => unsub();
  }, []);

  const handleVerify = async (userId: string) => {
    const member = members.find(m => m.id === userId);
    if (member) {
      await db.saveUser({ ...member, activo: true });
      triggerNotification('editar', `${member.nombre} ha sido verificado.`, 'musicos');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar a este integrante del ministerio?')) {
      await db.deleteUser(id);
      triggerNotification('eliminar', `Un integrante ha sido removido.`, 'lideres');
    }
  };

  const isLeader = user?.rol === 'Leader';

  return (
    <Layout activeView={AppView.TEAM} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Gestión de Músicos" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Ministerio Activo</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white italic">Directorio Ministerial</h1>
            <span className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary">{members.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
            {!member.activo && (
              <div className="absolute top-4 right-4 animate-pulse">
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Pendiente</span>
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img src={member.fotoPerfil} className="size-20 rounded-[28px] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-xl" alt="" />
                <div className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-white dark:border-slate-900 ${member.activo ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-0.5">{member.nombre}</h3>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary mb-4">{member.instrument || member.rol}</p>

              <div className="flex flex-col gap-2 w-full">
                {!member.activo && isLeader && (
                  <button onClick={() => handleVerify(member.id)} className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                    Verificar Perfil
                  </button>
                )}
                {isLeader && member.id !== user?.id && (
                  <button onClick={() => handleDelete(member.id)} className="w-full py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Team;
