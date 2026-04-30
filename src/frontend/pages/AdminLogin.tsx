import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

const ADMIN_PASSWORD = 'rofif123';

export const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Password salah! Coba lagi.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 px-4">
      <div className={cn(
        'w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in',
        shake && 'animate-shake'
      )}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 font-heading">
            Admin <span className="text-emerald-600">Login</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Masukkan password untuk akses panel admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Masukkan password..."
              className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl p-3.5 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 placeholder-gray-400"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                <span>❌</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 px-5 rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Masuk ke Panel Admin 🚀
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
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
