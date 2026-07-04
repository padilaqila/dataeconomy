import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function Splash() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, session, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="font-['Archivo_Black'] text-4xl md:text-6xl uppercase text-center mb-4 leading-none tracking-tight">
        SE-2026<br/>Kalkulator
      </h1>
      <p className="font-['Space_Mono'] text-sm tracking-[4px] animate-pulse">
        MEMUAT...
      </p>
    </div>
  );
}
