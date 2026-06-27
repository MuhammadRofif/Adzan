import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, Gift, Settings, Calendar, Award } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: <Home className="w-5 h-5" /> },
  { name: 'Manajemen Peserta', href: '/admin/participants', icon: <Users className="w-5 h-5" /> },
  { name: 'Jadwal Adzan', href: '/admin/schedule', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Quiz Keislaman', href: '/admin/quiz', icon: <BookOpen className="w-5 h-5" /> },
  { name: 'Redeem Hadiah', href: '/admin/redeem', icon: <Gift className="w-5 h-5" /> },
  { name: 'Pengaturan', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  { name: 'Hall of Fame', href: '/admin/seasons', icon: <Award className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-gray-100 bg-white px-6">
            <div className="flex items-center gap-3 w-full">
              <div className="bg-primary-600 rounded-xl p-2.5 shadow-lg shadow-primary-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-gray-900 leading-tight">Adzan<span className="text-primary-600">Challenge</span></h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/admin'}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }: { isActive: boolean }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <div className={cn("transition-colors duration-200", isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500")}>
                      {item.icon}
                    </div>
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Link to Bocil Dashboard */}
          <div className="px-4 pb-2">
            <a
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            >
              <span className="text-lg">🏠</span>
              Lihat Dashboard Bocil
            </a>
          </div>

          {/* Bottom user card */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 m-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-white shadow-sm flex items-center justify-center text-primary-700 font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Admin Masjid</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
