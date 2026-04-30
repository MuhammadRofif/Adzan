import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  setIsMobileOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setIsMobileOpen }) => {
  const { setQuickAbsen } = useApp();
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          
          <div className="hidden sm:flex items-center max-w-md w-full bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:bg-white transition-all duration-200 border border-transparent focus-within:border-primary-300">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari peserta atau aktivitas..." 
              className="bg-transparent border-none outline-none focus:ring-0 text-sm ml-2 w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">


          <Button variant="ghost" className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          
          <div className="hidden sm:block border-l border-gray-200 h-6 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-900 leading-none mb-1">24 Sya'ban 1445 H</p>
              <p className="text-xs text-primary-600 font-medium">Ashar - 15:30</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
