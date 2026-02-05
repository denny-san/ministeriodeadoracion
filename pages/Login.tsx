
import React, { useState } from 'react';
import type { User } from '../types';
import { db } from '../db';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

interface LoginProps {
  onLogin: (user: User, rememberMe: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'Leader' | 'Musician'>('Musician');
  const [newInstrument, setNewInstrument] = useState('Voz');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const instruments = ['Voz', 'Piano', 'Batería', 'Bajo', 'Guitarra', 'Saxofón', 'Coros', 'Director'];

  const normalize = (str: string) => str.replace('@', '').toLowerCase().trim();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const email = `${normalize(identifier)}@church.org`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // After login, we need to fetch the user metadata from Firestore
      const users = await db.getUsers();
      const userData = users.find(u => u.id === userCredential.user.uid);

      if (userData) {
        onLogin(userData, rememberMe);
      } else {
        // Handle case where auth exists but firestore record doesn't (legacy sync issue)
        const fallbackUser: User = {
          id: userCredential.user.uid,
          nombre: userCredential.user.displayName || identifier,
          usuario: identifier,
          rol: 'Musician',
          fotoPerfil: `https://ui-avatars.com/api/?name=${identifier}&background=random`,
          fechaRegistro: new Date().toISOString(),
          activo: true
        };
        onLogin(fallbackUser, rememberMe);
      }
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas o problema de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newName || !newUsername || !newPass) {
      setError("Por favor completa todos los campos.");
      setIsLoading(false);
      return;
    }

    try {
      const username = normalize(newUsername);
      const email = `${username}@church.org`;

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, newPass);
      const uid = userCredential.user.uid;

      // 2. Save Metadata to Firestore
      const newUser: User = {
        id: uid,
        nombre: newName,
        usuario: username,
        rol: newRole,
        fotoPerfil: `https://ui-avatars.com/api/?name=${newName.replace(/\s+/g, '+')}&background=random&color=fff`,
        fechaRegistro: new Date().toISOString(),
        activo: true,
        instrument: newRole === 'Leader' ? 'Liderazgo' : newInstrument,
      };

      await db.saveUser(newUser);
      onLogin(newUser, rememberMe);
    } catch (err: any) {
      console.error("Error completo de Firebase:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este nombre de usuario ya está en uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña es muy corta. Usa al menos 6 caracteres.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("El registro por correo no está habilitado en Firebase Console.");
      } else {
        setError(`Error: ${err.message || "No se pudo completar el registro."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-[#0f172a]">
      <div className="w-full max-w-[420px] animate-fade-in">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative">

          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent-gold to-primary"></div>

          <div className="flex flex-col items-center pt-8 md:pt-10 pb-4 md:pb-6 px-6 md:px-8 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary material-symbols-outlined !text-2xl md:!text-3xl">church</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Ministerio de Adoración</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm mt-1 font-medium italic">
              {isRegistering ? '— Registro de Nuevo Miembro —' : '— Acceso al Portal —'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="px-8 pb-10 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined !text-sm">error</span>
                {error}
              </div>
            )}

            {!isRegistering ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Usuario</label>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                    placeholder="@usuario"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm outline-none dark:text-white"
                    placeholder="Ej. Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Elegir Usuario</label>
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm outline-none dark:text-white"
                    placeholder="@juanperez"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                  <input
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm outline-none dark:text-white"
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 text-center block mb-2">Selecciona tu Rol Ministerial</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRole('Leader')}
                      className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border ${newRole === 'Leader' ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'}`}
                    >
                      Líder
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('Musician')}
                      className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border ${newRole === 'Musician' ? 'bg-accent-gold text-white border-accent-gold shadow-xl shadow-accent-gold/20 scale-[1.02]' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'}`}
                    >
                      Músico
                    </button>
                  </div>
                </div>

                {newRole === 'Musician' && (
                  <div className="space-y-1.5 animate-slide-up">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Tu Instrumento / Voz</label>
                    <div className="relative">
                      <select
                        value={newInstrument}
                        onChange={(e) => setNewInstrument(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 px-4 text-sm outline-none appearance-none dark:text-white cursor-pointer"
                        required
                      >
                        {instruments.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 px-1 py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Recordar mi sesión</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold tracking-wide transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegistering ? 'Registrar y Entrar' : 'Iniciar Sesión'}</span>
                    <span className="material-symbols-outlined !text-lg">{isRegistering ? 'person_add' : 'arrow_forward'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs font-black text-slate-400 hover:text-primary transition-colors underline decoration-slate-200 underline-offset-4"
              >
                {isRegistering ? '¿Ya eres miembro? Inicia sesión' : '¿Nuevo miembro? Envía tu registro'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-8 font-black uppercase tracking-widest">"Sirviendo con excelencia para Su gloria"</p>
      </div>
    </div>
  );
};

export default Login;
