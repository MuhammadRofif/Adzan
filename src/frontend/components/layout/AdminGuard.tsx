import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const AdminGuard: React.FC = () => {
  const isAuth = sessionStorage.getItem('admin_auth') === 'true';

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
