import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

export const Toast: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  };

  return (
    <div className={cn(
      "fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in max-w-sm",
      colors[toast.type]
    )}>
      {icons[toast.type]}
      <p className="text-sm font-medium text-gray-800">{toast.message}</p>
    </div>
  );
};
