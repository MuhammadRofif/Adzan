import React, { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>

        <div className={cn(
          "relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full",
          sizeClasses[size]
        )}>
          {/* Header */}
          <div className="bg-white px-4 py-4 sm:px-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-gray-900 leading-6">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="bg-white px-4 py-5 sm:p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-50/50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
