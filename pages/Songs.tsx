
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AppView, User, Song } from '../types';
import { db } from '../db';

interface SongsProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateUser?: (updatedData: Partial<User>) => void;
}

const Songs: React.FC<SongsProps> = ({ onNavigate, onLogout, user, onUpdateAvatar, onUpdateUser }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Partial<Song>>({});

  useEffect(() => {
    const unsub = db.subscribeSongs((sngs) => {
      setSongs(sngs);
    });
    return () => unsub();
  }, []);

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong.nombre || !editingSong.artista) return;

    await db.saveSong({
      ...editingSong,
      creadoPor: user?.id || 'Sistema'
    });
    setIsModalOpen(false);
    setEditingSong({});
  };

  const handleDeleteSong = async (id: string) => {
    if (confirm('¿Eliminar esta canción permanentemente?')) {
      await db.deleteSong(id);
    }
  };

  const openModal = (song?: Song) => {
    setEditingSong(song || { nombre: '', artista: '', tonalidad: 'C', diaAsignado: 'domingo' });
    setIsModalOpen(true);
  };

  return (
    <Layout activeView={AppView.SONGS} onNavigate={onNavigate} onLogout={onLogout} user={user} title="Gestión de Repertorio" onUpdateAvatar={onUpdateAvatar} onUpdateUser={onUpdateUser}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-1">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-2 md:mb-3">Base de Datos Musical</p>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white italic">Canciones y Repertorio</h1>
            <p className="text-slate-500 font-bold text-xs md:text-lg opacity-80 italic">Gestiona el catálogo de adoración con excelencia.</p>
          </div>
          <button onClick={() => openModal()} className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined !text-lg">add_circle</span>
            Nueva Canción
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map(song => (
            <div key={song.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">music_note</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(song)} className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => handleDeleteSong(song.id)} className="size-10 rounded-xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{song.nombre}</h3>
              <p className="text-sm font-bold text-slate-400 mb-4">{song.artista}</p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{song.tonalidad}</span>
                <span className="px-3 py-1 bg-primary/5 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">{song.diaAsignado}</span>
              </div>
              {song.link && (
                <a href={song.link} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-primary hover:text-white transition-all">
                  <span className="material-symbols-outlined !text-sm">play_circle</span>
                  Ver Recurso
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10">
            <div className="p-10 pb-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">Detalles de la Canción</h3>
            </div>
            <form onSubmit={handleSaveSong} className="p-10 pt-4 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Canción</label>
                <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" value={editingSong.nombre || ''} onChange={(e) => setEditingSong({ ...editingSong, nombre: e.target.value })} placeholder="Ej. Way Maker" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Artista / Autor</label>
                <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" value={editingSong.artista || ''} onChange={(e) => setEditingSong({ ...editingSong, artista: e.target.value })} placeholder="Ej. Sinach" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tonalidad</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-sm font-bold outline-none" value={editingSong.tonalidad || ''} onChange={(e) => setEditingSong({ ...editingSong, tonalidad: e.target.value })} placeholder="Ej. G#" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Día Asignado</label>
                  <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-sm font-bold outline-none appearance-none" value={editingSong.diaAsignado} onChange={(e) => setEditingSong({ ...editingSong, diaAsignado: e.target.value as any })}>
                    <option value="jueves">Jueves</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Referencia</label>
                <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" value={editingSong.link || ''} onChange={(e) => setEditingSong({ ...editingSong, link: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Songs;
