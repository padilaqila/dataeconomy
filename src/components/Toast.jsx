import React from 'react';
import useUIStore from '../stores/uiStore';

export default function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`px-4 py-2 border-[3px] border-black font-['Archivo_Black'] uppercase tracking-widest text-sm
            ${toast.type === 'success' ? 'bg-[#008000] text-white' : toast.type === 'error' ? 'bg-[#FF0000] text-white' : 'bg-white text-black'}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
