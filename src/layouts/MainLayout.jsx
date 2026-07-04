import React from 'react';
import { useNavigate } from 'react-router-dom';
import ToastContainer from '../components/Toast';
import { ChevronLeft } from 'lucide-react';

export default function MainLayout({ children, title, showBack = false, onBack = null, className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-['Work_Sans'] pb-10">
      <header className="sticky top-0 z-40 bg-white border-b-[3px] border-black p-4 flex items-center min-h-[72px]">
        {showBack && (
          <button 
            onClick={handleBack}
            className="w-[44px] h-[44px] flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors mr-4 flex-shrink-0"
            aria-label="Kembali"
          >
            <ChevronLeft strokeWidth={3} size={24} />
          </button>
        )}
        <h2 className="text-xl md:text-2xl font-['Archivo_Black'] uppercase leading-none truncate">{title || 'Kalkulator SE-2026'}</h2>
      </header>
      
      <main className={`flex-1 w-full max-w-3xl mx-auto p-4 md:p-6 ${className}`}>
        {children}
      </main>

      <ToastContainer />
    </div>
  );
}
