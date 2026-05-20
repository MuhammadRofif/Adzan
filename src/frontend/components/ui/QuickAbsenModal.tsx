import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { CheckCircle2, Mic } from 'lucide-react';
import { cn } from '../../utils/cn';

export const QuickAbsenModal: React.FC = () => {
  const { quickAbsen, setQuickAbsen } = useApp();
  const navigate = useNavigate();

  if (!quickAbsen.isOpen) return null;

  const handleAction = (type: 'attendance' | 'adzan' | 'sholawat_iqomah') => {
    setQuickAbsen({ isOpen: false, type: 'none' });
    navigate(`/admin/participants?action=${type}`);
  };

  return (
    <Modal 
      isOpen={quickAbsen.isOpen} 
      onClose={() => setQuickAbsen({ isOpen: false, type: 'none' })}
      title="Pilih Jenis Absensi"
      size="sm"
    >
      <div className="grid grid-cols-1 gap-3 p-1">
        <button 
          onClick={() => handleAction('attendance')}
          className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-500 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Absen Latihan</h3>
            <p className="text-emerald-700/70 text-xs">Sikap & Kehadiran</p>
          </div>
        </button>

        <button 
          onClick={() => handleAction('sholawat_iqomah')}
          className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
            <span className="text-2xl">📿</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Absen Sholawat + Iqomah</h3>
            <p className="text-blue-700/70 text-xs">Catat tarhim + iqomah</p>
          </div>
        </button>

        <button 
          onClick={() => handleAction('adzan')}
          className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-primary-100 bg-primary-50 hover:bg-primary-100 hover:border-primary-500 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 bg-white text-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Absen Adzan</h3>
            <p className="text-primary-700/70 text-xs">Catat kumandang adzan</p>
          </div>
        </button>
      </div>
      
      <p className="mt-4 text-center text-xs text-gray-400">
        Klik salah satu untuk membuka daftar peserta massal
      </p>
    </Modal>
  );
};
