import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { signInAdmin } from '../services/auth';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await signInAdmin(email.trim(), password);
    setBusy(false);
    if (res.ok) {
      navigate('/admin');
    } else {
      setError(res.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 via-sky-50 to-mint-50 px-4">
      <div className={cn(
        'w-full max-w-sm bg-white rounded-3xl shadow-xl border border-sky-100 p-8 animate-fade-in',
        shake && 'animate-shake'
      )}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-mint-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <span className="text-3xl" aria-hidden>🔒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 font-heading">
            Admin <span className="text-sky-600">Login</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Masuk dengan akun admin Supabase</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@contoh.com"
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl p-3.5 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 placeholder-slate-400"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Masukkan password..."
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl p-3.5 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 placeholder-slate-400"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5" role="alert">
                <span aria-hidden>❌</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-to-r from-sky-500 to-mint-500 text-white font-bold py-3.5 px-5 rounded-xl shadow-md shadow-sky-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {busy ? 'Memeriksa...' : 'Masuk ke Panel Admin 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-slate-400 hover:text-sky-600 transition-colors">
            ← Kembali ke Dashboard Bocil
          </a>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
