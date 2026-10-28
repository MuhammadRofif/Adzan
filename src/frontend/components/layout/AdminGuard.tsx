import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminSession } from '../../services/auth';

export const AdminGuard: React.FC = () => {
  const { status } = useAdminSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="w-10 h-10 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin" aria-label="Memeriksa sesi admin" />
      </div>
    );
  }

  if (status !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
