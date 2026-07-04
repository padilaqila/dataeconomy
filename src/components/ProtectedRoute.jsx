import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function ProtectedRoute({ children, requirePayment = true }) {
  const { session, isLoading, isLifetimePaid } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="font-['Space_Mono'] text-sm tracking-[4px] animate-pulse">MEMUAT...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requirePayment && !isLifetimePaid) {
    if (location.pathname !== '/payment' && location.pathname !== '/payment-status') {
      return <Navigate to="/payment" replace />;
    }
  }

  return children;
}
