import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickAbsenModal } from '../ui/QuickAbsenModal';

import { useApp } from '../../context/AppContext';
import { Mic, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const DashboardLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { setQuickAbsen } = useApp();
  const [showQuickFloating, setShowQuickFloating] = useState(true);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans relative">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <QuickAbsenModal />


        {/* Quick Action Bubble */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center justify-end pointer-events-none">
          <button 
            onClick={() => setQuickAbsen({ isOpen: true, type: 'none' })}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl animate-fade-in border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:rotate-12 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Catat Absen</p>
              <p className="text-[10px] text-emerald-600 font-bold leading-none">Klik untuk mulai</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
