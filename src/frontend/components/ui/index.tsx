import React from 'react';
import { cn } from '../../utils/cn';

// ─── Badge ────────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'active' | 'inactive' | 'new' | 'pending' | 'approved' | 'rejected'; className?: string; }
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'active', className }) => {
  const variants = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    new: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>{children}</span>;
};

// ─── Input ────────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="label">{label}</label>}
    <input id={id} ref={ref} className={cn('input', error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20', className)} {...props} />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Select ────────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; }
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, className, id, children, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="label">{label}</label>}
    <select id={id} ref={ref} className={cn('input appearance-none cursor-pointer', className)} {...props}>{children}</select>
  </div>
));
Select.displayName = 'Select';

// ─── Card ────────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; }
export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={cn('card p-6', className)}>{children}</div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────────
interface EmptyStateProps { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-gray-300 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────────
interface SectionHeaderProps { title: string; subtitle?: string; action?: React.ReactNode; }
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  <div className="section-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; className?: string; color?: string; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, className, color = 'bg-primary-500' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn('w-full bg-gray-100 rounded-full h-2', className)}>
      <div className={cn('h-2 rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────────
import { Modal } from './Modal';
import { Button } from './Button';
interface ConfirmDialogProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; variant?: 'danger' | 'primary'; }
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Konfirmasi', variant = 'primary' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
    footer={<>
      <Button variant={variant} onClick={() => { onConfirm(); onClose(); }} className="w-full sm:w-auto sm:ml-3">{confirmText}</Button>
      <Button variant="ghost" onClick={onClose} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
    </>}
  >
    <p className="text-sm text-gray-600">{message}</p>
  </Modal>
);
